const {PDFDocument, rgb, StandardFonts} = require("pdf-lib");
const fs = require("fs");

async function generateFISFormPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([900, 1200]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // --- EN-TÊTE ---
  // Bandeau jaune
  page.drawRectangle({
    x: 0,
    y: 1160,
    width: 900,
    height: 12,
    color: rgb(1, 0.8, 0.1),
  });
  // Bandeau bleu
  page.drawRectangle({
    x: 0,
    y: 1145,
    width: 900,
    height: 8,
    color: rgb(0.1, 0.3, 0.7),
  });

  // Logo FIS (placeholder)
  page.drawRectangle({
    x: 30,
    y: 1100,
    width: 70,
    height: 70,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("LOGO FIS", {
    x: 38,
    y: 1130,
    size: 12,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Titre
  page.drawText("ENTRY FORM", {
    x: 120,
    y: 1150,
    size: 24,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText("FORMULAIRE D'INSCRIPTION", {
    x: 120,
    y: 1125,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText("ANMELDUNGSFORMULAR", {
    x: 120,
    y: 1105,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });

  // --- BLOC INFOS COMPÉTITION ---
  // Rectangle principal
  page.drawRectangle({
    x: 30,
    y: 950,
    width: 840,
    height: 140,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  // Séparation verticale pour 2/3 - 1/3
  const infoSplitX = 30 + Math.floor((2 / 3) * 840);
  page.drawLine({
    start: {x: infoSplitX, y: 950},
    end: {x: infoSplitX, y: 1090},
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Première ligne : Competition (gauche), Date of race (droite)
  page.drawText("Competition", {x: 40, y: 1060, size: 12, font});
  page.drawText("FIS", {x: 40, y: 1040, size: 16, font, color: rgb(0, 0, 0)});
  page.drawText("Prali (ITA)", {
    x: 40,
    y: 1020,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText("Date of race", {x: infoSplitX + 10, y: 1060, size: 12, font});
  page.drawText("11/04/2025 - 12/04/2025", {
    x: infoSplitX + 10,
    y: 1040,
    size: 14,
    font,
  });

  // Deuxième ligne : Responsible for Entry (gauche), National Association (droite)
  page.drawText("Responsible for Entry", {x: 40, y: 1000, size: 10, font});
  page.drawText("Philippe MARTIN", {x: 40, y: 985, size: 12, font});
  page.drawText("Mobile :+33 666 49 28 99", {x: 40, y: 970, size: 12, font});
  page.drawText("Mail :pmartin@ffs.fr", {x: 40, y: 955, size: 12, font});

  page.drawText("National Association", {
    x: infoSplitX + 10,
    y: 1000,
    size: 10,
    font,
  });
  page.drawText("FEDERATION FRANCAISE DE SKI", {
    x: infoSplitX + 10,
    y: 985,
    size: 12,
    font,
  });
  page.drawText("2 rue René Dumond- Meythet", {
    x: infoSplitX + 10,
    y: 970,
    size: 12,
    font,
  });
  page.drawText("74960 ANNECY", {x: infoSplitX + 10, y: 955, size: 12, font});

  // Logo fédé (placeholder)
  page.drawRectangle({
    x: infoSplitX + 180,
    y: 960,
    width: 60,
    height: 60,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("LOGO FFS", {
    x: infoSplitX + 185,
    y: 990,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- NOUVEAU TABLEAU CODEX (en-dessous du bloc infos) ---
  const codexData = [
    {codex: "CODEX 1", discipline: "SL", category: "FIS"},
    {codex: "CODEX 2", discipline: "SL", category: "NC"},
    {codex: "CODEX 3", discipline: "GH", category: "ENL"},
    {codex: "CODEX 4", discipline: "DH", category: "CHI"},
  ];
  const startX = 30,
    startY = 900,
    cellWidth = 210,
    cellHeight = 40;
  // Header
  codexData.forEach((col, i) => {
    page.drawRectangle({
      x: startX + i * cellWidth,
      y: startY,
      width: cellWidth,
      height: cellHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
    page.drawText(col.codex, {
      x: startX + i * cellWidth + 20,
      y: startY + cellHeight / 2 + 5,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
  });
  // Disciplines
  codexData.forEach((col, i) => {
    page.drawRectangle({
      x: startX + i * cellWidth,
      y: startY - cellHeight,
      width: cellWidth,
      height: cellHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
    page.drawText(col.discipline, {
      x: startX + i * cellWidth + 20,
      y: startY - cellHeight + cellHeight / 2 + 5,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
  });
  // Catégories
  codexData.forEach((col, i) => {
    page.drawRectangle({
      x: startX + i * cellWidth,
      y: startY - 2 * cellHeight,
      width: cellWidth,
      height: cellHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
    page.drawText(col.category, {
      x: startX + i * cellWidth + 20,
      y: startY - 2 * cellHeight + cellHeight / 2 + 5,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
  });

  // --- TABLEAU COMPÉTITEURS ---
  const tableStartY = startY - 2 * cellHeight - 40;
  const tableCols = [
    {label: "FIS Code", width: 80},
    {label: "Surname, First Name", width: 200},
    {label: "YB", width: 40},
    {label: "DH", width: 40},
    {label: "SG", width: 40},
    {label: "GS", width: 40},
    {label: "SL", width: 40},
    {label: "AC", width: 40},
    {label: "NTE", width: 40},
    {label: "Arrival", width: 80},
    {label: "Departure", width: 80},
  ];
  // Header
  let colX = startX;
  tableCols.forEach((col) => {
    page.drawRectangle({
      x: colX,
      y: tableStartY,
      width: col.width,
      height: 30,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95),
    });
    page.drawText(col.label, {
      x: colX + 5,
      y: tableStartY + 10,
      size: 10,
      font,
    });
    colX += col.width;
  });
  // Fake data
  const competitors = [
    [
      "6191657",
      "BLANCHET Titouan",
      "2006",
      "",
      "",
      "",
      "44.00",
      "",
      "",
      "10.04.25",
      "12.04.25",
    ],
    [
      "6191785",
      "FRAGASSI Sacha",
      "2007",
      "",
      "",
      "",
      "",
      "",
      "",
      "10.04.25",
      "11/04 only",
    ],
    [
      "6191696",
      "GRAVIER Axel",
      "2006",
      "",
      "",
      "",
      "50.36",
      "",
      "",
      "10.04.25",
      "12.04.25",
    ],
    [
      "6191801",
      "NORAZ Thibault",
      "2007",
      "",
      "",
      "",
      "",
      "",
      "",
      "10.04.25",
      "11/04 only",
    ],
  ];
  let rowY = tableStartY - 30;
  competitors.forEach((row) => {
    colX = startX;
    row.forEach((cell, i) => {
      page.drawRectangle({
        x: colX,
        y: rowY,
        width: tableCols[i].width,
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });
      page.drawText(cell, {x: colX + 5, y: rowY + 10, size: 10, font});
      colX += tableCols[i].width;
    });
    rowY -= 30;
  });

  // --- FOOTER / SIGNATURE ---
  page.drawText("Entry with FIS points ...", {x: 30, y: 120, size: 10, font});
  page.drawText("Entry Without FIS points ...", {
    x: 30,
    y: 105,
    size: 10,
    font,
  });
  page.drawText("No entry ...", {x: 30, y: 90, size: 10, font});
  page.drawText("Philippe MARTIN", {x: 700, y: 90, size: 12, font});
  // Placeholder signature
  page.drawRectangle({
    x: 700,
    y: 60,
    width: 120,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("SIGNATURE", {
    x: 720,
    y: 65,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- BANDEAU BAS ---
  page.drawRectangle({
    x: 0,
    y: 30,
    width: 900,
    height: 8,
    color: rgb(0.1, 0.3, 0.7),
  });
  page.drawRectangle({
    x: 0,
    y: 18,
    width: 900,
    height: 8,
    color: rgb(1, 0.8, 0.1),
  });

  // --- SAUVEGARDE ---
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync("fis-entry-form.pdf", pdfBytes);
  console.log("PDF généré : fis-entry-form.pdf");
}

generateFISFormPdf();
