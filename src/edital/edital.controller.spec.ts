import { Test, TestingModule } from '@nestjs/testing';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';

describe('Edital1Controller', () => {
  let controller: EditalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditalController],
      providers: [EditalService],
    }).compile();

    controller = module.get<EditalController>(EditalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
