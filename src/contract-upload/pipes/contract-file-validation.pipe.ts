import { PipeTransform, Injectable, BadRequestException, Logger } from "@nestjs/common";
import { CONTRACT_FILE_UPLOAD } from "../../common/constants/contract-file-upload.constant";

type AllowedMimeType = (typeof CONTRACT_FILE_UPLOAD.ALLOWED_MIME_TYPES)[number];

// Magic bytes for supported file types
const FILE_SIGNATURES: Record<string, string[]> = {
  "application/pdf": ["%PDF"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "PK", // DOCX is a ZIP container
  ],
};

@Injectable()
export class ContractFileValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ContractFileValidationPipe.name);

  transform(uploadedContractFile: Express.Multer.File): Express.Multer.File {
    if (!uploadedContractFile) {
      throw new BadRequestException("Contract file is required");
    }

    const uploadedFileMimeType =
      uploadedContractFile.mimetype as AllowedMimeType;

    if (
      !CONTRACT_FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(uploadedFileMimeType)
    ) {
      this.logger.warn(
        `Invalid file type rejected: ${uploadedContractFile.mimetype} (${uploadedContractFile.originalname})`,
      );
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${CONTRACT_FILE_UPLOAD.ALLOWED_EXTENSIONS.join(", ")}`,
      );
    }

    if (uploadedContractFile.size > CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES) {
      this.logger.warn(
        `File too large rejected: ${uploadedContractFile.size} bytes (${uploadedContractFile.originalname})`,
      );
      throw new BadRequestException(
        `File too large. Maximum size: ${CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }

    // Validate magic bytes to ensure file content matches declared type
    this.validateMagicBytes(uploadedContractFile);

    return uploadedContractFile;
  }

  private validateMagicBytes(file: Express.Multer.File): void {
    const signatures = FILE_SIGNATURES[file.mimetype];
    if (!signatures) {
      return;
    }

    // Read first 4 bytes to check magic bytes
    const fileStart = file.buffer.slice(0, 4).toString("latin1");

    const hasValidSignature = signatures.some((signature) =>
      fileStart.startsWith(signature),
    );

    if (!hasValidSignature) {
      this.logger.warn(
        `Magic bytes validation failed: ${file.mimetype} (${file.originalname}) - File content does not match declared type`,
      );
      throw new BadRequestException(
        "Invalid file content. File may be corrupted or malicious.",
      );
    }
  }
}
