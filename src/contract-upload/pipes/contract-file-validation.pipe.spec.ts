import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { CONTRACT_FILE_UPLOAD } from '../../common/constants/contract-file-upload.constant';
import { ContractFileValidationPipe } from './contract-file-validation.pipe';

function createMockUploadedContractFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'contractFile',
    originalname: 'employment-agreement.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: '',
    filename: 'employment-agreement.pdf',
    path: '',
    buffer: Buffer.from('test file content'),
    stream: undefined as never,
    ...overrides,
  } as Express.Multer.File;
}

test('ContractFileValidationPipe returns the uploaded file when validation passes', () => {
  const contractFileValidationPipe = new ContractFileValidationPipe();
  const uploadedContractFile = createMockUploadedContractFile();

  const validatedContractFile = contractFileValidationPipe.transform(
    uploadedContractFile,
  );

  assert.equal(validatedContractFile, uploadedContractFile);
});

test('ContractFileValidationPipe rejects unsupported file types', () => {
  const contractFileValidationPipe = new ContractFileValidationPipe();
  const uploadedContractFile = createMockUploadedContractFile({
    mimetype: 'text/plain',
    originalname: 'notes.txt',
  });

  assert.throws(
    () => contractFileValidationPipe.transform(uploadedContractFile),
    (caughtError: unknown) => {
      assert.ok(caughtError instanceof BadRequestException);
      assert.equal(
        caughtError.message,
        `Invalid file type. Allowed types: ${CONTRACT_FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`,
      );
      return true;
    },
  );
});

test('ContractFileValidationPipe rejects oversized files', () => {
  const contractFileValidationPipe = new ContractFileValidationPipe();
  const uploadedContractFile = createMockUploadedContractFile({
    size: CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES + 1,
  });

  assert.throws(
    () => contractFileValidationPipe.transform(uploadedContractFile),
    (caughtError: unknown) => {
      assert.ok(caughtError instanceof BadRequestException);
      assert.equal(
        caughtError.message,
        `File too large. Maximum size: ${CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
      );
      return true;
    },
  );
});
