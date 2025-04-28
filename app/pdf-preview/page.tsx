"use client";

import {PDFViewer} from "@react-pdf/renderer";
import {FISInscriptionFormPdf} from "@/components/pdf/FISInscriptionFormPdf";

export default function PdfPreviewPage() {
  return (
    <div style={{width: "100vw", height: "100vh"}}>
      <PDFViewer width="100%" height="100%">
        <FISInscriptionFormPdf />
      </PDFViewer>
    </div>
  );
}
