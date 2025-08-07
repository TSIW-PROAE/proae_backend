import { EditalService } from '@/src/edital/edital.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Edital } from 'src/entities/edital/edital.entity';
import { EntityManager, Repository } from 'typeorm';

describe('EditalService', () => {
  let service: EditalService;
  let editalRepository: Repository<Edital>;
  let entityManager: EntityManager;

  const mockEntityManager = {
    findOne: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
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
  /*
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
        etapas: true,
      },
      order: {
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
      const result = await callback(mockEntityManager);
      // Return the mockEdital as the result of the transaction
      return result;
    });

    // Mock the save method to return the edital
    mockEntityManager.save.mockImplementation(async (entity) => {
      if (entity instanceof Edital) {
        return mockEdital;
      }
      if (Array.isArray(entity) && entity[0] instanceof EtapaEdital) {
        return mockEdital.etapas;
      }
      return entity;
    });

    const result = await service.create(createEditalDto);

    expect(result).toEqual(mockEdital);
    expect(mockEntityManager.transaction).toHaveBeenCalled();
    expect(mockEntityManager.save).toHaveBeenCalled();
  });

  describe('remove', () => {
    let findOneSpy: jest.SpyInstance;

    beforeEach(() => {
      findOneSpy = jest.spyOn(editalRepository, 'findOne');
    });

    afterEach(() => {
      findOneSpy.mockRestore();
    });

    it('should remove an edital and its etapas', async () => {
      const mockEdital = new Edital({
        id: 1,
        tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
        descricao: 'Edital de teste',
        edital_url: 'http://example.com/edital',
        titulo_edital: 'Edital de teste',
        quantidade_bolsas: 10,
        status_edital: StatusEdital.ABERTO,
        etapas: [],
      });

      // Setup findOne mock to return the edital
      findOneSpy.mockResolvedValue(mockEdital);

      // Setup transaction mock to execute the callback
      mockEntityManager.transaction.mockImplementation(async (callback) => {
        return await callback(mockEntityManager);
      });

      // Setup remove mock to return the removed edital
      mockEntityManager.remove.mockResolvedValue(mockEdital);

      const result = await service.remove(1);

      expect(result).toEqual({ message: 'Edital excluído com sucesso' });
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          etapas: true,
        },
      });
      expect(mockEntityManager.transaction).toHaveBeenCalled();
      expect(mockEntityManager.remove).toHaveBeenCalledWith(mockEdital.etapas);
      expect(mockEntityManager.remove).toHaveBeenCalledWith(mockEdital);
    });

    it('should throw NotFoundException if edital not found', async () => {
      // Setup findOne mock to return null
      findOneSpy.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          etapas: true,
        },
      });
    });

    it('should handle transaction errors', async () => {
      const mockEdital = new Edital({
        id: 1,
        tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
        descricao: 'Edital de teste',
        edital_url: 'http://example.com/edital',
        titulo_edital: 'Edital de teste',
        quantidade_bolsas: 10,
        status_edital: StatusEdital.ABERTO,
        etapas: [],
      });

      // Setup findOne mock to return the edital
      findOneSpy.mockResolvedValue(mockEdital);

      // Setup transaction mock to throw an error
      mockEntityManager.transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(1)).rejects.toThrow(InternalServerErrorException);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          etapas: true,
        },
      });
    });
  });*/
});
