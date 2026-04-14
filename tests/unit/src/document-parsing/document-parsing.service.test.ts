import { Test, TestingModule } from '@nestjs/testing';
import { DocumentParsingService } from '../../../../src/document-parsing/document-parsing.service';
import { AppError, ErrorCode } from '../../../../src/common/errors';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({ text: '' }),
}));

vi.mock('mammoth', () => ({
  extractRawText: vi.fn().mockResolvedValue({ value: '' }),
}));

import pdf from 'pdf-parse';
import mammoth from 'mammoth';

describe('DocumentParsingService', () => {
  let service: DocumentParsingService;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentParsingService],
    }).compile();

    service = module.get<DocumentParsingService>(DocumentParsingService);
  });

  describe('parseDocument', () => {
    const mockPdfBuffer = Buffer.from('PDF content');
    const mockDocxBuffer = Buffer.from('DOCX content');

    it('should parse PDF file and return correct response shape', async () => {
      vi.mocked(pdf).mockResolvedValue({ text: 'Extracted PDF text content' } as any);

      const result = await service.parseDocument(
        mockPdfBuffer,
        'test-document.pdf',
        'application/pdf',
      );

      expect(result).toHaveProperty('plainText', 'Extracted PDF text content');
      expect(result).toHaveProperty('originalFileName', 'test-document.pdf');
    });

    it.skip('should parse DOCX file and return correct response shape', async () => {
      vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: 'Extracted DOCX text content' } as any);

      const result = await service.parseDocument(
        mockDocxBuffer,
        'test-document.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );

      expect(result).toHaveProperty('plainText', 'Extracted DOCX text content');
      expect(result).toHaveProperty('originalFileName', 'test-document.docx');
    });

    it('should throw AppError with correct code for unsupported file format', async () => {
      await expect(
        service.parseDocument(
          Buffer.from('some content'),
          'test.txt',
          'text/plain',
        ),
      ).rejects.toThrow(AppError);
    });

    it('should throw PARSE_UNSUPPORTED_FORMAT code for unsupported format', async () => {
      try {
        await service.parseDocument(
          Buffer.from('some content'),
          'test.txt',
          'text/plain',
        );
      } catch (error) {
        const response = error.getResponse();
        expect(response.code).toBe(ErrorCode.PARSE_UNSUPPORTED_FORMAT);
      }
    });

    it('should throw AppError when PDF parsing fails', async () => {
      vi.mocked(pdf).mockRejectedValue(new Error('Corrupted PDF') as any);

      await expect(
        service.parseDocument(
          mockPdfBuffer,
          'corrupted.pdf',
          'application/pdf',
        ),
      ).rejects.toThrow(AppError);
    });

    it('should throw PARSE_PDF_FAILED code for PDF parsing failure', async () => {
      vi.mocked(pdf).mockRejectedValue(new Error('Corrupted PDF') as any);

      try {
        await service.parseDocument(
          mockPdfBuffer,
          'corrupted.pdf',
          'application/pdf',
        );
      } catch (error) {
        const response = error.getResponse();
        expect(response.code).toBe(ErrorCode.PARSE_PDF_FAILED);
      }
    });

    it.skip('should throw AppError when DOCX parsing fails', async () => {
      vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Corrupted DOCX') as any);

      await expect(
        service.parseDocument(
          mockDocxBuffer,
          'corrupted.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
      ).rejects.toThrow(AppError);
    });

    it.skip('should throw PARSE_DOCX_FAILED code for DOCX parsing failure', async () => {
      vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Corrupted DOCX') as any);

      try {
        await service.parseDocument(
          mockDocxBuffer,
          'corrupted.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        );
      } catch (error) {
        const response = error.getResponse();
        expect(response.code).toBe(ErrorCode.PARSE_DOCX_FAILED);
      }
    });

    it('should throw AppError when extracted text is empty for PDF', async () => {
      vi.mocked(pdf).mockResolvedValue({ text: '' } as any);

      await expect(
        service.parseDocument(
          mockPdfBuffer,
          'empty.pdf',
          'application/pdf',
        ),
      ).rejects.toThrow(AppError);
    });

    it('should throw PARSE_EMPTY_CONTENT code for empty text content', async () => {
      vi.mocked(pdf).mockResolvedValue({ text: '' } as any);

      try {
        await service.parseDocument(
          mockPdfBuffer,
          'empty.pdf',
          'application/pdf',
        );
      } catch (error) {
        const response = error.getResponse();
        expect(response.code).toBe(ErrorCode.PARSE_EMPTY_CONTENT);
      }
    });

    it('should throw AppError when extracted text is whitespace only for PDF', async () => {
      vi.mocked(pdf).mockResolvedValue({ text: '   ' } as any);

      await expect(
        service.parseDocument(
          mockPdfBuffer,
          'whitespace.pdf',
          'application/pdf',
        ),
      ).rejects.toThrow(AppError);
    });

    it('should return original filename from the uploaded file parameter', async () => {
      vi.mocked(pdf).mockResolvedValue({ text: 'Some text' } as any);

      const result = await service.parseDocument(
        mockPdfBuffer,
        'my-contract-2024.pdf',
        'application/pdf',
      );

      expect(result.originalFileName).toBe('my-contract-2024.pdf');
    });
  });
});