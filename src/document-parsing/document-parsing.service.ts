import { Injectable, Logger } from "@nestjs/common";
import pdf from "pdf-parse";
import * as mammoth from "mammoth";
import { AppError, ErrorCode } from "../common/errors";

export interface ParsedDocument {
  plainText: string;
  originalFileName: string;
}

@Injectable()
export class DocumentParsingService {
  private readonly logger = new Logger(DocumentParsingService.name);

  async parseDocument(
    uploadedFileBuffer: Buffer,
    uploadedOriginalFileName: string,
    uploadedFileMimeType: string,
  ): Promise<ParsedDocument> {
    let extractedPlainText: string;

    if (uploadedFileMimeType === "application/pdf") {
      extractedPlainText = await this.parsePdf(uploadedFileBuffer, uploadedOriginalFileName);
    } else if (
      uploadedFileMimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      extractedPlainText = await this.parseDocx(uploadedFileBuffer, uploadedOriginalFileName);
    } else {
      throw new AppError(ErrorCode.PARSE_UNSUPPORTED_FORMAT);
    }

    if (!extractedPlainText || extractedPlainText.trim().length === 0) {
      throw new AppError(ErrorCode.PARSE_EMPTY_CONTENT);
    }

    return {
      plainText: extractedPlainText,
      originalFileName: uploadedOriginalFileName,
    };
  }

  private async parsePdf(
    uploadedFileBuffer: Buffer,
    fileName: string,
  ): Promise<string> {
    try {
      const parsedPdfDocument = await pdf(uploadedFileBuffer);
      return parsedPdfDocument.text || "";
    } catch (error) {
      this.logger.error(`PDF parse failed for file: ${fileName}`, error instanceof Error ? error.stack : undefined);
      throw new AppError(ErrorCode.PARSE_PDF_FAILED, { context: { fileName } });
    }
  }

  private async parseDocx(
    uploadedFileBuffer: Buffer,
    fileName: string,
  ): Promise<string> {
    try {
      const extractedDocxContent = await mammoth.extractRawText({
        buffer: uploadedFileBuffer,
      });
      return extractedDocxContent.value || "";
    } catch (error) {
      this.logger.error(`DOCX parse failed for file: ${fileName}`, error instanceof Error ? error.stack : undefined);
      throw new AppError(ErrorCode.PARSE_DOCX_FAILED, { context: { fileName } });
    }
  }
}
