import PDFDocument from "pdfkit";

type ContractPdfInput = {
  title: string;
  subtitle: string;
  renderedText: string;
  legalWarningText: string;
};

export async function generateContractPdfBuffer(input: ContractPdfInput) {
  const document = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: input.title,
      Author: "Imobiliaria SaaS",
      Subject: "Contrato de locacao residencial",
    },
  });

  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    document.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    document.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    document.on("error", reject);

    document.font("Helvetica-Bold").fontSize(18).fillColor("#17211f").text(input.title);
    document.moveDown(0.3);
    document.font("Helvetica").fontSize(10).fillColor("#85613b").text(input.subtitle);
    document.moveDown(1);
    document
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor("#5c6662")
      .text(input.legalWarningText);
    document.moveDown(1.2);
    document.font("Helvetica").fontSize(11).fillColor("#17211f").text(input.renderedText, {
      align: "left",
      lineGap: 4,
    });
    document.end();
  });
}
