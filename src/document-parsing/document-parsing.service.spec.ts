import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { DocumentParsingService } from "./document-parsing.service";

test("DocumentParsingService rejects unsupported file types before parsing", async () => {
  const documentParsingService = new DocumentParsingService();

  await assert.rejects(
    () =>
      documentParsingService.parseDocument(
        Buffer.from("plain text content"),
        "notes.txt",
        "text/plain",
      ),
    (caughtError: unknown) => {
      assert.ok(caughtError instanceof BadRequestException);
      assert.equal(
        caughtError.message,
        "Unsupported file type. Only PDF and DOCX files are allowed.",
      );
      return true;
    },
  );
});

test("DocumentParsingService rejects files with no extractable text", async () => {
  const documentParsingService = new DocumentParsingService();
  const documentParsingServiceWithStubbedPdfParser =
    documentParsingService as unknown as {
      parsePdf: (uploadedFileBuffer: Buffer) => Promise<string>;
      parseDocument: (
        uploadedFileBuffer: Buffer,
        uploadedOriginalFileName: string,
        uploadedFileMimeType: string,
      ) => Promise<unknown>;
    };

  documentParsingServiceWithStubbedPdfParser.parsePdf = async () => "   ";

  await assert.rejects(
    () =>
      documentParsingServiceWithStubbedPdfParser.parseDocument(
        Buffer.from("fake pdf content"),
        "contract.pdf",
        "application/pdf",
      ),
    (caughtError: unknown) => {
      assert.ok(caughtError instanceof BadRequestException);
      assert.equal(
        caughtError.message,
        "No extractable text found in the uploaded file.",
      );
      return true;
    },
  );
});
