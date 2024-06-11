const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");
const Tesseract = require("tesseract.js");
const translate = require("google-translate-api");

// Path to the PDF file
const pdfPath = "korean_pdf.pdf";
const outputPdfPath = "translated_output.pdf";

// Extract text from the PDF using Tesseract.js
async function extractTextFromPDF(pdfPath) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  let extractedText = "";
  for (const page of pages) {
    const { width, height } = page.getSize();
    const pngImage = await page.render({
      width,
      height,
      format: "png",
    });
    const text = await Tesseract.recognize(pngImage, "kor");
    extractedText += text.data.text;
  }

  return extractedText;
}

// Translate the extracted text
async function translateText(text) {
  const translated = await translate(text, { from: "ko", to: "en" });
  return translated.text;
}

// Overlay translated text back onto the PDF
async function overlayTextOnPDF(pdfPath, translatedText, outputPdfPath) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = 12;
    page.drawText(translatedText, {
      x: 10,
      y: height - 25,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPdfPath, pdfBytes);
}

(async () => {
  try {
    console.log("Extracting text from PDF...");
    const extractedText = await extractTextFromPDF(pdfPath);

    console.log("Translating text...");
    const translatedText = await translateText(extractedText);

    console.log("Overlaying translated text on PDF...");
    await overlayTextOnPDF(pdfPath, translatedText, outputPdfPath);

    console.log(`Translated PDF saved to ${outputPdfPath}`);
  } catch (error) {
    console.error("Error:", error);
  }
})();
