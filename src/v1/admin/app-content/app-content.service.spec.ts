import { Test, TestingModule } from '@nestjs/testing';
import { AppContentService } from './app-content.service';

describe('AppContentService', () => {
  let service: AppContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppContentService],
    }).compile();

    service = module.get<AppContentService>(AppContentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
