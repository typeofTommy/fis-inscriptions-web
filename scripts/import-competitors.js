import fs from "fs";
import {parse} from "csv-parse";
import {db} from "../app/db/inscriptionsDB.js"; // Adjust path and add .js extension if needed
import {competitors} from "../drizzle/schemaInscriptions.js"; // Adjust path and add .js extension if needed

const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error(
    "Error: Please provide the path to the CSV file as an argument."
  );
  process.exit(1);
}

const processFile = async () => {
  const records = [];
  const parser = fs.createReadStream(csvFilePath).pipe(
    parse({
      columns: true, // Use the first row as header
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Convert empty strings for integer columns to null
        const integerColumns = [
          "listid",
          "listpublished",
          "published",
          "competitorid",
          "birthyear",
        ];
        if (integerColumns.includes(context.column) && value === "") {
          return null;
        }
        // Attempt to cast birthyear to integer, handle potential errors
        if (context.column === "birthyear") {
          const year = parseInt(value, 10);
          return isNaN(year) ? null : year;
        }
        // Convert empty strings for potentially numeric text fields to null if desired,
        // but schema defines them as text, so keeping as string is safer unless DB handles casting.
        // Example: if (['dhpoints', 'dhpos', /* etc... */].includes(context.column) && value === '') return null;
        return value; // Keep others as string as per schema
      },
    })
  );

  parser.on("readable", function () {
    let record;
    while ((record = parser.read()) !== null) {
      // Map CSV columns to database schema columns
      const competitorData = {
        listid: record.Listid,
        listname: record.Listname,
        listpublished: record.listPublished, // Corrected case based on CSV header
        published: record.Published,
        sectorcode: record.Sectorcode,
        status: record.Status,
        competitorid: record.Competitorid,
        fiscode: record.Fiscode,
        lastname: record.Lastname,
        firstname: record.Firstname,
        nationcode: record.Nationcode,
        gender: record.Gender,
        birthdate: record.Birthdate, // Keep as text
        skiclub: record.Skiclub,
        nationalcode: record.Nationalcode,
        competitorname: record.Competitorname,
        birthyear: record.Birthyear,
        calculationdate: record.Calculationdate, // Keep as text
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
      for (const record of records) {
        if (!record.competitorid) {
          console.warn("Skipping record due to missing competitorid:", record);
          continue;
        }
        // Prepare data, ensuring numeric fields intended as numbers are numbers
        const dataToUpsert = {
          ...record,
          listid: record.listid ? parseInt(record.listid, 10) : null,
          listpublished: record.listpublished
            ? parseInt(record.listpublished, 10)
            : null,
          published: record.published ? parseInt(record.published, 10) : null,
          competitorid: parseInt(record.competitorid, 10),
          birthyear: record.birthyear ? parseInt(record.birthyear, 10) : null,
        };

        // Remove competitorid from the fields to update
        const updateData = {...dataToUpsert};
        delete updateData.competitorid;

        await db.insert(competitors).values(dataToUpsert).onConflictDoUpdate({
          target: competitors.competitorid,
          set: updateData,
        });
      }

      console.log(`Successfully processed ${records.length} records.`);
    } catch (error) {
      console.error("Error upserting data to database:", error);
      process.exit(1);
    }

    console.log("CSV file successfully processed.");
  });
};

processFile();
