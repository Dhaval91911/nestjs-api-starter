// src/v1/admin/app-content/app-content.service.ts
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class AppContentService {
  private viewsDir = join(__dirname, '../../../../src/views'); // Adjust the path to your views directory

  async updatePrivacyPolicy(content: string): Promise<boolean> {
    const filePath = join(this.viewsDir, 'privacy-policy.hbs'); // Path to your privacy policy file
    await fs.writeFile(filePath, content); // Write the new content to the file
    return true;
  }

  async updateTermsAndConditions(content: string): Promise<boolean> {
    const filePath = join(this.viewsDir, 'terms-and-conditions.hbs'); // Path to your T&C file
    await fs.writeFile(filePath, content); // Write the new content to the file
    return true;
  }
}
