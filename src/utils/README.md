# Uploads Hardening and Presigned Flow

## Current measures

- Multer limits file size and uses memory storage.
- MIME is checked and magic-bytes are verified via `file-type`.
- S3 uploads enforce `ServerSideEncryption: 'AES256'` and private ACL.

## Recommendations

- Prefer presigned uploads for large files:
  1. Client requests a presigned URL for a specific key and content-type.
  2. Client uploads directly to S3 using the URL.
  3. Server verifies the object exists and records metadata.
- Integrate antivirus scanning (e.g., ClamAV) on uploaded objects before making them available.

## Security

- Validate content-type with magic-bytes in backstop checks.
- Enforce explicit `Content-Length` and reasonable max size.
- Use object-level SSE and bucket policies to restrict public access.

# Utils Module

A collection of self-contained helper utilities reused across the backend.

| File                      | Responsibility                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `token.util.ts`           | Create and validate JWTs. Reads secrets from environment and centralises token options.  |
| `secure_password.util.ts` | Password hashing / comparison via bcrypt; abstracts salt rounds.                         |
| `mailer.util.ts`          | Nodemailer wrapper and HTML templates for password-reset OTP emails to users and admins. |
| `bucket.util.ts`          | Injectable helper that uploads / removes media files from AWS S3.                        |

All utilities avoid side-effects and expose pure or stateless functions (except `BucketUtil`, which is an injectable service). Each file now contains thorough JSDoc explaining parameters, env variables, and error cases.

> If you add a new util, please document it here and include JSDoc headers in the file.
