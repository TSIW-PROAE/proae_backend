import { Test, TestingModule } from '@nestjs/testing';
import { EditalService } from './edital.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Edital } from 'src/entities/edital/edital.entity';
import { EntityManager, Repository } from 'typeorm';
import { EditalEnum } from 'src/enum/enumEdital';
import { CreateEditalDto } from './dto/create-edital.dto';
import { EtapaInscricao } from 'src/entities/etapaInscricao/etapaInscricao.entity';

describe('EditalService', () => {
  let service: EditalService;
  let editalRepository: Repository<Edital>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditalService,
        {
          provide: getRepositoryToken(Edital),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {},
        }
      ]
    }).compile();

    service = module.get<EditalService>(EditalService);
    editalRepository = module.get<Repository<Edital>>(getRepositoryToken(Edital));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('findAll', async () => {
    const mockEditais = [
      new Edital({ id: 1, tipo_beneficio: EditalEnum.AUXILIO_TRANSPORTE }),
      new Edital({ id: 2, tipo_beneficio: EditalEnum.AUXILIO_ALIMENTACAO }),
    ];

    jest.spyOn(editalRepository, 'find').mockResolvedValue(mockEditais);

    const result = await service.findAll();

    expect(result).toEqual(mockEditais);
    expect(editalRepository.find).toHaveBeenCalled();
  });

  test('findOne', async () => {
    const mockEdital = new Edital({ id: 1, tipo_beneficio: EditalEnum.AUXILIO_TRANSPORTE });

    jest.spyOn(editalRepository, 'findOne').mockResolvedValue(mockEdital);

    const result = await service.findOne(1);

    expect(result).toEqual(mockEdital);
    expect(editalRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: {
        etapas: { resultados: true }
      },
      order: {
        data_inicio: 'ASC',
        etapas: { ordem: 'ASC' }
      }
    });
  });

  test('create', async () => {
    const mockEdital = new Edital({
      id: 1,
      tipo_beneficio: EditalEnum.AUXILIO_TRANSPORTE,
      descricao: "testes",
      edital_url: "www.testes.com",
      data_inicio: new Date('2025-02-10'),
      data_fim: new Date('2025-10-21'),
      etapas: [
        new EtapaInscricao({
          id: 1,
          ordem: 1,
          nome: 'etapa 1',
          descricao: 'descricao 1'
        })
      ]
    });

    const createEditalDto = {
      tipo_beneficio: EditalEnum.AUXILIO_TRANSPORTE,
      descricao: "testes",
      edital_url: "www.testes.com",
      data_inicio: new Date('2025-02-10'),
      data_fim: new Date('2025-10-21'),
      etapas: [
        {
          ordem: 1,
          nome: 'etapa 1',
          descricao: 'descricao 1'
        }
      ]
    } as CreateEditalDto;

    jest.spyOn(editalRepository, 'save').mockResolvedValue(mockEdital);

    const result = await service.create(createEditalDto);

    expect(result).toEqual(mockEdital);
    expect(editalRepository.save).toHaveBeenCalledWith(expect.objectContaining(createEditalDto));
  });

});
