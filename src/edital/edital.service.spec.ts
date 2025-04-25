import { Test, TestingModule } from '@nestjs/testing';
import { EditalService } from './edital.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Edital } from 'src/entities/edital/edital.entity';
import { EntityManager, Repository } from 'typeorm';
import { EditalEnum } from 'src/enum/enumEdital';
import { CreateEditalDto } from './dto/create-edital.dto';
import { EtapaInscricao } from 'src/entities/etapaInscricao/etapaInscricao.entity';
import { ResultadoEtapa } from 'src/entities/resultadoEtapa/resultadoEtapa.entity';
import { StatusEtapa } from 'src/enum/enumStatusEtapa';

describe('EditalService', () => {
  let service: EditalService;
  let editalRepository: Repository<Edital>;
  let entityManager: EntityManager;

  const mockEntityManager = {
    findOne: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    save: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditalService,
        {
          provide: getRepositoryToken(Edital),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        }
      ]
    }).compile();

    service = module.get<EditalService>(EditalService);
    editalRepository = module.get<Repository<Edital>>(getRepositoryToken(Edital));
    entityManager = module.get<EntityManager>(EntityManager);
    
    // Reset mocks
    jest.clearAllMocks();
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

    // Mock the transaction method to execute the callback and return mockEdital
    mockEntityManager.transaction.mockImplementation(async (callback) => {
      // Execute the callback with the mockEntityManager
      await callback(mockEntityManager);
      // Return the mockEdital as the result of the transaction
      return mockEdital;
    });
    
    // Mock the save method to not do anything (the return value is handled by transaction)
    mockEntityManager.save.mockResolvedValue(undefined);

    const result = await service.create(createEditalDto);

    expect(result).toEqual(mockEdital);
    expect(mockEntityManager.transaction).toHaveBeenCalled();
    expect(mockEntityManager.save).toHaveBeenCalled();
  });

  test('remove should delete edital and related entities with cascade', async () => {
    // Setup mock data
    const mockResultados = [
      {
        resultado_id: 1,
        status_etapa: StatusEtapa.FINALIZADA,
        observacao: 'Etapa finalizada',
        data_avaliacao: new Date()
      } as ResultadoEtapa,
      {
        resultado_id: 2,
        status_etapa: StatusEtapa.EM_ANALISE,
        observacao: 'Etapa em análise',
        data_avaliacao: new Date()
      } as ResultadoEtapa
    ];

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
          descricao: 'descricao 1',
          resultados: mockResultados
        }),
        new EtapaInscricao({
          id: 2,
          ordem: 2,
          nome: 'etapa 2',
          descricao: 'descricao 2',
          resultados: []
        })
      ]
    });

    const successResponse = { message: 'Edital e entidades relacionadas excluídos com sucesso' };

    // Setup mocks
    mockEntityManager.transaction.mockImplementation(async (callback) => {
      await callback(mockEntityManager);
      return successResponse;
    });
    
    mockEntityManager.findOne.mockResolvedValue(mockEdital);
    mockEntityManager.delete.mockResolvedValue({ affected: 1 });

    // Execute the test
    const result = await service.remove(1);

    // Verify transaction was called
    expect(mockEntityManager.transaction).toHaveBeenCalled();
    
    // Verify findOne was called with correct parameters
    expect(mockEntityManager.findOne).toHaveBeenCalledWith(Edital, { 
      where: { id: 1 },
      relations: {
        etapas: { resultados: true }
      },
    });

    // Verify ResultadoEtapa deletion was called for etapa with results
    expect(mockEntityManager.delete).toHaveBeenCalledWith(
      ResultadoEtapa,
      { etapa: { id: 1 } }
    );

    // Verify EtapaInscricao deletion was called with correct parameters
    expect(mockEntityManager.delete).toHaveBeenCalledWith(
      EtapaInscricao,
      { edital: { id: 1 } }
    );

    // Verify Edital deletion was called with correct parameters
    expect(mockEntityManager.delete).toHaveBeenCalledWith(
      Edital,
      { id: 1 }
    );

    // Verify the result
    expect(result).toEqual(successResponse);
  });

  test('remove should throw error if edital not found', async () => {
    // Setup mocks
    mockEntityManager.transaction.mockImplementation(async (callback) => {
      return await callback(mockEntityManager);
    });
    
    mockEntityManager.findOne.mockResolvedValue(null);

    // Execute the test and verify it throws the expected error
    await expect(service.remove(999)).rejects.toThrow('Edital não encontrado');
  });

  test('remove should handle transaction errors', async () => {
    // Setup mocks to throw an error during transaction
    mockEntityManager.transaction.mockRejectedValue(new Error('Database error'));

    // Execute the test and verify it throws the expected error
    await expect(service.remove(1)).rejects.toThrow('Falha ao excluir edital: Database error');
  });
});
