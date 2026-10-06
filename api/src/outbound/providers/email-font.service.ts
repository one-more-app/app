import { Injectable } from '@nestjs/common';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FONT_CANDIDATES = [
  resolve(__dirname, '../../event/emails/fonts/TBJ-One-More.woff2'),
  resolve(__dirname, '../../../src/event/emails/fonts/TBJ-One-More.woff2'),
];

@Injectable()
export class EmailFontService {
  private cache: string | null = null;

  async getFontDataUri(): Promise<string> {
    if (this.cache) return this.cache;
    for (const path of FONT_CANDIDATES) {
      try {
        await access(path);
        const buf = await readFile(path);
        this.cache = `data:font/woff2;base64,${buf.toString('base64')}`;
        return this.cache;
      } catch {
        // try next
      }
    }
    return '';
  }
}
