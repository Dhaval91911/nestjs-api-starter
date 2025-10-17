import { Logger } from '@nestjs/common';

const logger = new Logger('RegexCommon');

export function escapeRegex(text: string): string {
  try {
    return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
  } catch (err) {
    logger.error(
      `escapeRegex error: ${err instanceof Error ? err.message : String(err)}`
    );
    throw new Error('Regex escape failed');
  }
}
