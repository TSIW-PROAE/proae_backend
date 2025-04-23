import { Test, TestingModule } from '@nestjs/testing';
import { EditalService } from './edital.service';

describe('EditalService', () => {
  let service: EditalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EditalService],
    }).compile();

    service = module.get<EditalService>(EditalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
