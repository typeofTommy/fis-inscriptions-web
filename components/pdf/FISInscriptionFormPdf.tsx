// components/pdf/FISInscriptionFormPdf.tsx
import {Document, Page, View, Text, StyleSheet} from "@react-pdf/renderer";

// Fake data for demonstration
const fakeData = {
  competition: "FIS",
  location: "Prali (ITA)",
  date: "11/04/2025 - 12/04/2025",
  responsible: {
    name: "Philippe MARTIN",
    mobile: "+33 666 49 28 99",
    mail: "pmartin@ffs.fr",
  },
  nationalAssociation: {
    name: "FEDERATION FRANCAISE DE SKI",
    address: "2 rue René Dumond- Meythet\n74960 ANNECY",
  },
  category: {
    COC: false,
    FIS: true,
    NC: false,
    CIT: false,
    UNI: false,
    ENL: false,
    NJR: false,
    CHI: false,
    Other: false,
  },
  competitors: [
    {
      code: "6191657",
      name: "BLANCHET Titouan",
      year: 2006,
      dh: "",
      sg: "",
      gs: "",
      sl: "44.00",
      ac: "",
      nte: "",
      arrival: "10.04.25",
      departure: "12.04.25",
    },
    {
      code: "6191785",
      name: "FRAGASSI Sacha",
      year: 2007,
      dh: "",
      sg: "",
      gs: "",
      sl: "",
      ac: "",
      nte: "",
      arrival: "10.04.25",
      departure: "11/04 only",
    },
    {
      code: "6191696",
      name: "GRAVIER Axel",
      year: 2006,
      dh: "",
      sg: "",
      gs: "",
      sl: "50.36",
      ac: "",
      nte: "",
      arrival: "10.04.25",
      departure: "12.04.25",
    },
    {
      code: "6191801",
      name: "NORAZ Thibault",
      year: 2007,
      dh: "",
      sg: "",
      gs: "",
      sl: "",
      ac: "",
      nte: "",
      arrival: "10.04.25",
      departure: "11/04 only",
    },
  ],
};

const styles = StyleSheet.create({
  page: {padding: 16, fontSize: 9, fontFamily: "Helvetica"},
  // Header
  colorBar1: {height: 5, backgroundColor: "#F9B233"},
  colorBar2: {height: 5, backgroundColor: "#1A4797"},
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: "#eee",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextBox: {flex: 1},
  headerTitle: {fontSize: 14, fontWeight: "bold"},
  headerSubtitle: {fontSize: 8, marginTop: 2},
  // Section boxes
  sectionRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    marginBottom: 0,
  },
  sectionCell: {flex: 1, padding: 6, borderRightWidth: 1, borderColor: "#000"},
  sectionCellLast: {flex: 1, padding: 6, borderRightWidth: 0},
  sectionLabel: {fontWeight: "bold", fontSize: 9},
  sectionValue: {fontSize: 10},
  // Responsible/Category
  twoCol: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    marginBottom: 0,
  },
  colLeft: {flex: 1, padding: 6, borderRightWidth: 1, borderColor: "#000"},
  colRight: {flex: 1, padding: 6, borderRightWidth: 0},
  // Category checkboxes grid
  catGrid: {flexDirection: "row", flexWrap: "wrap", marginTop: 4},
  catBox: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 4,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: {fontSize: 10, textAlign: "center"},
  // National Association
  natAssoc: {
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    padding: 6,
    marginBottom: 0,
  },
  natLogo: {width: 40, height: 40, backgroundColor: "#eee", marginBottom: 4},
  // Competitors Table
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  tableHeader: {flexDirection: "row", backgroundColor: "#eee"},
  tableHeaderCell: {
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 2,
    flex: 1,
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "center",
  },
  tableHeaderCellLast: {
    padding: 2,
    flex: 1,
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 0,
  },
  tableRow: {flexDirection: "row"},
  tableCell: {
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 2,
    flex: 1,
    fontSize: 8,
    textAlign: "center",
  },
  tableCellLast: {
    padding: 2,
    flex: 1,
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 0,
  },
  tableSubHeader: {fontSize: 7, fontStyle: "italic", textAlign: "center"},
  compTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    marginTop: 8,
  },
  compTitleCell: {fontWeight: "bold", fontSize: 10, padding: 4},
  compTitleCellSmall: {fontWeight: "bold", fontSize: 10, padding: 4, width: 20},
  compTitleCellCheck: {
    fontWeight: "bold",
    fontSize: 10,
    padding: 4,
    width: 16,
    textAlign: "center",
  },
});

const Checkbox = ({checked}: {checked: boolean}) => (
  <View style={styles.checkbox}>
    {checked ? <Text style={styles.checked}>X</Text> : null}
  </View>
);

export function FISInscriptionFormPdf() {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Colored header lines */}
        <View style={styles.colorBar1} />
        <View style={styles.colorBar2} />
        {/* Header with logo and multi-language title */}
        <View style={styles.headerRow}>
          <View style={styles.logoBox}>
            <Text>LOGO</Text>
          </View>
          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>ENTRY FORM</Text>
            <Text style={styles.headerSubtitle}>
              FORMULAIRE D&apos;INSCRIPTION / ANMELDUNGSFORMULAR
            </Text>
          </View>
        </View>
        {/* Competition and Date of race */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionCell}>
            <Text style={styles.sectionLabel}>Competition</Text>
            <Text style={styles.sectionValue}>
              {fakeData.competition} {fakeData.location}
            </Text>
          </View>
          <View style={styles.sectionCellLast}>
            <Text style={styles.sectionLabel}>Date of race</Text>
            <Text style={styles.sectionValue}>{fakeData.date}</Text>
          </View>
        </View>
        {/* Responsible and Category */}
        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <Text style={styles.sectionLabel}>Responsible for Entry</Text>
            <Text style={styles.sectionValue}>{fakeData.responsible.name}</Text>
            <Text style={styles.sectionValue}>
              Mobile: {fakeData.responsible.mobile}
            </Text>
            <Text style={styles.sectionValue}>
              Mail: {fakeData.responsible.mail}
            </Text>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.catGrid}>
              {Object.entries(fakeData.category).map(([cat, checked]) => (
                <View style={styles.catBox} key={cat}>
                  <Checkbox checked={!!checked} />
                  <Text>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        {/* National Association */}
        <View style={styles.natAssoc}>
          <View style={{flexDirection: "row", alignItems: "center"}}>
            <View style={styles.natLogo}>
              <Text>LOGO</Text>
            </View>
            <View style={{marginLeft: 8}}>
              <Text style={styles.sectionLabel}>
                {fakeData.nationalAssociation.name}
              </Text>
              <Text style={styles.sectionValue}>
                {fakeData.nationalAssociation.address}
              </Text>
            </View>
          </View>
        </View>
        {/* Competitors Title Row */}
        <View style={styles.compTitleRow}>
          <Text style={styles.compTitleCell}>
            COMPETITORS / COUREURS / WETTKÄMPFER
          </Text>
          <Text style={styles.compTitleCellSmall}>L</Text>
          <Text style={styles.compTitleCellCheck}>
            <Checkbox checked={false} />
          </Text>
          <Text style={styles.compTitleCellSmall}>/ M</Text>
          <Text style={styles.compTitleCellCheck}>
            <Checkbox checked={true} />
          </Text>
        </View>
        {/* Competitors Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>FIS Code</Text>
            <Text style={[styles.tableHeaderCell, {flex: 2}]}>
              Surname, First Name{"\n"}
              <Text style={styles.tableSubHeader}>
                Nom de famille, Prénom / Familienname, Vorname
              </Text>
            </Text>
            <Text style={styles.tableHeaderCell}>YB{"\n"}AN JG</Text>
            <Text style={styles.tableHeaderCell}>DH</Text>
            <Text style={styles.tableHeaderCell}>SG</Text>
            <Text style={styles.tableHeaderCell}>GS</Text>
            <Text style={styles.tableHeaderCell}>SL</Text>
            <Text style={styles.tableHeaderCell}>AC</Text>
            <Text style={styles.tableHeaderCell}>NTE</Text>
            <Text style={styles.tableHeaderCell}>Arrival{"\n"}Arrivée</Text>
            <Text style={styles.tableHeaderCellLast}>
              Departure{"\n"}Départ
            </Text>
          </View>
          {fakeData.competitors.map((c, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.tableCell}>{c.code}</Text>
              <Text style={[styles.tableCell, {flex: 2}]}>{c.name}</Text>
              <Text style={styles.tableCell}>{c.year}</Text>
              <Text style={styles.tableCell}>{c.dh}</Text>
              <Text style={styles.tableCell}>{c.sg}</Text>
              <Text style={styles.tableCell}>{c.gs}</Text>
              <Text style={styles.tableCell}>{c.sl}</Text>
              <Text style={styles.tableCell}>{c.ac}</Text>
              <Text style={styles.tableCell}>{c.nte}</Text>
              <Text style={styles.tableCell}>{c.arrival}</Text>
              <Text style={styles.tableCellLast}>{c.departure}</Text>
            </View>
          ))}
          {/* Add empty rows for visual similarity */}
          {Array.from({length: 8}).map((_, i) => (
            <View style={styles.tableRow} key={fakeData.competitors.length + i}>
              {Array.from({length: 11}).map((_, j) => (
                <Text
                  style={j === 10 ? styles.tableCellLast : styles.tableCell}
                  key={j}
                >
                  {" "}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
