import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { CONTRACT_FILE_UPLOAD } from '../../common/constants/contract-file-upload.constant';

type AllowedMimeType = typeof CONTRACT_FILE_UPLOAD.ALLOWED_MIME_TYPES[number];

@Injectable()
export class ContractFileValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File): Express.Multer.File {
    if (!value) {
      throw new BadRequestException('Contract file is required');
    }

    const mimeType = value.mimetype as AllowedMimeType;
    if (!CONTRACT_FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${CONTRACT_FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    if (value.size > CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large. Maximum size: ${CONTRACT_FILE_UPLOAD.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }

    return value;
  }
}
