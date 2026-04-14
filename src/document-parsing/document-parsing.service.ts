import { Injectable, BadRequestException } from '@nestjs/common';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface ParsedDocument {
  plainText: string;
  originalFileName: string;
}

@Injectable()
export class DocumentParsingService {
  async parseDocument(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<ParsedDocument> {
    let plainText: string;

    if (mimeType === 'application/pdf') {
      plainText = await this.parsePdf(fileBuffer);
    } else if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      plainText = await this.parseDocx(fileBuffer);
    } else {
      throw new BadRequestException(
        'Unsupported file type. Only PDF and DOCX files are allowed.',
      );
    }

    if (!plainText || plainText.trim().length === 0) {
      throw new BadRequestException(
        'No extractable text found in the uploaded file.',
      );
    }

    return {
      plainText,
      originalFileName,
    };
  }

  private async parsePdf(fileBuffer: Buffer): Promise<string> {
    try {
      const pdfData = await pdf(fileBuffer);
      return pdfData.text || '';
    } catch (error) {
      throw new BadRequestException('Failed to parse PDF file.');
    }
  }

  private async parseDocx(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({
        buffer: fileBuffer,
      });
      return result.value || '';
    } catch (error) {
      throw new BadRequestException('Failed to parse DOCX file.');
    }
  }
}
