import { Test, TestingModule } from '@nestjs/testing';
import { AppVersionService } from './app_version.service';

describe('AppVersionService', () => {
  let service: AppVersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppVersionService],
    }).compile();

    service = module.get<AppVersionService>(AppVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
