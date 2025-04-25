import { Test, TestingModule } from '@nestjs/testing';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';

describe('EditalController', () => {
  let controller: EditalController;
  let service: EditalService;

  const mockEdital = {
    id: 1,
    tipo_beneficio: EditalEnum.AUXILIO_ALIMENTACAO,
    descricao: 'Edital de teste',
    edital_url: 'http://example.com/edital',
    data_inicio: new Date('2023-01-01'),
    data_fim: new Date('2023-12-31'),
    status_edital: StatusEdital.ATIVO,
    etapas: [
      {
        id: 1,
        nome: 'Etapa 1',
        ordem: 1,
        descricao: 'Descrição da etapa 1',
        resultados: []
      }
    ]
  };

  const mockCreateEditalDto: CreateEditalDto = {
    tipo_beneficio: EditalEnum.AUXILIO_ALIMENTACAO,
    descricao: 'Edital de teste',
    edital_url: 'http://example.com/edital',
    data_inicio: new Date('2023-01-01'),
    data_fim: new Date('2023-12-31'),
    etapas: [
      {
        nome: 'Etapa 1',
        ordem: 1,
        descricao: 'Descrição da etapa 1'
      }
    ]
  };

  const mockUpdateEditalDto: UpdateEditalDto = {
    descricao: 'Edital atualizado',
    status_edital: StatusEdital.DESATIVADO
  };

  const mockEditalService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditalController],
      providers: [
        {
          provide: EditalService,
          useValue: mockEditalService,
        },
      ],
    }).compile();

    controller = module.get<EditalController>(EditalController);
    service = module.get<EditalService>(EditalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new edital', async () => {
      mockEditalService.create.mockResolvedValue(mockEdital);

      const result = await controller.create(mockCreateEditalDto);
      
      expect(result).toEqual(mockEdital);
      expect(mockEditalService.create).toHaveBeenCalledWith(mockCreateEditalDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of editais', async () => {
      mockEditalService.findAll.mockResolvedValue([mockEdital]);

      const result = await controller.findAll();
      
      expect(result).toEqual([mockEdital]);
      expect(mockEditalService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single edital by id', async () => {
      mockEditalService.findOne.mockResolvedValue(mockEdital);

      const result = await controller.findOne('1');
      
      expect(result).toEqual(mockEdital);
      expect(mockEditalService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update an edital', async () => {
      mockEditalService.update.mockResolvedValue({ ...mockEdital, ...mockUpdateEditalDto });

      const result = await controller.update('1', mockUpdateEditalDto);
      
      expect(mockEditalService.update).toHaveBeenCalledWith(1, mockUpdateEditalDto);
    });
  });

  describe('remove', () => {
    it('should remove an edital and its related entities', async () => {
      const successResponse = { message: 'Edital e entidades relacionadas excluídos com sucesso' };
      mockEditalService.remove.mockResolvedValue(successResponse);

      const result = await controller.remove('1');
      
      expect(result).toEqual(successResponse);
      expect(mockEditalService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle errors when trying to remove a non-existent edital', async () => {
      mockEditalService.remove.mockRejectedValue(new Error('Edital não encontrado'));

      await expect(controller.remove('999')).rejects.toThrow('Edital não encontrado');
      expect(mockEditalService.remove).toHaveBeenCalledWith(999);
    });
  });
});
