#!/usr/bin/env node
const fs = require("fs");
const https = require("https");
const path = require("path");
const {parse} = require("csv-parse");
const {neon} = require("@neondatabase/serverless");

const BASE_URL =
  "https://data.fis-ski.com/fis_athletes/ajax/fispointslistfunctions/export_fispointslist.html?export_csv=true&sectorcode=AL&seasoncode=2025&listid=";
const LAST_LISTID_FILE = path.join(__dirname, ".last-listid");
const CSV_FILENAME = process.argv[2] || "FIS-points-list.csv";
const MAX_ATTEMPTS = 50; // Sécurité pour éviter une boucle infinie

// Check for database URL
defaultEnvCheck();

function defaultEnvCheck() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error(
      "Error: No database URL environment variable is set. Need NEON_DATABASE_URL."
    );
    process.exit(1);
  }
}

const fetchCsv = (listid) => {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + listid;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
};

const isValidCsv = (csv, expectedListid) => {
  if (!csv || csv.trim().length < 100) return false;
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return false;
  const header = lines[0];
  const firstData = lines[1];
  // Vérifie les colonnes clés
  if (
    !header.includes("Listid") ||
    !header.includes("Competitorid") ||
    !header.includes("Fiscode")
  )
    return false;
  // Vérifie la première valeur de la première ligne de données
  const firstCell = firstData.split(",")[0];
  if (String(firstCell).trim() !== String(expectedListid)) return false;
  return true;
};

const readLastListId = () => {
  try {
    return parseInt(fs.readFileSync(LAST_LISTID_FILE, "utf8"), 10);
  } catch {
    return 417; // Valeur par défaut
  }
};

const writeLastListId = (listid) => {
  fs.writeFileSync(LAST_LISTID_FILE, String(listid), "utf8");
};

const sql = neon(process.env.NEON_DATABASE_URL);

const importCsvToDb = async (csvFilePath) => {
  try {
    console.log(`Reading CSV file: ${csvFilePath}`);
    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: CSV file not found at path: ${csvFilePath}`);
      process.exit(1);
    }
    const records = [];
    const parser = fs.createReadStream(csvFilePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    );
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        const competitorData = {
          listid: parseInt(record.Listid) || null,
          listname: record.Listname,
          listpublished: parseInt(record.listPublished) || null,
          published: parseInt(record.Published) || null,
          sectorcode: record.Sectorcode,
          status: record.Status,
          competitorid: parseInt(record.Competitorid),
          fiscode: record.Fiscode,
          lastname: record.Lastname,
          firstname: record.Firstname,
          nationcode: record.Nationcode,
          gender: record.Gender,
          birthdate: record.Birthdate,
          skiclub: record.Skiclub,
          nationalcode: record.Nationalcode,
          competitorname: record.Competitorname,
          birthyear: parseInt(record.Birthyear) || null,
          calculationdate: record.Calculationdate,
          dhpoints: record.DHpoints,
          dhpos: record.DHpos,
          dhsta: record.DHSta,
          slpoints: record.SLpoints,
          slpos: record.SLpos,
          slsta: record.SLSta,
          gspoints: record.GSpoints,
          gspos: record.GSpos,
          gssta: record.GSSta,
          sgpoints: record.SGpoints,
          sgpos: record.SGpos,
          sgsta: record.SGSta,
          acpoints: record.ACpoints,
          acpos: record.ACpos,
          acsta: record.ACSta,
        };
        records.push(competitorData);
      }
    });
    parser.on("error", function (err) {
      console.error("Error parsing CSV:", err.message);
      process.exit(1);
    });
    parser.on("end", async function () {
      console.log(`Parsed ${records.length} records from CSV.`);
      if (records.length === 0) {
        console.log("No records to import.");
        return;
      }
      try {
        console.log("Starting database upsert...");
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records
            .slice(i, i + batchSize)
            .filter((r) => r.competitorid);
          console.log(
            `Processing batch ${i / batchSize + 1} of ${Math.ceil(records.length / batchSize)}...`
          );
          if (batch.length === 0) continue;
          const columns = [
            "listid",
            "listname",
            "listpublished",
            "published",
            "sectorcode",
            "status",
            "competitorid",
            "fiscode",
            "lastname",
            "firstname",
            "nationcode",
            "gender",
            "birthdate",
            "skiclub",
            "nationalcode",
            "competitorname",
            "birthyear",
            "calculationdate",
            "dhpoints",
            "dhpos",
            "dhsta",
            "slpoints",
            "slpos",
            "slsta",
            "gspoints",
            "gspos",
            "gssta",
            "sgpoints",
            "sgpos",
            "sgsta",
            "acpoints",
            "acpos",
            "acsta",
          ];
          const values = batch.map((record) =>
            columns.map((col) => record[col])
          );
          const updateSet = columns
            .filter((col) => col !== "competitorid")
            .map((col) => `"${col}" = EXCLUDED."${col}"`)
            .join(", ");
          const flatValues = values.flat();
          const valuePlaceholders = values
            .map(
              (_, rowIdx) =>
                `(${columns
                  .map(
                    (_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`
                  )
                  .join(", ")})`
            )
            .join(", ");
          const sqlText = `INSERT INTO "inscriptionsDB"."competitors" (
            ${columns.map((col) => `"${col}"`).join(", ")}
          ) VALUES ${valuePlaceholders}
          ON CONFLICT (competitorid) DO UPDATE SET ${updateSet}`;
          await sql.query(sqlText, flatValues);
        }
        console.log(`Successfully processed ${records.length} records.`);
      } catch (error) {
        console.error("Error upserting data to database:", error);
        process.exit(1);
      }
      console.log("CSV file successfully processed.");
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    process.exit(1);
  }
};

const main = async () => {
  // 1. Recherche du dernier listid valide et téléchargement du CSV
  let listid = readLastListId();
  let lastValidListId = listid;
  let lastValidCsv = "";
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS) {
    const csv = await fetchCsv(listid);
    if (isValidCsv(csv, listid)) {
      lastValidListId = listid;
      lastValidCsv = csv;
      listid++;
      attempts++;
    } else {
      break;
    }
  }
  if (!lastValidCsv) {
    throw new Error("Aucune version valide du CSV trouvée.");
  }
  fs.writeFileSync(CSV_FILENAME, lastValidCsv, "utf8");
  writeLastListId(lastValidListId);
  console.log(
    `Dernier listid valide: ${lastValidListId}. CSV sauvegardé dans ${CSV_FILENAME}`
  );
  // 2. Import du CSV dans la base de données
  await importCsvToDb(CSV_FILENAME);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
