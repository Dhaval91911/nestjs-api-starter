import { Test, TestingModule } from '@nestjs/testing';
import { AppVersionController } from './app_version.controller';

describe('AppVersionController', () => {
  let controller: AppVersionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppVersionController],
    }).compile();

    controller = module.get<AppVersionController>(AppVersionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
