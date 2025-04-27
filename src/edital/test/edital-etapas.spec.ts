import { Test, TestingModule } from '@nestjs/testing';
import { EditalService } from '../edital.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Edital } from 'src/entities/edital/edital.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateEditalDto } from '../dto/create-edital.dto';
import { EtapaInscricao } from 'src/entities/etapaInscricao/etapaInscricao.entity';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';
import { CreateEtapasDto } from '../dto/create-etapas-edital.dto';

describe('EditalEtapas', () => {
  let service: EditalService;
  let repository: Repository<Edital>;
  let entityManager: EntityManager;

  const mockEtapas: CreateEtapasDto[] = [
    {
      nome: 'Etapa 1',
      ordem: 1,
      descricao: 'Descrição da etapa 1',
    },
    {
      nome: 'Etapa 2',
      ordem: 2,
      descricao: 'Descrição da etapa 2',
    },
  ];

  const mockEdital = {
    id: 1,
    tipo_beneficio: EditalEnum.AUXILIO_ALIMENTACAO,
    descricao: 'Edital de teste',
    edital_url: 'http://example.com/edital',
    data_inicio: new Date('2023-01-01'),
    data_fim: new Date('2023-12-31'),
    status_edital: StatusEdital.ATIVO,
    etapas: mockEtapas.map((etapa, index) => ({
      id: index + 1,
      ...etapa,
      resultados: [],
    })),
  };

  const mockCreateEditalDto: CreateEditalDto = {
    tipo_beneficio: EditalEnum.AUXILIO_ALIMENTACAO,
    descricao: 'Edital de teste',
    edital_url: 'http://example.com/edital',
    data_inicio: new Date('2023-01-01'),
    data_fim: new Date('2023-12-31'),
    etapas: mockEtapas,
  };

  const mockRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockEntityManager = {
    transaction: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditalService,
        {
          provide: getRepositoryToken(Edital),
          useValue: mockRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<EditalService>(EditalService);
    repository = module.get<Repository<Edital>>(getRepositoryToken(Edital));
    entityManager = module.get<EntityManager>(EntityManager);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create edital with etapas', () => {
    it('should create a new edital with multiple etapas', async () => {
      // Setup transaction mock to execute the callback and return its result
      mockEntityManager.transaction.mockImplementation(async (callback) => {
        return await callback(mockEntityManager);
      });

      // Setup save mock to return the created edital
      mockEntityManager.save.mockResolvedValue(mockEdital);

      // Call create method
      await service.create(mockCreateEditalDto);

      // Verify transaction was called
      expect(mockEntityManager.transaction).toHaveBeenCalled();

      // Verify save was called with an Edital object containing etapas
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          etapas: expect.arrayContaining([
            expect.any(EtapaInscricao),
            expect.any(EtapaInscricao),
          ]),
        }),
      );

      // Verify that etapas are passed correctly to the EtapaInscricao constructor
      const savedEdital = mockEntityManager.save.mock.calls[0][0];
      expect(savedEdital.etapas.length).toBe(2);
      expect(savedEdital.etapas[0].nome).toBe('Etapa 1');
      expect(savedEdital.etapas[0].ordem).toBe(1);
      expect(savedEdital.etapas[1].nome).toBe('Etapa 2');
      expect(savedEdital.etapas[1].ordem).toBe(2);
    });
  });

  describe('find edital with etapas', () => {
    it('should return edital with etapas in the correct order', async () => {
      mockRepository.findOne.mockResolvedValue(mockEdital);

      const result = await service.findOne(1);

      expect(result).toEqual(mockEdital);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          etapas: { resultados: true },
        },
        order: {
          data_inicio: 'ASC',
          etapas: { ordem: 'ASC' },
        },
      });

      // Add null check to avoid TypeScript errors
      expect(result).not.toBeNull();
      if (result) {
        // Verify that etapas are returned in the correct order
        expect(result.etapas[0].ordem).toBe(1);
        expect(result.etapas[1].ordem).toBe(2);
      }
    });
  });

  describe('find all editais with etapas', () => {
    it('should return all editais with their etapas in the correct order', async () => {
      mockRepository.find.mockResolvedValue([mockEdital]);

      const result = await service.findAll();

      expect(result).toEqual([mockEdital]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: {
          etapas: { resultados: true },
        },
        order: {
          data_inicio: 'ASC',
          etapas: { ordem: 'ASC' },
        },
      });

      // Add null check and array length check
      expect(result).not.toBeNull();
      expect(result.length).toBeGreaterThan(0);

      // Verify that etapas are returned in the correct order
      expect(result[0].etapas[0].ordem).toBe(1);
      expect(result[0].etapas[1].ordem).toBe(2);
    });
  });
});
