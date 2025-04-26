import {
  mysqlTable,
  primaryKey,
  unique,
  int,
  varchar,
  tinyint,
  decimal,
  datetime,
  timestamp,
  index,
  char,
  date,
  json,
  smallint,
  text,
} from "drizzle-orm/mysql-core";
import {sql} from "drizzle-orm";

export const aBiogs = mysqlTable(
  "A_biogs",
  {
    recid: int("Recid").autoincrement().notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    birthnation: varchar("Birthnation", {length: 5}),
    birthplace: varchar("Birthplace", {length: 45}),
    nickname: varchar("Nickname", {length: 45}),
    children: tinyint("Children"),
    residence: varchar("Residence", {length: 80}),
    residencenation: varchar("Residencenation", {length: 5}),
    education: varchar("Education", {length: 100}),
    occupation: varchar("Occupation", {length: 100}),
    languages: varchar("Languages", {length: 100}),
    hobbies: varchar("Hobbies", {length: 100}),
    websiteurl: varchar("Websiteurl", {length: 100}),
    height: decimal("Height", {precision: 5, scale: 2}),
    weight: decimal("Weight", {precision: 5, scale: 2}),
    webcomments: varchar("Webcomments", {length: 200}),
    comments: varchar("Comments", {length: 100}),
    webdisplay: tinyint("Webdisplay").default(1),
    clubnation: varchar("Clubnation", {length: 5}),
    nationalcoach: varchar("Nationalcoach", {length: 50}),
    nationalcoachnation: varchar("Nationalcoachnation", {length: 5}),
    personalcoach: varchar("Personalcoach", {length: 50}),
    personalcoachnation: varchar("Personalcoachnation", {length: 5}),
    debut: int("Debut"),
    nationaldebut: int("Nationaldebut"),
    debutwcpoints: varchar("Debutwcpoints", {length: 50}),
    debutwc: varchar("Debutwc", {length: 50}),
    debutwcpodium: varchar("Debutwcpodium", {length: 50}),
    othersports: varchar("Othersports", {length: 150}),
    majorinjuries: varchar("Majorinjuries", {length: 150}),
    maritalstatus: varchar("Maritalstatus", {length: 30}),
    skis: varchar("Skis", {length: 30}),
    skis2: varchar("Skis2", {length: 30}),
    bindings: varchar("Bindings", {length: 30}),
    bindings2: varchar("Bindings2", {length: 30}),
    boots: varchar("Boots", {length: 30}),
    boots2: varchar("Boots2", {length: 30}),
    helmet: varchar("Helmet", {length: 30}),
    suit: varchar("Suit", {length: 30}),
    gloves: varchar("Gloves", {length: 30}),
    glasses: varchar("Glasses", {length: 30}),
    poles: varchar("Poles", {length: 30}),
    stance: varchar("Stance", {length: 1}),
    photo: tinyint("Photo").default(0),
    marital: varchar("Marital", {length: 30}),
    // Warning: Can't parse blob from database
    // blobType: blob("Picture"),
    picturedate: datetime("Picturedate", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    primaryKey({columns: [table.recid], name: "A_biogs_Recid"}),
    unique("Compet").on(table.competitorid),
  ]
);

export const aCompetitor = mysqlTable(
  "A_competitor",
  {
    competitorid: int("Competitorid").autoincrement().notNull(),
    personid: int("Personid"),
    ipcid: int("Ipcid"),
    type: varchar("Type", {length: 100}).default("athlete"),
    sectorcode: char("Sectorcode", {length: 3}).default("").notNull(),
    fiscode: int("Fiscode"),
    lastname: varchar("Lastname", {length: 50}),
    firstname: varchar("Firstname", {length: 50}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    birthdate: date("Birthdate", {mode: "string"}),
    nationcode: varchar("Nationcode", {length: 5}),
    nationalcode: varchar("Nationalcode", {length: 15}),
    skiclub: varchar("Skiclub", {length: 100}),
    association: varchar("Association", {length: 5}),
    status: char("Status", {length: 1}),
    statusOld: char("Status_old", {length: 1}),
    statusBy: int("Status_by"),
    statusDate: timestamp("Status_date", {mode: "string"}),
    statusnextlist: char("Statusnextlist", {length: 1}),
    alternatenamecheck: varchar("Alternatenamecheck", {length: 50}),
    fee: decimal("Fee", {precision: 10, scale: 2}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    dateofcreation: date("Dateofcreation", {mode: "string"}),
    createdby: int("Createdby"),
    injury: tinyint("Injury").default(0),
    version: int("Version"),
    compidmssql: int("Compidmssql"),
    carving: tinyint("Carving").default(0),
    photo: tinyint("Photo").default(0).notNull(),
    notallowed: tinyint("Notallowed").default(0),
    natteam: varchar("Natteam", {length: 30}),
    tragroup: varchar("Tragroup", {length: 30}),
    published: int("Published").default(1).notNull(),
    doped: tinyint("Doped").default(0),
    team: tinyint("Team").default(0).notNull(),
    photoBig: tinyint("Photo_big", {unsigned: true}).default(0).notNull(),
    data: json("Data"),
    lastupdateby: int("Lastupdateby"),
    disciplines: json("Disciplines"),
    deletedat: timestamp("Deletedat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Namegen").on(
      table.sectorcode,
      table.gender,
      table.lastname,
      table.firstname
    ),
    index("Name").on(table.sectorcode, table.lastname, table.firstname),
    index("SectorName").on(
      table.sectorcode,
      table.gender,
      table.status,
      table.lastname,
      table.firstname
    ),
    index("Fiscode").on(table.sectorcode, table.fiscode),
    index("datec").on(
      table.sectorcode,
      table.dateofcreation,
      table.competitorid
    ),
    index("Oldid").on(table.compidmssql),
    index("LastFirstFiscodeCompid").on(
      table.competitorid,
      table.sectorcode,
      table.fiscode,
      table.lastname,
      table.firstname
    ),
    index("LastFirstGenFiscodeCompid").on(
      table.competitorid,
      table.sectorcode,
      table.fiscode,
      table.lastname,
      table.firstname,
      table.gender
    ),
    index("A_competitor_Ipcid_index").on(table.ipcid),
    index("A_competitor_Personid_index").on(table.personid),
    index("idx_competitor_competitorid").on(table.competitorid),
    primaryKey({
      columns: [table.competitorid],
      name: "A_competitor_Competitorid",
    }),
    unique("CompetitoridSector").on(table.competitorid, table.sectorcode),
  ]
);

export const aCup = mysqlTable(
  "A_cup",
  {
    recid: int("Recid").autoincrement().notNull(),
    sectorcode: char("Sectorcode", {length: 3}).default("").notNull(),
    cupcode: varchar("Cupcode", {length: 10}).notNull(),
    description: varchar("Description", {length: 40}).default("").notNull(),
    displayorder: smallint("Displayorder").notNull(),
    inuse: char("Inuse", {length: 1}).default("").notNull(),
    published: tinyint("Published"),
    decimalprecision: tinyint("Decimalprecision", {unsigned: true}),
    calculatedByCupsprocessor: tinyint("CalculatedByCupsprocessor", {
      unsigned: true,
    })
      .default(0)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("cup").on(table.sectorcode, table.cupcode),
    primaryKey({columns: [table.recid], name: "A_cup_Recid"}),
  ]
);

export const aCupresult = mysqlTable(
  "A_cupresult",
  {
    recid: int("Recid").autoincrement().notNull(),
    sectorcode: char("Sectorcode", {length: 3}).default("").notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    cupid: varchar("Cupid", {length: 10}).notNull(),
    disciplinecode: varchar("Disciplinecode", {length: 5})
      .default("")
      .notNull(),
    afterxrace: tinyint("Afterxrace").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    lastname: varchar("Lastname", {length: 50}),
    firstname: varchar("Firstname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    gender: char("Gender", {length: 1}).default("").notNull(),
    rank: int("Rank").default(0).notNull(),
    points: decimal("Points", {precision: 10, scale: 2}).default("0.00"),
    exaequo: char("Exaequo", {length: 200}).default(
      "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    ),
    lastupdate: timestamp("Lastupdate", {mode: "string"}).defaultNow(),
  },
  (table) => [
    index("Cup").on(
      table.seasoncode,
      table.sectorcode,
      table.cupid,
      table.disciplinecode,
      table.afterxrace,
      table.competitorid
    ),
    index("Compet").on(
      table.competitorid,
      table.seasoncode,
      table.cupid,
      table.disciplinecode,
      table.afterxrace
    ),
    index("idx_cupcompsect").on(table.competitorid, table.sectorcode),
    primaryKey({columns: [table.recid], name: "A_cupresult_Recid"}),
  ]
);

export const aDiscipline = mysqlTable(
  "A_discipline",
  {
    recid: int("Recid").autoincrement().notNull(),
    sectorcode: char("Sectorcode", {length: 3}).notNull(),
    disciplinecode: char("Disciplinecode", {length: 8}).notNull(),
    description: varchar("Description", {length: 50}).notNull(),
    displayorder: smallint("Displayorder").notNull(),
    disciplineid: smallint("Disciplineid").notNull(),
    inuse: char("Inuse", {length: 1}).notNull(),
    fispoints: tinyint("Fispoints").default(0).notNull(),
    published: tinyint("Published").default(0).notNull(),
    disciplineforlist: char("Disciplineforlist", {length: 8})
      .default("0")
      .notNull(),
    validforraces: tinyint("Validforraces").default(0).notNull(),
    shortreport: tinyint("Shortreport").default(0).notNull(),
    validforOwg: tinyint("ValidforOWG").default(1).notNull(),
    validforWsc: tinyint("ValidforWSC").default(1).notNull(),
    timeprecision: int("Timeprecision").default(100),
    disciplineforcup: varchar("Disciplineforcup", {length: 20}),
    disciplinegroupid: int("Disciplinegroupid"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("disc").on(table.sectorcode, table.disciplinecode),
    index("id").on(table.disciplineid),
    index("ordre").on(table.sectorcode, table.displayorder),
    primaryKey({columns: [table.recid], name: "A_discipline_Recid"}),
  ]
);

export const aEvent = mysqlTable(
  "A_event",
  {
    eventid: int("Eventid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    sectorcode: char("Sectorcode", {length: 3}).default("").notNull(),
    eventname: varchar("Eventname", {length: 100}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startdate: date("Startdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    enddate: date("Enddate", {mode: "string"}),
    nationcodeplace: char("Nationcodeplace", {length: 3}).default("").notNull(),
    orgnationcode: char("Orgnationcode", {length: 3}).default("").notNull(),
    place: varchar("Place", {length: 40}).default("").notNull(),
    published: tinyint("Published").default(0).notNull(),
    orgaddressL1: varchar("OrgaddressL1", {length: 70}),
    orgaddressL2: varchar("OrgaddressL2", {length: 70}),
    orgaddressL3: varchar("OrgaddressL3", {length: 70}),
    orgaddressL4: varchar("OrgaddressL4", {length: 70}),
    orgtel: varchar("Orgtel", {length: 50}),
    orgmobile: varchar("Orgmobile", {length: 50}),
    orgfax: varchar("Orgfax", {length: 50}),
    orgEmail: varchar("OrgEmail", {length: 100}),
    orgemailentries: varchar("Orgemailentries", {length: 100}),
    orgemailaccomodation: varchar("Orgemailaccomodation", {length: 100}),
    orgemailtransportation: varchar("Orgemailtransportation", {length: 100}),
    orgWebsite: varchar("OrgWebsite", {length: 200}),
    socialmedia: varchar("Socialmedia", {length: 250}),
    eventnotes: varchar("Eventnotes", {length: 100}),
    languageused: char("Languageused", {length: 1}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 30}),
    td1Nation: varchar("Td1nation", {length: 5}),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 30}),
    td2Nation: varchar("Td2nation", {length: 5}),
    orgfee: decimal("Orgfee", {precision: 8, scale: 2}),
    bill: tinyint("Bill"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    billdate: date("Billdate", {mode: "string"}),
    selcat: varchar("Selcat", {length: 50}),
    seldis: varchar("Seldis", {length: 50}),
    seldisl: varchar("Seldisl", {length: 50}),
    seldism: varchar("Seldism", {length: 50}),
    dispdate: varchar("Dispdate", {length: 20}),
    discomment: varchar("Discomment", {length: 40}),
    version: int("Version"),
    nationeventid: int("Nationeventid"),
    proveventid: int("Proveventid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    nextracedate: date("Nextracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    lastracedate: date("Lastracedate", {mode: "string"}),
    tdletter: int("TDletter").default(0),
    orgaddressid: int("Orgaddressid"),
    tournament: tinyint("Tournament").default(0),
    parenteventid: int("Parenteventid"),
    placeid: int("Placeid"),
    timezone: varchar("Timezone", {length: 50}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Eventdate").on(
      table.sectorcode,
      table.seasoncode,
      table.startdate,
      table.eventid
    ),
    index("Eventplace").on(
      table.sectorcode,
      table.place,
      table.startdate,
      table.eventid
    ),
    index("Eventnation").on(
      table.sectorcode,
      table.seasoncode,
      table.orgnationcode,
      table.startdate,
      table.eventid
    ),
    index("idxLastupdate").on(table.lastupdate),
    primaryKey({columns: [table.eventid], name: "A_event_Eventid"}),
  ]
);

export const aListcategoryal = mysqlTable(
  "A_listcategoryal",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategoryal_Recid"}),
  ]
);

export const aListcategorycc = mysqlTable(
  "A_listcategorycc",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategorycc_Recid"}),
  ]
);

export const aListcategoryfs = mysqlTable(
  "A_listcategoryfs",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategoryfs_Recid"}),
  ]
);

export const aListcategorygs = mysqlTable(
  "A_listcategorygs",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategorygs_Recid"}),
  ]
);

export const aListcategoryma = mysqlTable(
  "A_listcategoryma",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategoryma_Recid"}),
  ]
);

export const aListcategorysb = mysqlTable(
  "A_listcategorysb",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategorysb_Recid"}),
  ]
);

export const aListcategoryss = mysqlTable(
  "A_listcategoryss",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategoryss_Recid"}),
  ]
);

export const aListcategorytm = mysqlTable(
  "A_listcategorytm",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    catcode: char("Catcode", {length: 8}),
    gender: char("Gender", {length: 1}),
    minfispoints: decimal("Minfispoints", {precision: 8, scale: 2}),
    maxfispoints: decimal("Maxfispoints", {precision: 8, scale: 2}),
    adder: decimal("Adder", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("categ").on(table.listid, table.catcode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listcategorytm_Recid"}),
  ]
);

export const aListdefal = mysqlTable(
  "A_listdefal",
  {
    listalid: int("Listalid").default(0).notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdefal_Listid"}),
  ]
);

export const aListdefcc = mysqlTable(
  "A_listdefcc",
  {
    listalid: int("Listalid").default(0).notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdefcc_Listid"}),
  ]
);

export const aListdeffs = mysqlTable(
  "A_listdeffs",
  {
    listalid: int("Listalid").default(0).notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdeffs_Listid"}),
  ]
);

export const aListdefgs = mysqlTable(
  "A_listdefgs",
  {
    recid: int("Recid").notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdefgs_Listid"}),
  ]
);

export const aListdefma = mysqlTable(
  "A_listdefma",
  {
    listalid: int("Listalid").default(0).notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdefma_Listid"}),
  ]
);

export const aListdefsb = mysqlTable(
  "A_listdefsb",
  {
    listalid: int("Listalid").default(0).notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdefsb_Listid"}),
  ]
);

export const aListdefss = mysqlTable(
  "A_listdefss",
  {
    recid: int("Recid").notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdefss_Listid"}),
  ]
);

export const aListdeftm = mysqlTable(
  "A_listdeftm",
  {
    recid: int("Recid").notNull(),
    listid: int("Listid").autoincrement().notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    listnumber: int("Listnumber").default(0).notNull(),
    listname: varchar("Listname", {length: 50}),
    speciallist: tinyint("Speciallist"),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    printdeadline: date("Printdeadline", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    calculationdate: date("Calculationdate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startracedate: date("Startracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endracedate: date("Endracedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validfrom: date("Validfrom", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validto: date("Validto", {mode: "string"}),
    published: tinyint("Published"),
    version: int("Version"),
    tocalculateat: datetime("Tocalculateat", {mode: "string"}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("list").on(table.seasoncode, table.listnumber),
    primaryKey({columns: [table.listid], name: "A_listdeftm_Listid"}),
  ]
);

export const aListdisciplineal = mysqlTable(
  "A_listdisciplineal",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 5}),
    gender: char("Gender", {length: 1}),
    xvalue: decimal("Xvalue", {precision: 8, scale: 2}),
    yvalue: decimal("Yvalue", {precision: 8, scale: 2}),
    zvalue: decimal("Zvalue", {precision: 8, scale: 2})
      .default("0.00")
      .notNull(),
    minpenalty: decimal("Minpenalty", {precision: 8, scale: 2}),
    maxpenalty: decimal("Maxpenalty", {precision: 8, scale: 2}),
    fvalue: decimal("Fvalue", {precision: 8, scale: 2}),
    maxpoints: decimal("Maxpoints", {precision: 8, scale: 2}),
    injuryminpen: decimal("Injuryminpen", {precision: 8, scale: 2}),
    injurymaxpen: decimal("Injurymaxpen", {precision: 8, scale: 2}),
    injurypercentage: decimal("Injurypercentage", {precision: 8, scale: 2}),
    version: int("Version"),
    adder0: int("Adder0").default(0),
    adder1: int("Adder1").default(0),
    adder2: int("Adder2").default(0),
    adder3: int("Adder3").default(0),
    adder4: int("Adder4").default(0),
    adder5: int("Adder5").default(0),
    adder6: int("Adder6").default(0),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("disc").on(table.listid, table.disciplinecode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listdisciplineal_Recid"}),
  ]
);

export const aListdisciplinetm = mysqlTable(
  "A_listdisciplinetm",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 5}),
    gender: char("Gender", {length: 1}),
    xvalue: decimal("Xvalue", {precision: 8, scale: 2}),
    yvalue: decimal("Yvalue", {precision: 8, scale: 2}),
    zvalue: decimal("Zvalue", {precision: 8, scale: 2})
      .default("0.00")
      .notNull(),
    minpenalty: decimal("Minpenalty", {precision: 8, scale: 2}),
    maxpenalty: decimal("Maxpenalty", {precision: 8, scale: 2}),
    fvalue: decimal("Fvalue", {precision: 8, scale: 2}),
    maxpoints: decimal("Maxpoints", {precision: 8, scale: 2}),
    injuryminpen: decimal("Injuryminpen", {precision: 8, scale: 2}),
    injurymaxpen: decimal("Injurymaxpen", {precision: 8, scale: 2}),
    injurypercentage: decimal("Injurypercentage", {precision: 8, scale: 2}),
    version: int("Version"),
    adder0: int("Adder0").default(0),
    adder1: int("Adder1").default(0),
    adder2: int("Adder2").default(0),
    adder3: int("Adder3").default(0),
    adder4: int("Adder4").default(0),
    adder5: int("Adder5").default(0),
    adder6: int("Adder6").default(0),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("disc").on(table.listid, table.disciplinecode, table.gender),
    primaryKey({columns: [table.recid], name: "A_listdisciplinetm_Recid"}),
  ]
);

export const aListresultal = mysqlTable(
  "A_listresultal",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    version: int("Version"),
    pointspreviouslist: decimal("Pointspreviouslist", {precision: 8, scale: 2}),
    pourcentpreviouslist: decimal({precision: 8, scale: 2}).default("0.00"),
    countlistsamestatus: int("Countlistsamestatus").default(0),
    pourcent: decimal({precision: 8, scale: 2}).default("0.00"),
    realpoints: decimal("Realpoints", {precision: 8, scale: 2}),
    blessevalide: int().default(1),
    youthpoints: decimal("Youthpoints", {precision: 11, scale: 2}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("compet").on(table.listid, table.competitorid, table.disciplinecode),
    index("rank").on(table.listid, table.disciplinecode, table.position),
    primaryKey({columns: [table.recid], name: "A_listresultal_Recid"}),
  ]
);

export const aListresultcc = mysqlTable(
  "A_listresultcc",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    raceid4: int("Raceid4"),
    raceid5: int("Raceid5"),
    raceid6: int("Raceid6"),
    version: int("Version"),
    youthpoints: decimal("Youthpoints", {precision: 11, scale: 2}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("compet").on(table.listid, table.competitorid, table.disciplinecode),
    index("rank").on(table.listid, table.disciplinecode, table.position),
    primaryKey({columns: [table.recid], name: "A_listresultcc_Recid"}),
  ]
);

export const aListresultfs = mysqlTable(
  "A_listresultfs",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    raceid4: int("Raceid4"),
    raceid5: int("Raceid5"),
    raceid6: int("Raceid6"),
    realpoints: decimal("Realpoints", {precision: 8, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("compet").on(table.listid, table.competitorid, table.disciplinecode),
    index("rank").on(table.listid, table.disciplinecode, table.position),
    primaryKey({columns: [table.recid], name: "A_listresultfs_Recid"}),
  ]
);

export const aListresultgs = mysqlTable(
  "A_listresultgs",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    version: int("Version"),
    pointsdebseason: decimal("Pointsdebseason", {precision: 8, scale: 2}),
    realpoints: decimal("Realpoints", {precision: 8, scale: 2}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("compet").on(table.listid, table.competitorid, table.disciplinecode),
    index("rank").on(table.listid, table.disciplinecode, table.position),
    primaryKey({columns: [table.recid], name: "A_listresultgs_Recid"}),
  ]
);

export const aListresultma = mysqlTable(
  "A_listresultma",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    version: int("Version"),
    pointspreviouslist: decimal("Pointspreviouslist", {precision: 8, scale: 2}),
    pourcentpreviouslist: decimal({precision: 8, scale: 2}),
    countlistsamestatus: int("Countlistsamestatus").default(0),
    pourcent: decimal({precision: 8, scale: 2}).default("0.00"),
    realpoints: decimal("Realpoints", {precision: 8, scale: 2}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("compet").on(table.listid, table.competitorid, table.disciplinecode),
    index("rank").on(table.listid, table.disciplinecode, table.position),
    primaryKey({columns: [table.recid], name: "A_listresultma_Recid"}),
  ]
);

export const aListresultsb = mysqlTable(
  "A_listresultsb",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    realpoints: decimal("Realpoints", {precision: 8, scale: 2}),
    version: int("Version"),
    ties: char("Ties", {length: 30}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("compet").on(table.listid, table.competitorid, table.disciplinecode),
    index("rank").on(table.listid, table.disciplinecode, table.position),
    primaryKey({columns: [table.recid], name: "A_listresultsb_Recid"}),
  ]
);

export const aListresultss = mysqlTable(
  "A_listresultss",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    version: int("Version"),
    pointspreviouslist: decimal("Pointspreviouslist", {precision: 8, scale: 2}),
    pourcentpreviouslist: decimal({precision: 8, scale: 2}).default("0.00"),
    countlistsamestatus: int("Countlistsamestatus").default(0),
    pourcent: decimal({precision: 8, scale: 2}).default("0.00"),
    realpoints: decimal("Realpoints", {precision: 8, scale: 2}),
    blessevalide: int().default(1),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("compet").on(table.listid, table.competitorid, table.disciplinecode),
    index("rank").on(table.listid, table.disciplinecode, table.position),
    primaryKey({columns: [table.recid], name: "A_listresultss_Recid"}),
  ]
);

export const aListresulttm = mysqlTable(
  "A_listresulttm",
  {
    recid: int("Recid").autoincrement().notNull(),
    listid: int("Listid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    disciplinecode: char("Disciplinecode", {length: 3}),
    fispoints: decimal("Fispoints", {precision: 8, scale: 2}),
    position: int("Position"),
    penalty: char("Penalty", {length: 1}),
    active: char("Active", {length: 1}),
    avenumresults: int("Avenumresults"),
    fixedbyfis: tinyint("Fixedbyfis"),
    raceid1: int("Raceid1"),
    raceid2: int("Raceid2"),
    raceid3: int("Raceid3"),
    version: int("Version"),
    pointspreviouslist: decimal("Pointspreviouslist", {precision: 8, scale: 2}),
    pourcentpreviouslist: decimal({precision: 8, scale: 2}).default("0.00"),
    countlistsamestatus: int("Countlistsamestatus").default(0),
    pourcent: decimal({precision: 8, scale: 2}).default("0.00"),
    realpoints: decimal("Realpoints", {precision: 8, scale: 2}),
    blessevalide: int().default(1),
    youthpoints: decimal("Youthpoints", {precision: 11, scale: 2}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    primaryKey({columns: [table.recid], name: "A_listresulttm_Recid"}),
  ]
);

export const aRaceal = mysqlTable(
  "A_raceal",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay"),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("idxLastupdate").on(table.lastupdate),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_raceal_Raceid"}),
  ]
);

export const aRacecc = mysqlTable(
  "A_racecc",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit").default(0).notNull(),
    masse: tinyint("Masse").default(0).notNull(),
    relay: tinyint("Relay").default(0).notNull(),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0).notNull(),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_catcode_seasoncode_gender_disciplinecode").on(
      table.catcode,
      table.seasoncode,
      table.gender
    ),
    index("idx_level").on(table.level),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racecc_Raceid"}),
  ]
);

export const aRacefs = mysqlTable(
  "A_racefs",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay"),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racefs_Raceid"}),
  ]
);

export const aRacejp = mysqlTable(
  "A_racejp",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay").default(0).notNull(),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 35}),
    livestatus2: varchar("Livestatus2", {length: 35}),
    livestatus3: varchar("Livestatus3", {length: 35}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racejp_Raceid"}),
  ]
);

export const aRacema = mysqlTable(
  "A_racema",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay"),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racema_Raceid"}),
  ]
);

export const aRacenk = mysqlTable(
  "A_racenk",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay"),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racenk_Raceid"}),
  ]
);

export const aRacesb = mysqlTable(
  "A_racesb",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay"),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racesb_Raceid"}),
  ]
);

export const aRacess = mysqlTable(
  "A_racess",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay"),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racess_Raceid"}),
  ]
);

export const aRacetm = mysqlTable(
  "A_racetm",
  {
    raceid: int("Raceid").autoincrement().notNull(),
    eventid: int("Eventid").default(0).notNull(),
    seasoncode: int("Seasoncode").default(0).notNull(),
    racecodex: int("Racecodex", {unsigned: true}),
    disciplineid: tinyint("Disciplineid"),
    disciplinecode: char("Disciplinecode", {length: 8}),
    catcode: varchar("Catcode", {length: 8}),
    catcode2: varchar("Catcode2", {length: 5}),
    catcode3: varchar("Catcode3", {length: 5}),
    catcode4: varchar("Catcode4", {length: 5}),
    gender: char("Gender", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    racedate: date("Racedate", {mode: "string"}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starteventdate: date("Starteventdate", {mode: "string"}),
    description: varchar("Description", {length: 80}),
    place: varchar("Place", {length: 40}),
    nationcode: varchar("Nationcode", {length: 5}),
    td1Id: int("Td1id"),
    td1Name: varchar("Td1name", {length: 80}),
    td1Nation: char("Td1nation", {length: 3}),
    td1Code: int("Td1code"),
    td2Id: int("Td2id"),
    td2Name: varchar("Td2name", {length: 80}),
    td2Nation: char("Td2nation", {length: 3}),
    td2Code: int("Td2code"),
    calstatuscode: char("Calstatuscode", {length: 1}),
    procstatuscode: char("Procstatuscode", {length: 1}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    receiveddate: date("Receiveddate", {mode: "string"}),
    pursuit: tinyint("Pursuit"),
    masse: tinyint("Masse"),
    relay: tinyint("Relay"),
    distance: varchar("Distance", {length: 10}),
    hill: varchar("Hill", {length: 10}),
    style: char("Style", {length: 1}),
    qualif: tinyint("Qualif"),
    finale: tinyint("Finale"),
    homol: varchar("Homol", {length: 20}),
    webcomment: varchar("Webcomment", {length: 40}),
    displaystatus: varchar("Displaystatus", {length: 15}),
    fisinterncomment: varchar("Fisinterncomment", {length: 30}),
    published: tinyint("Published"),
    validforfispoints: tinyint("Validforfispoints"),
    usedfislist: int("Usedfislist"),
    tolist: int("Tolist"),
    discforlistcode: char("Discforlistcode", {length: 8}),
    calculatedpenalty: decimal("Calculatedpenalty", {precision: 10, scale: 2}),
    appliedpenalty: decimal("Appliedpenalty", {precision: 10, scale: 2}),
    appliedscala: int("Appliedscala"),
    penscafixed: tinyint("Penscafixed"),
    version: int("Version"),
    nationraceid: int("Nationraceid"),
    provraceid: int("Provraceid"),
    msql7Evid: int("Msql7evid"),
    mssql7Id: int("Mssql7id"),
    results: tinyint("Results").default(0),
    pdf: tinyint("Pdf").default(0),
    topbanner: int("Topbanner"),
    bottombanner: int("Bottombanner"),
    toplogo: int("Toplogo"),
    bottomlogo: int("Bottomlogo"),
    gallery: int("Gallery"),
    indi: tinyint("Indi").default(0),
    team: tinyint("Team").default(0),
    tabcount: int("Tabcount", {unsigned: true}).default(0),
    columncount: int("Columncount", {unsigned: true}).default(0),
    level: varchar("Level", {length: 10}).default(""),
    hloc1: varchar("Hloc1", {length: 10}),
    hloc2: varchar("Hloc2", {length: 10}),
    hloc3: varchar("Hloc3", {length: 10}),
    hcet1: varchar("Hcet1", {length: 10}),
    hcet2: varchar("Hcet2", {length: 10}),
    hcet3: varchar("Hcet3", {length: 10}),
    live: tinyint("Live"),
    livestatus1: varchar("Livestatus1", {length: 30}),
    livestatus2: varchar("Livestatus2", {length: 30}),
    livestatus3: varchar("Livestatus3", {length: 30}),
    liveinfo1: varchar("Liveinfo1", {length: 255}),
    liveinfo2: varchar("Liveinfo2", {length: 255}),
    liveinfo3: varchar("Liveinfo3", {length: 255}),
    passwd: varchar("Passwd", {length: 10}),
    timinglogo: varchar("Timinglogo", {length: 15}),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    validdate: date("Validdate", {mode: "string"}),
    noepr: int("Noepr").default(0).notNull(),
    tddoc: int("TDdoc").default(0),
    timingreport: int("Timingreport").default(0),
    specialCupPoints: int("Special_cup_points").default(0),
    skipWcsl: int("Skip_wcsl").default(0),
    validforowg: int("Validforowg", {unsigned: true})
      .default(sql`0`)
      .notNull(),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Evrace").on(table.eventid, table.raceid),
    index("Evracefull").on(table.seasoncode, table.eventid, table.racedate),
    index("Codex").on(table.seasoncode, table.racecodex),
    index("sql7").on(table.mssql7Id),
    index("provid").on(table.provraceid),
    index("idx_eventid").on(table.eventid),
    primaryKey({columns: [table.raceid], name: "A_racetm_Raceid"}),
  ]
);

export const aResultal = mysqlTable(
  "A_resultal",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    status2: varchar("Status2", {length: 5}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    timer1: varchar("Timer1", {length: 15}),
    timer2: varchar("Timer2", {length: 15}),
    timer3: varchar("Timer3", {length: 15}),
    timetot: varchar("Timetot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    timer1Int: int("Timer1int").default(0),
    timer2Int: int("Timer2int").default(0),
    timer3Int: int("Timer3int").default(0),
    timetotint: int("Timetotint").default(0),
    racepointsreceived: varchar("Racepointsreceived", {length: 15}),
    listfispoints: decimal("Listfispoints", {precision: 10, scale: 2}).default(
      "99999.99"
    ),
    ptsmax: int("Ptsmax").default(99999),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    index("idxLastupdate").on(table.lastupdate),
    primaryKey({columns: [table.recid], name: "A_resultal_Recid"}),
  ]
);

export const aResultcc = mysqlTable(
  "A_resultcc",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    position: int("Position"),
    pf: tinyint("Pf").default(0),
    status2: varchar("Status2", {length: 20}),
    bib: int("Bib"),
    bibcolor: varchar("Bibcolor", {length: 10}),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    stage: varchar("Stage", {length: 15}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    timer1: varchar("Timer1", {length: 15}),
    timer2: varchar("Timer2", {length: 15}),
    timer3: varchar("Timer3", {length: 15}),
    timetot: varchar("Timetot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    bonustime: varchar("Bonustime", {length: 15}),
    bonuscuppoints: decimal("Bonuscuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    rg1: int("Rg1"),
    rg2: int("Rg2"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    index("Competitorid").on(table.competitorid),
    index("idx_cuppoints_status").on(table.cuppoints, table.status),
    index("idx_competitorid_cuppoints").on(table.competitorid, table.cuppoints),
    primaryKey({columns: [table.recid], name: "A_resultcc_Recid"}),
  ]
);

export const aResultccteam = mysqlTable(
  "A_resultccteam",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    teamid: int("Teamid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    position: int("Position"),
    status2: varchar("Status2", {length: 20}),
    bib: int("Bib"),
    bibcolor: varchar("Bibcolor", {length: 10}),
    leg: tinyint("Leg"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    stage: varchar("Stage", {length: 15}),
    level: tinyint("Level"),
    timer1: varchar("Timer1", {length: 15}),
    timer2: varchar("Timer2", {length: 15}),
    timer3: varchar("Timer3", {length: 15}),
    timetot: varchar("Timetot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    leveltext: varchar("Leveltext", {length: 20}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    rg1: int("Rg1"),
    rg2: int("Rg2"),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultccteam_Recid"}),
  ]
);

export const aResultfs = mysqlTable(
  "A_resultfs",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    status2: varchar("Status2", {length: 5}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    stage: varchar("Stage", {length: 10}),
    j1R1: varchar("J1r1", {length: 6}),
    j2R1: varchar("J2r1", {length: 6}),
    j3R1: varchar("J3r1", {length: 6}),
    j4R1: varchar("J4r1", {length: 6}),
    j5R1: varchar("J5r1", {length: 6}),
    totr1: varchar("Totr1", {length: 15}),
    j1R2: varchar("J1r2", {length: 6}),
    j2R2: varchar("J2r2", {length: 6}),
    j3R2: varchar("J3r2", {length: 6}),
    j4R2: varchar("J4r2", {length: 6}),
    j5R2: varchar("J5r2", {length: 6}),
    totr2: varchar("Totr2", {length: 15}),
    tot: varchar("Tot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    details: text("Details"),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultfs_Recid"}),
  ]
);

export const aResultgs = mysqlTable(
  "A_resultgs",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    status2: varchar("Status2", {length: 5}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    timer1: varchar("Timer1", {length: 15}),
    timer2: varchar("Timer2", {length: 15}),
    timer3: varchar("Timer3", {length: 15}),
    timetot: varchar("Timetot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    timer1Int: int("Timer1int").default(0),
    timer2Int: int("Timer2int").default(0),
    timer3Int: int("Timer3int").default(0),
    timetotint: int("Timetotint").default(0),
    racepointsreceived: varchar("Racepointsreceived", {length: 15}),
    listfispoints: decimal("Listfispoints", {precision: 10, scale: 2}),
    ptsmax: int("Ptsmax").default(99999),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultgs_Recid"}),
  ]
);

export const aResultjp = mysqlTable(
  "A_resultjp",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    status2: varchar("Status2", {length: 20}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    stage: varchar("Stage", {length: 10}),
    j1R1: varchar("J1r1", {length: 6}),
    j2R1: varchar("J2r1", {length: 6}),
    j3R1: varchar("J3r1", {length: 6}),
    j4R1: varchar("J4r1", {length: 6}),
    j5R1: varchar("J5r1", {length: 6}),
    speedr1: varchar("Speedr1", {length: 6}),
    distr1: varchar("Distr1", {length: 6}),
    disptsr1: varchar("Disptsr1", {length: 6}),
    judptsr1: varchar("Judptsr1", {length: 6}),
    totrun1: varchar("Totrun1", {length: 6}),
    posr1: varchar("Posr1", {length: 6}),
    statusr1: varchar("Statusr1", {length: 20}),
    j1R2: varchar("J1r2", {length: 6}),
    j2R2: varchar("J2r2", {length: 6}),
    j3R2: varchar("J3r2", {length: 6}),
    j4R2: varchar("J4r2", {length: 6}),
    j5R2: varchar("J5r2", {length: 6}),
    speedr2: varchar("Speedr2", {length: 6}),
    distr2: varchar("Distr2", {length: 6}),
    disptsr2: varchar("Disptsr2", {length: 6}),
    judptsr2: varchar("Judptsr2", {length: 6}),
    totrun2: varchar("Totrun2", {length: 6}),
    posr2: varchar("Posr2", {length: 6}),
    statusr2: varchar("Statusr2", {length: 20}),
    j1R3: varchar("J1r3", {length: 6}),
    j2R3: varchar("J2r3", {length: 6}),
    j3R3: varchar("J3r3", {length: 6}),
    j4R3: varchar("J4r3", {length: 6}),
    j5R3: varchar("J5r3", {length: 6}),
    speedr3: varchar("Speedr3", {length: 6}),
    distr3: varchar("Distr3", {length: 6}),
    disptsr3: varchar("Disptsr3", {length: 6}),
    judptsr3: varchar("Judptsr3", {length: 6}),
    totrun3: varchar("Totrun3", {length: 6}),
    posr3: varchar("Posr3", {length: 6}),
    statusr3: varchar("Statusr3", {length: 20}),
    j1R4: varchar("J1r4", {length: 6}),
    j2R4: varchar("J2r4", {length: 6}),
    j3R4: varchar("J3r4", {length: 6}),
    j4R4: varchar("J4r4", {length: 6}),
    j5R4: varchar("J5r4", {length: 6}),
    speedr4: varchar("Speedr4", {length: 6}),
    distr4: varchar("Distr4", {length: 6}),
    disptsr4: varchar("Disptsr4", {length: 6}),
    judptsr4: varchar("Judptsr4", {length: 6}),
    gater1: varchar("Gater1", {length: 6}),
    gater2: varchar("Gater2", {length: 6}),
    gater3: varchar("Gater3", {length: 6}),
    gater4: varchar("Gater4", {length: 6}),
    gateptsr1: varchar("Gateptsr1", {length: 6}),
    gateptsr2: varchar("Gateptsr2", {length: 6}),
    gateptsr3: varchar("Gateptsr3", {length: 6}),
    gateptsr4: varchar("Gateptsr4", {length: 6}),
    windr1: varchar("Windr1", {length: 6}),
    windr2: varchar("Windr2", {length: 6}),
    windr3: varchar("Windr3", {length: 6}),
    windr4: varchar("Windr4", {length: 6}),
    windptsr1: varchar("Windptsr1", {length: 6}),
    windptsr2: varchar("Windptsr2", {length: 6}),
    windptsr3: varchar("Windptsr3", {length: 6}),
    windptsr4: varchar("Windptsr4", {length: 6}),
    reason: varchar("Reason", {length: 100}),
    totrun4: varchar("Totrun4", {length: 6}),
    tot: varchar("Tot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    posr4: varchar("Posr4", {length: 6}),
    statusr4: varchar("Statusr4", {length: 20}),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultjp_Recid"}),
  ]
);

export const aResultjpteam = mysqlTable(
  "A_resultjpteam",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    teamid: int("Teamid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    status2: varchar("Status2", {length: 20}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    stage: varchar("Stage", {length: 10}),
    j1R1: varchar("J1r1", {length: 6}),
    j2R1: varchar("J2r1", {length: 6}),
    j3R1: varchar("J3r1", {length: 6}),
    j4R1: varchar("J4r1", {length: 6}),
    j5R1: varchar("J5r1", {length: 6}),
    speedr1: varchar("Speedr1", {length: 6}),
    distr1: varchar("Distr1", {length: 6}),
    disptsr1: varchar("Disptsr1", {length: 6}),
    judptsr1: varchar("Judptsr1", {length: 6}),
    totrun1: varchar("Totrun1", {length: 6}),
    posr1: varchar("Posr1", {length: 6}),
    statusr1: varchar("Statusr1", {length: 20}),
    j1R2: varchar("J1r2", {length: 6}),
    j2R2: varchar("J2r2", {length: 6}),
    j3R2: varchar("J3r2", {length: 6}),
    j4R2: varchar("J4r2", {length: 6}),
    j5R2: varchar("J5r2", {length: 6}),
    speedr2: varchar("Speedr2", {length: 6}),
    distr2: varchar("Distr2", {length: 6}),
    disptsr2: varchar("Disptsr2", {length: 6}),
    judptsr2: varchar("Judptsr2", {length: 6}),
    totrun2: varchar("Totrun2", {length: 6}),
    posr2: varchar("Posr2", {length: 6}),
    statusr2: varchar("Statusr2", {length: 20}),
    j1R3: varchar("J1r3", {length: 6}),
    j2R3: varchar("J2r3", {length: 6}),
    j3R3: varchar("J3r3", {length: 6}),
    j4R3: varchar("J4r3", {length: 6}),
    j5R3: varchar("J5r3", {length: 6}),
    speedr3: varchar("Speedr3", {length: 6}),
    distr3: varchar("Distr3", {length: 6}),
    disptsr3: varchar("Disptsr3", {length: 6}),
    judptsr3: varchar("Judptsr3", {length: 6}),
    totrun3: varchar("Totrun3", {length: 6}),
    posr3: varchar("Posr3", {length: 6}),
    statusr3: varchar("Statusr3", {length: 20}),
    j1R4: varchar("J1r4", {length: 6}),
    j2R4: varchar("J2r4", {length: 6}),
    j3R4: varchar("J3r4", {length: 6}),
    j4R4: varchar("J4r4", {length: 6}),
    j5R4: varchar("J5r4", {length: 6}),
    speedr4: varchar("Speedr4", {length: 6}),
    distr4: varchar("Distr4", {length: 6}),
    disptsr4: varchar("Disptsr4", {length: 6}),
    judptsr4: varchar("Judptsr4", {length: 6}),
    totrun4: varchar("Totrun4", {length: 6}),
    posr4: varchar("Posr4", {length: 6}),
    statusr4: varchar("Statusr4", {length: 20}),
    tot: varchar("Tot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.teamid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultjpteam_Recid"}),
  ]
);

export const aResultma = mysqlTable(
  "A_resultma",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    status2: varchar("Status2", {length: 5}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    timer1: varchar("Timer1", {length: 15}),
    timer2: varchar("Timer2", {length: 15}),
    timer3: varchar("Timer3", {length: 15}),
    timetot: varchar("Timetot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}).default("0.00"),
    version: int("Version"),
    catage: int("Catage"),
    age: int("Age"),
    rangcat: int("Rangcat"),
    cuppointscat: decimal("Cuppointscat", {
      precision: 10,
      scale: 2,
      unsigned: true,
    }),
    handicapTimetot: varchar("Handicap_timetot", {length: 15}),
    handicapRank: tinyint("Handicap_rank", {unsigned: true}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Racid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultma_Recid"}),
  ]
);

export const aResultnk = mysqlTable(
  "A_resultnk",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    position: int("Position"),
    pf: tinyint("Pf").default(0),
    status2: varchar("Status2", {length: 20}),
    bib: int("Bib"),
    bibcolor: varchar("Bibcolor", {length: 10}),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    stage: varchar("Stage", {length: 10}),
    j1R1: varchar("J1r1", {length: 6}),
    j2R1: varchar("J2r1", {length: 6}),
    j3R1: varchar("J3r1", {length: 6}),
    j4R1: varchar("J4r1", {length: 6}),
    j5R1: varchar("J5r1", {length: 6}),
    speedr1: varchar("Speedr1", {length: 6}),
    distr1: varchar("Distr1", {length: 6}),
    disptsr1: varchar("Disptsr1", {length: 6}),
    judptsr1: varchar("Judptsr1", {length: 6}),
    gater1: varchar("Gater1", {length: 6}),
    gateptsr1: varchar("Gateptsr1", {length: 6}),
    windr1: varchar("Windr1", {length: 6}),
    windptsr1: varchar("Windptsr1", {length: 6}),
    totrun1: varchar("Totrun1", {length: 6}),
    posr1: varchar("Posr1", {length: 6}),
    statusr1: varchar("Statusr1", {length: 20}),
    j1R2: varchar("J1r2", {length: 6}),
    j2R2: varchar("J2r2", {length: 6}),
    j3R2: varchar("J3r2", {length: 6}),
    j4R2: varchar("J4r2", {length: 6}),
    j5R2: varchar("J5r2", {length: 6}),
    speedr2: varchar("Speedr2", {length: 6}),
    distr2: varchar("Distr2", {length: 6}),
    disptsr2: varchar("Disptsr2", {length: 6}),
    judptsr2: varchar("Judptsr2", {length: 6}),
    gater2: varchar("Gater2", {length: 6}),
    gateptsr2: varchar("Gateptsr2", {length: 6}),
    windr2: varchar("Windr2", {length: 6}),
    windptsr2: varchar("Windptsr2", {length: 6}),
    totrun2: varchar("Totrun2", {length: 6}),
    posr2: varchar("Posr2", {length: 6}),
    statusr2: varchar("Statusr2", {length: 20}),
    pointsjump: varchar("Pointsjump", {length: 15}),
    behindjump: varchar("Behindjump", {length: 15}),
    posjump: varchar("Posjump", {length: 6}),
    timecc: varchar("Timecc", {length: 15}),
    timeccint: int("Timeccint"),
    poscc: varchar("Poscc", {length: 6}),
    starttime: varchar("Starttime", {length: 5}),
    statuscc: varchar("Statuscc", {length: 20}),
    totbehind: varchar("Totbehind", {length: 15}),
    timetot: varchar("Timetot", {length: 15}),
    timetotint: int("Timetotint"),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Racid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultnk_Recid"}),
  ]
);

export const aResultnkteam = mysqlTable(
  "A_resultnkteam",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    teamid: int("Teamid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    position: int("Position"),
    pf: tinyint("Pf").default(0),
    status2: varchar("Status2", {length: 20}),
    bib: int("Bib"),
    bibcolor: varchar("Bibcolor", {length: 10}),
    leg: tinyint("Leg"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    stage: varchar("Stage", {length: 10}),
    j1R1: varchar("J1r1", {length: 6}),
    j2R1: varchar("J2r1", {length: 6}),
    j3R1: varchar("J3r1", {length: 6}),
    j4R1: varchar("J4r1", {length: 6}),
    j5R1: varchar("J5r1", {length: 6}),
    speedr1: varchar("Speedr1", {length: 6}),
    distr1: varchar("Distr1", {length: 6}),
    disptsr1: varchar("Disptsr1", {length: 6}),
    judptsr1: varchar("Judptsr1", {length: 6}),
    gater1: varchar("Gater1", {length: 6}),
    gateptsr1: varchar("Gateptsr1", {length: 6}),
    windr1: varchar("Windr1", {length: 6}),
    windptsr1: varchar("Windptsr1", {length: 6}),
    totrun1: varchar("Totrun1", {length: 6}),
    posr1: varchar("Posr1", {length: 6}),
    statusr1: varchar("Statusr1", {length: 20}),
    j1R2: varchar("J1r2", {length: 6}),
    j2R2: varchar("J2r2", {length: 6}),
    j3R2: varchar("J3r2", {length: 6}),
    j4R2: varchar("J4r2", {length: 6}),
    j5R2: varchar("J5r2", {length: 6}),
    speedr2: varchar("Speedr2", {length: 6}),
    distr2: varchar("Distr2", {length: 6}),
    disptsr2: varchar("Disptsr2", {length: 6}),
    judptsr2: varchar("Judptsr2", {length: 6}),
    gater2: varchar("Gater2", {length: 6}),
    gateptsr2: varchar("Gateptsr2", {length: 6}),
    windr2: varchar("Windr2", {length: 6}),
    windptsr2: varchar("Windptsr2", {length: 6}),
    totrun2: varchar("Totrun2", {length: 6}),
    posr2: varchar("Posr2", {length: 6}),
    statusr2: varchar("Statusr2", {length: 20}),
    pointsjump: varchar("Pointsjump", {length: 15}),
    behindjump: varchar("Behindjump", {length: 15}),
    posjump: varchar("Posjump", {length: 6}),
    timecc: varchar("Timecc", {length: 15}),
    timeccint: int("Timeccint"),
    poscc: varchar("Poscc", {length: 6}),
    starttime: varchar("Starttime", {length: 5}),
    statuscc: varchar("Statuscc", {length: 20}),
    totbehind: varchar("Totbehind", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    leveltext: varchar("Leveltext", {length: 20}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultnkteam_Recid"}),
  ]
);

export const aResultsb = mysqlTable(
  "A_resultsb",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    status2: varchar("Status2", {length: 5}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    stage: varchar("Stage", {length: 10}),
    j1R1: varchar("J1r1", {length: 6}),
    j2R1: varchar("J2r1", {length: 6}),
    j3R1: varchar("J3r1", {length: 6}),
    j4R1: varchar("J4r1", {length: 6}),
    j5R1: varchar("J5r1", {length: 6}),
    totr1: varchar("Totr1", {length: 15}),
    j1R2: varchar("J1r2", {length: 6}),
    j2R2: varchar("J2r2", {length: 6}),
    j3R2: varchar("J3r2", {length: 6}),
    j4R2: varchar("J4r2", {length: 6}),
    j5R2: varchar("J5r2", {length: 6}),
    totr2: varchar("Totr2", {length: 15}),
    j1R3: varchar("J1r3", {length: 6}),
    j2R3: varchar("J2r3", {length: 6}),
    j3R3: varchar("J3r3", {length: 6}),
    j4R3: varchar("J4r3", {length: 6}),
    j5R3: varchar("J5r3", {length: 6}),
    totr3: varchar("Totr3", {length: 15}),
    tot: varchar("Tot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    details: text("Details"),
    version: int("Version"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultsb_Recid"}),
  ]
);

export const aResultss = mysqlTable(
  "A_resultss",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    status2: varchar("Status2", {length: 5}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    timer1: varchar("Timer1", {length: 15}),
    speedr1: decimal("Speedr1", {precision: 10, scale: 2}).default("10.00"),
    timer2: varchar("Timer2", {length: 15}),
    speedr2: decimal("Speedr2", {precision: 10, scale: 2}).default("10.00"),
    timer3: varchar("Timer3", {length: 15}),
    speedr3: decimal("Speedr3", {precision: 10, scale: 2}).default("10.00"),
    timer4: varchar("Timer4", {length: 15}),
    speedr4: decimal("Speedr4", {precision: 10, scale: 2}).default("10.00"),
    timer5: varchar("Timer5", {length: 15}),
    speedr5: decimal("Speedr5", {precision: 10, scale: 2}).default("10.00"),
    timetot: varchar("Timetot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    speedForFisPoints: decimal("SpeedForFisPoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}).default("0.00"),
    version: int("Version"),
    numberOfRuns: int("NumberOfRuns").default(0).notNull(),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    category: int("Category").default(1).notNull(),
    rankcateg: int("Rankcateg"),
    speed: decimal("Speed", {precision: 10, scale: 2}),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resultss_Recid"}),
  ]
);

export const aResulttm = mysqlTable(
  "A_resulttm",
  {
    recid: int("Recid").autoincrement().notNull(),
    raceid: int("Raceid").default(0).notNull(),
    competitorid: int("Competitorid").default(0).notNull(),
    status: varchar("Status", {length: 5}),
    reason: varchar("Reason", {length: 100}),
    status2: varchar("Status2", {length: 5}),
    position: int("Position"),
    bib: int("Bib"),
    fiscode: int("Fiscode"),
    competitorname: varchar("Competitorname", {length: 50}),
    nationcode: varchar("Nationcode", {length: 5}),
    level: tinyint("Level"),
    heat: tinyint("Heat"),
    timer1: varchar("Timer1", {length: 15}),
    timer2: varchar("Timer2", {length: 15}),
    timer3: varchar("Timer3", {length: 15}),
    timetot: varchar("Timetot", {length: 15}),
    valid: tinyint("Valid"),
    racepoints: decimal("Racepoints", {precision: 10, scale: 2}),
    cuppoints: decimal("Cuppoints", {precision: 10, scale: 2}),
    version: int("Version"),
    timer1Int: int("Timer1int").default(0),
    timer2Int: int("Timer2int").default(0),
    timer3Int: int("Timer3int").default(0),
    timetotint: int("Timetotint").default(0),
    racepointsreceived: varchar({length: 15}),
    listfispoints: decimal("Listfispoints").default("999999"),
    ptsmax: int("Ptsmax").default(99999),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("Compet").on(table.competitorid, table.raceid),
    index("Race").on(table.raceid, table.competitorid),
    index("Raceid").on(table.raceid),
    primaryKey({columns: [table.recid], name: "A_resulttm_Recid"}),
  ]
);

export const aSector = mysqlTable(
  "A_sector",
  {
    recid: int("Recid").autoincrement().notNull(),
    sectorcode: char("Sectorcode", {length: 3}).notNull(),
    description: varchar("Description", {length: 25}).notNull(),
    iocsector: char("Iocsector", {length: 4}),
    fispoints: tinyint("Fispoints"),
    displayorder: tinyint("Displayorder", {unsigned: true})
      .default(0)
      .notNull(),
    others: tinyint("Others"),
    lastupdate: timestamp("Lastupdate", {mode: "string"})
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("ordre").on(table.displayorder, table.sectorcode),
    index("sector").on(table.sectorcode),
    primaryKey({columns: [table.recid], name: "A_sector_Recid"}),
  ]
);
