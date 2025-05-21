// src/v1/admin/app-content/app-content.controller.ts
import { Controller, Put, Body, UseGuards, Res } from '@nestjs/common';
import { AppContentService } from './app-content.service';
import { RolesGuard } from '../../../middlewares/auth.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../common/enums/roles.enum';
import { Response, sendSuccess, ApiResponse } from '../../../common/responses';

@Controller('admin/app-content')
@UseGuards(RolesGuard)
export class AppContentController {
  constructor(private readonly appContentService: AppContentService) {}

  @Roles(Role.Admin)
  @Put('privacy-policy') // Endpoint to update privacy policy
  async updatePrivacyPolicy(
    @Body('content') content: string,
    @Res() res: Response,
  ): Promise<ApiResponse<string>> {
    await this.appContentService.updatePrivacyPolicy(content);
    return sendSuccess(res, 'Privacy-policy updated successfully', content);
  }

  @Roles(Role.Admin)
  @Put('terms-and-conditions') // Endpoint to update T&C
  async updateTermsAndConditions(
    @Body('content') content: string,
    @Res() res: Response,
  ) {
    await this.appContentService.updateTermsAndConditions(content);
    return sendSuccess(
      res,
      'terms and conditions updated successfully',
      content,
    );
  }
}
