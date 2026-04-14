import { Injectable, BadRequestException } from "@nestjs/common";
import pdf from "pdf-parse";
import * as mammoth from "mammoth";

export interface ParsedDocument {
  plainText: string;
  originalFileName: string;
}

@Injectable()
export class DocumentParsingService {
  async parseDocument(
    uploadedFileBuffer: Buffer,
    uploadedOriginalFileName: string,
    uploadedFileMimeType: string,
  ): Promise<ParsedDocument> {
    let extractedPlainText: string;

    if (uploadedFileMimeType === "application/pdf") {
      extractedPlainText = await this.parsePdf(uploadedFileBuffer);
    } else if (
      uploadedFileMimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      extractedPlainText = await this.parseDocx(uploadedFileBuffer);
    } else {
      throw new BadRequestException(
        "Unsupported file type. Only PDF and DOCX files are allowed.",
      );
    }

    if (!extractedPlainText || extractedPlainText.trim().length === 0) {
      throw new BadRequestException(
        "No extractable text found in the uploaded file.",
      );
    }

    return {
      plainText: extractedPlainText,
      originalFileName: uploadedOriginalFileName,
    };
  }

  private async parsePdf(uploadedFileBuffer: Buffer): Promise<string> {
    try {
      const parsedPdfDocument = await pdf(uploadedFileBuffer);
      return parsedPdfDocument.text || "";
    } catch (error) {
      throw new BadRequestException("Failed to parse PDF file.");
    }
  }

  private async parseDocx(uploadedFileBuffer: Buffer): Promise<string> {
    try {
      const extractedDocxContent = await mammoth.extractRawText({
        buffer: uploadedFileBuffer,
      });
      return extractedDocxContent.value || "";
    } catch (error) {
      throw new BadRequestException("Failed to parse DOCX file.");
    }
  }
}
