import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Edital } from 'src/entities/edital/edital.entity';
import { EtapaEdital } from 'src/entities/etapaEdital/etapaEdital.entity';
import { EditalEnum } from 'src/enum/enumEdital';
import { EntityManager, Repository } from 'typeorm';
import { CreateEditalDto } from '../src/edital/dto/create-edital.dto';
import { EditalService } from '../src/edital/edital.service';

describe('EditalService', () => {
  let service: EditalService;
  let editalRepository: Repository<Edital>;
  let entityManager: EntityManager;

  const mockEntityManager = {
    findOne: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    save: jest.fn(),
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
        },
      ],
    }).compile();

    service = module.get<EditalService>(EditalService);
    editalRepository = module.get<Repository<Edital>>(
      getRepositoryToken(Edital),
    );
    entityManager = module.get<EntityManager>(EntityManager);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('findAll', async () => {
    const mockEditais = [
      new Edital({ id: 1, tipo_edital: EditalEnum.AUXILIO_TRANSPORTE }),
      new Edital({ id: 2, tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO }),
    ];

    jest.spyOn(editalRepository, 'find').mockResolvedValue(mockEditais);

    const result = await service.findAll();

    expect(result).toEqual(mockEditais);
    expect(editalRepository.find).toHaveBeenCalled();
  });

  test('findOne', async () => {
    const mockEdital = new Edital({
      id: 1,
      tipo_edital: EditalEnum.AUXILIO_TRANSPORTE,
    });

    jest.spyOn(editalRepository, 'findOne').mockResolvedValue(mockEdital);

    const result = await service.findOne(1);

    expect(result).toEqual(mockEdital);
    expect(editalRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: {
        etapas: { resultados: true },
      },
      order: {
        data_inicio: 'ASC',
        etapas: { ordem: 'ASC' },
      },
    });
  });

  test('create', async () => {
    const mockEdital = new Edital({
      id: 1,
      tipo_edital: EditalEnum.AUXILIO_TRANSPORTE,
      descricao: 'testes',
      edital_url: 'www.testes.com',
      titulo_edital: 'testes',
      quantidade_bolsas: 10,
      etapas: [
        new EtapaEdital({
          id: 1,
          ordem: 1,
          nome: 'etapa 1',
          data_inicio: new Date('2023-01-01'),
          data_fim: new Date('2023-06-31'),
        }),
      ],
    });

    const createEditalDto = {
      tipo_edital: EditalEnum.AUXILIO_TRANSPORTE,
      descricao: 'testes',
      edital_url: 'www.testes.com',
      titulo_edital: 'testes',
      quantidade_bolsas: 10,
      etapas: [
        {
          ordem: 1,
          nome: 'etapa 1',
          data_inicio: new Date('2023-01-01'),
          data_fim: new Date('2023-06-31'),
        },
      ],
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

    const mockEdital = new Edital({
      id: 1,
      tipo_edital: EditalEnum.AUXILIO_TRANSPORTE,
      descricao: 'testes',
      edital_url: 'www.testes.com',
      titulo_edital: 'testes',
      quantidade_bolsas: 10,
      etapas: [
        new EtapaEdital({
          id: 1,
          ordem: 1,
          nome: 'etapa 1',
          data_inicio: new Date('2023-01-01'),
          data_fim: new Date('2023-06-31'),
        }),
        new EtapaEdital({
          id: 2,
          ordem: 2,
          nome: 'etapa 2',
          data_inicio: new Date('2023-07-01'),
          data_fim: new Date('2023-12-31'),
        }),
      ],
    });

    const successResponse = {
      message: 'Edital e entidades relacionadas excluídos com sucesso',
    };

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
        etapas: { resultados: true },
      },
    });

    // Verify EtapaInscricao deletion was called with correct parameters
    expect(mockEntityManager.delete).toHaveBeenCalledWith(EtapaEdital, {
      edital: { id: 1 },
    });

    // Verify Edital deletion was called with correct parameters
    expect(mockEntityManager.delete).toHaveBeenCalledWith(Edital, { id: 1 });

    // Verify the result
    expect(result).toEqual(successResponse);
  });

  test('remove should return message if edital not found', async () => {
    // Setup mocks
    mockEntityManager.transaction.mockImplementation(async (callback) => {
      return await callback(mockEntityManager);
    });

    mockEntityManager.findOne.mockResolvedValue(null);

    // Execute the test and verify it returns the expected message
    const result = await service.remove(999);
    expect(result).toBe('Edital com id: 999 não encontrado');
  });

  test('remove should handle transaction errors', async () => {
    // Setup mocks to throw an error during transaction
    mockEntityManager.transaction.mockRejectedValue(
      new Error('Database error'),
    );

    // Execute the test and verify it throws the expected error
    await expect(service.remove(1)).rejects.toThrow(
      'Falha ao excluir edital: Database error',
    );
  });
});
