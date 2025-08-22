import { Test, TestingModule } from '@nestjs/testing';
import { AppContentController } from './app_content.controller';

describe('AppContentController', () => {
  let controller: AppContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppContentController],
    }).compile();

    controller = module.get<AppContentController>(AppContentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
