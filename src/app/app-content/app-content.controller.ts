import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppContentController {
  @Get('/')
  @Render('index') // views/index.hbs
  getHome() {
    return {
      title: 'Dynamic Page',
      username: 'John Doe',
      hobbies: ['Coding', 'Music', 'Gaming'],
    };
  }

  @Get('/privacy-policy')
  @Render('privacy-policy') // views/index.hbs
  getPrivacyPolicy() {}

  @Get('/terms-and-conditions')
  @Render('terms-and-conditions') // views/index.hbs
  getTermsAndConditions() {}
}
