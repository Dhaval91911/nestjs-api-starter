import * as multer from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_MIME_TYPES } from './bucket.util';
import { fileTypeFromBuffer } from 'file-type';

// Multer configuration shared across controllers to enforce
// server-side validation BEFORE the S3 upload step.

const storage = multer.memoryStorage();

export const uploadMulterOptions: MulterOptions = {
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES, // server-side size gating
  },
  fileFilter(
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(new Error('INVALID_FILE_TYPE'), false);
        }
        if (file.buffer && file.buffer.length > 0) {
          const detected = await fileTypeFromBuffer(file.buffer).catch(
            () => null
          );
          if (detected && !ALLOWED_MIME_TYPES.includes(detected.mime)) {
            return callback(new Error('INVALID_FILE_TYPE_DETECTED'), false);
          }
        }
        callback(null, true);
      } catch {
        callback(new Error('UPLOAD_VALIDATION_FAILED'), false);
      }
    })();
  },
};
