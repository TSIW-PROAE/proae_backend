import { CreateEditalDto } from '@/src/edital/dto/create-edital.dto';
import { CreateEtapasDto } from '@/src/edital/dto/create-etapas-edital.dto';
import { EditalService } from '@/src/edital/edital.service';
import { EditalEnum } from '@/src/enum/enumEdital';
import { StatusEdital } from '@/src/enum/enumStatusEdital';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Edital } from 'src/entities/edital/edital.entity';
import { EtapaEdital } from 'src/entities/etapaEdital/etapaEdital.entity';
import { EntityManager, Repository } from 'typeorm';

describe('EditalEtapas', () => {
  let service: EditalService;
  let repository: Repository<Edital>;
  let entityManager: EntityManager;

  const mockEtapas: CreateEtapasDto[] = [
    {
      nome: 'Etapa 1',
      ordem: 1,
      data_inicio: new Date('2023-01-01'),
      data_fim: new Date('2023-06-31'),
    },
    {
      nome: 'Etapa 2',
      ordem: 2,
      data_inicio: new Date('2023-07-01'),
      data_fim: new Date('2023-12-31'),
    },
  ];

  const mockEditalResponse = {
    id: 1,
    tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
    descricao: 'Edital de teste',
    edital_url: 'http://example.com/edital',
    titulo_edital: 'Edital de teste',
    quantidade_bolsas: 10,
    status_edital: StatusEdital.ABERTO,
    etapas: mockEtapas.map((etapa, index) => ({
      id: index + 1,
      nome: etapa.nome,
      ordem: etapa.ordem,
      data_inicio: etapa.data_inicio,
      data_fim: etapa.data_fim,
    })),
  };

  const mockCreateEditalDto: CreateEditalDto = {
    tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
    descricao: 'Edital de teste n1',
    edital_url: 'http://example.com/edital',
    etapas: mockEtapas,
    titulo_edital: 'Edital de teste',
    quantidade_bolsas: 10,
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
      const createEditalDto: CreateEditalDto = {
        tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
        descricao: 'Edital de teste n1',
        edital_url: 'http://example.com/edital',
        titulo_edital: 'Edital de teste',
        quantidade_bolsas: 10,
        etapas: [
          {
            nome: 'Etapa 1',
            ordem: 1,
            data_inicio: new Date('2023-01-01'),
            data_fim: new Date('2023-07-01'),
          },
          {
            nome: 'Etapa 2',
            ordem: 2,
            data_inicio: new Date('2023-07-01'),
            data_fim: new Date('2023-12-31'),
          },
        ],
      };

      let savedEdital: Edital;
      let savedEtapas: EtapaEdital[];

      // Mock the transaction to return the created edital
      mockEntityManager.transaction.mockImplementation(async (callback) => {
        // Primeiro save: edital sem etapas
        mockEntityManager.save.mockImplementationOnce(async (entity) => {
          if (entity instanceof Edital) {
            savedEdital = new Edital({
              ...entity,
              id: 1,
              etapas: [],
            });
            return savedEdital;
          }
          return entity;
        });

        // Segundo save: etapas com referência ao edital
        mockEntityManager.save.mockImplementationOnce(async (entity) => {
          if (Array.isArray(entity)) {
            savedEtapas = entity.map((etapa, index) => {
              const etapaEdital = new EtapaEdital({
                ...etapa,
                id: index + 1,
                edital: savedEdital,
              });
              return etapaEdital;
            });
            return savedEtapas;
          }
          return entity;
        });

        const result = await callback(mockEntityManager);
        return result;
      });

      const result = await service.create(createEditalDto);

      // Verify first save was called with an Edital object without etapas
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
          descricao: 'Edital de teste n1',
          edital_url: 'http://example.com/edital',
          titulo_edital: 'Edital de teste',
          quantidade_bolsas: 10,
          etapas: [],
        }),
      );

      // Verify second save was called with etapas
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([
          expect.objectContaining({
            nome: 'Etapa 1',
            ordem: 1,
            data_inicio: new Date('2023-01-01'),
            data_fim: new Date('2023-07-01'),
            edital: expect.objectContaining({
              id: 1,
              tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
              descricao: 'Edital de teste n1',
              edital_url: 'http://example.com/edital',
              titulo_edital: 'Edital de teste',
              quantidade_bolsas: 10,
            }),
          }),
          expect.objectContaining({
            nome: 'Etapa 2',
            ordem: 2,
            data_inicio: new Date('2023-07-01'),
            data_fim: new Date('2023-12-31'),
            edital: expect.objectContaining({
              id: 1,
              tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
              descricao: 'Edital de teste n1',
              edital_url: 'http://example.com/edital',
              titulo_edital: 'Edital de teste',
              quantidade_bolsas: 10,
            }),
          }),
        ]),
      );

      // Verify the result
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
          descricao: 'Edital de teste n1',
          edital_url: 'http://example.com/edital',
          titulo_edital: 'Edital de teste',
          quantidade_bolsas: 10,
          etapas: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              nome: 'Etapa 1',
              ordem: 1,
              data_inicio: new Date('2023-01-01'),
              data_fim: new Date('2023-07-01'),
            }),
            expect.objectContaining({
              id: 2,
              nome: 'Etapa 2',
              ordem: 2,
              data_inicio: new Date('2023-07-01'),
              data_fim: new Date('2023-12-31'),
            }),
          ]),
        }),
      );
    });
  });
  /*
  describe('find edital with etapas', () => {
    it('should return edital with etapas in the correct order', async () => {
      mockRepository.findOne.mockResolvedValue(new Edital({
        ...mockEditalResponse,
        etapas: mockEditalResponse.etapas.map(etapa => ({
          ...etapa,
          edital: new Edital({
            id: 1,
            tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
            descricao: 'Edital de teste',
            edital_url: 'http://example.com/edital',
            titulo_edital: 'Edital de teste',
            quantidade_bolsas: 10,
            status_edital: StatusEdital.ABERTO,
            etapas: [],
          }),
        })),
      }));

      const result = await service.findOne(1);

      expect(result).toEqual(mockEditalResponse);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          etapas: true,
        },
        order: {
          etapas: { ordem: 'ASC' },
        },
      });
    });
  });

  describe('find all editais with etapas', () => {
    it('should return all editais with their etapas in the correct order', async () => {
      mockRepository.find.mockResolvedValue([new Edital({
        ...mockEditalResponse,
        etapas: mockEditalResponse.etapas.map(etapa => ({
          ...etapa,
          edital: new Edital({
            id: 1,
            tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
            descricao: 'Edital de teste',
            edital_url: 'http://example.com/edital',
            titulo_edital: 'Edital de teste',
            quantidade_bolsas: 10,
            status_edital: StatusEdital.ABERTO,
            etapas: [],
          }),
        })),
      })]);

      const result = await service.findAll();

      expect(result).toEqual([mockEditalResponse]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: {
          etapas: true,
        },
        order: {
          etapas: { ordem: 'ASC' },
        },
      });
    });
  });*/
});
