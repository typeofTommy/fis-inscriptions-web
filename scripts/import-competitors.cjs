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
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

// Database connection setup
console.log("Connecting to database...");
const sql = neon(process.env.DATABASE_URL);

// Define the competitors table schema
const competitors = {
  tableName: "competitors",
  schema: "inscriptionsDB",
  columns: {
    listid: {name: "listid"},
    listname: {name: "listname"},
    listpublished: {name: "listpublished"},
    published: {name: "published"},
    sectorcode: {name: "sectorcode"},
    status: {name: "status"},
    competitorid: {name: "competitorid"},
    fiscode: {name: "fiscode"},
    lastname: {name: "lastname"},
    firstname: {name: "firstname"},
    nationcode: {name: "nationcode"},
    gender: {name: "gender"},
    birthdate: {name: "birthdate"},
    skiclub: {name: "skiclub"},
    nationalcode: {name: "nationalcode"},
    competitorname: {name: "competitorname"},
    birthyear: {name: "birthyear"},
    calculationdate: {name: "calculationdate"},
    dhpoints: {name: "dhpoints"},
    dhpos: {name: "dhpos"},
    dhsta: {name: "dhsta"},
    slpoints: {name: "slpoints"},
    slpos: {name: "slpos"},
    slsta: {name: "slsta"},
    gspoints: {name: "gspoints"},
    gspos: {name: "gspos"},
    gssta: {name: "gssta"},
    sgpoints: {name: "sgpoints"},
    sgpos: {name: "sgpos"},
    sgsta: {name: "sgsta"},
    acpoints: {name: "acpoints"},
    acpos: {name: "acpos"},
    acsta: {name: "acsta"},
  },
};

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
          const batch = records.slice(i, i + batchSize);
          console.log(
            `Processing batch ${i / batchSize + 1} of ${Math.ceil(
              records.length / batchSize
            )}...`
          );

          for (const record of batch) {
            if (!record.competitorid) {
              console.warn(
                "Skipping record due to missing competitorid:",
                record
              );
              continue;
            }

            // Construct SQL for upsert
            const query = `
              INSERT INTO "${competitors.schema}"."${competitors.tableName}" (
                listid, listname, listpublished, published, sectorcode, status, competitorid,
                fiscode, lastname, firstname, nationcode, gender, birthdate, skiclub,
                nationalcode, competitorname, birthyear, calculationdate, dhpoints, dhpos,
                dhsta, slpoints, slpos, slsta, gspoints, gspos, gssta, sgpoints, sgpos,
                sgsta, acpoints, acpos, acsta
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32, $33
              )
              ON CONFLICT (competitorid) DO UPDATE SET
                listid = $1, listname = $2, listpublished = $3, published = $4,
                sectorcode = $5, status = $6, fiscode = $8, lastname = $9,
                firstname = $10, nationcode = $11, gender = $12, birthdate = $13,
                skiclub = $14, nationalcode = $15, competitorname = $16, birthyear = $17,
                calculationdate = $18, dhpoints = $19, dhpos = $20, dhsta = $21,
                slpoints = $22, slpos = $23, slsta = $24, gspoints = $25, gspos = $26,
                gssta = $27, sgpoints = $28, sgpos = $29, sgsta = $30, acpoints = $31,
                acpos = $32, acsta = $33
            `;

            // Execute the query with parameters
            await sql(query, [
              record.listid,
              record.listname,
              record.listpublished,
              record.published,
              record.sectorcode,
              record.status,
              record.competitorid,
              record.fiscode,
              record.lastname,
              record.firstname,
              record.nationcode,
              record.gender,
              record.birthdate,
              record.skiclub,
              record.nationalcode,
              record.competitorname,
              record.birthyear,
              record.calculationdate,
              record.dhpoints,
              record.dhpos,
              record.dhsta,
              record.slpoints,
              record.slpos,
              record.slsta,
              record.gspoints,
              record.gspos,
              record.gssta,
              record.sgpoints,
              record.sgpos,
              record.sgsta,
              record.acpoints,
              record.acpos,
              record.acsta,
            ]);
          }
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
