/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";

export interface IInvoiceData {
  transactionId: string;
  bookingDate: Date;
  userName: string;
  tourTitle: string;
  guestCount: number;
  totalAmount: number;
}

export const generatePdf = async (
  invoiceData: IInvoiceData
): Promise<Buffer> => {
  try {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffer: Uint8Array[] = [];

      doc.on("data", (chunk) => buffer.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffer)));
      doc.on("error", (err) => reject(err));

      // --- Header ---
      doc
        .fontSize(24)
        .fillColor("#007BFF")
        .text("INVOICE", { align: "center" })
        .fillColor("black")
        .moveDown(1.5);

      // --- Info Block ---
      doc.fontSize(12);
      doc.text(`Transaction ID: ${invoiceData.transactionId}`);
      doc.text(`Booking Date: ${invoiceData.bookingDate.toLocaleDateString()}`);
      doc.text(`Customer Name: ${invoiceData.userName}`);
      doc.text(`Tour Title: ${invoiceData.tourTitle}`);
      doc.text(`Guest Count: ${invoiceData.guestCount}`);
      doc.moveDown();

      // --- Table Header ---
      doc
        .fillColor("white")
        .rect(50, doc.y, 500, 20)
        .fill("#007BFF")
        .fillColor("white")
        .fontSize(12)
        .text("Description", 55, doc.y + 5)
        .text("Amount", 480, doc.y + 5, { align: "right" });

      // --- Table Row ---
      doc.moveDown(1.2);
      doc
        .fillColor("black")
        .fontSize(12)
        .text("Tour Booking", 55, doc.y)
        .text(`$${invoiceData.totalAmount.toFixed(2)}`, 480, doc.y, {
          align: "right",
        });

      // --- Total Amount Bold ---
      doc.moveDown(2);
      doc
        .font("Helvetica-Bold")
        .text("Total Amount:", 55, doc.y)
        .text(`$${invoiceData.totalAmount.toFixed(2)}`, 480, doc.y, {
          align: "right",
        });

      // --- Footer ---
      doc.moveDown(4);
      // doc
      //   .font("Helvetica")
      //   .fontSize(11)
      //   .fillColor("gray")
      //   .text("Thank you for booking with us!", { align: "center" });
      
        doc
          .moveDown()
          .font("Helvetica")
          .fontSize(12)
          .fillColor("#555555")
          .text("Thank you for booking with us!", {
            align: "center",
            lineGap: 6,
          });

      doc.end();
    });
  } catch (error: any) {
    console.log(error);
    throw new AppError(400, `Failed to generate PDF ${error.message}`);
  }
};
