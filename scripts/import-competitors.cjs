// CommonJS script for FIS competitors import
const fs = require("fs");
const {parse} = require("csv-parse");
const {neon} = require("@neondatabase/serverless");

// Get the path to the CSV file from command-line arguments
const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.error(
    "Error: Please provide the path to the CSV file as an argument."
  );
  process.exit(1);
}

// Check for database URL
if (!process.env.NEON_DATABASE_URL) {
  console.error(
    "Error: No database URL environment variable is set. Need NEON_DATABASE_URL or NEON_DATABASE_URL."
  );
  process.exit(1);
}

// Database connection setup
console.log("Connecting to database...");
const sql = neon(process.env.NEON_DATABASE_URL);

// Process the CSV file and update the database
async function processFile() {
  try {
    console.log(`Reading CSV file: ${csvFilePath}`);
    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: CSV file not found at path: ${csvFilePath}`);
      process.exit(1);
    }

    // Parse the CSV file
    const records = [];
    const parser = fs.createReadStream(csvFilePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    );

    // Collect all records
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        // Map CSV columns to database schema columns
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

    // Handle errors
    parser.on("error", function (err) {
      console.error("Error parsing CSV:", err.message);
      process.exit(1);
    });

    // Process the collected records
    parser.on("end", async function () {
      console.log(`Parsed ${records.length} records from CSV.`);
      if (records.length === 0) {
        console.log("No records to import.");
        return;
      }

      try {
        console.log("Starting database upsert...");

        // Process records in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records
            .slice(i, i + batchSize)
            .filter((r) => r.competitorid);
          console.log(
            `Processing batch ${i / batchSize + 1} of ${Math.ceil(
              records.length / batchSize
            )}...`
          );

          if (batch.length === 0) continue;

          // Prepare the columns and values for bulk insert
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

          // Build the VALUES part
          const values = batch.map((record) =>
            columns.map((col) => record[col])
          );

          // Build the ON CONFLICT update part
          const updateSet = columns
            .filter((col) => col !== "competitorid")
            .map((col) => `"${col}" = EXCLUDED."${col}"`)
            .join(", ");

          // Use parameterized query for all values
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
}

// Run the process
processFile();
