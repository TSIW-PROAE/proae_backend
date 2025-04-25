import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { CreateEtapasDto } from './dto/create-etapas-edital.dto';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';

// Mock class-validator's validate function
jest.mock('class-validator', () => ({
  validate: jest.fn().mockImplementation(() => Promise.resolve([])),
  IsDate: jest.fn(),
  IsEnum: jest.fn(),
  IsOptional: jest.fn(),
  IsString: jest.fn(),
  ValidateNested: jest.fn(),
}));

// Mock class-transformer's plainToClass function
jest.mock('class-transformer', () => ({
  plainToClass: jest.fn().mockImplementation((cls, plain) => plain),
  Type: jest.fn(),
}));

describe('Edital DTOs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateEditalDto', () => {
    it('should validate a complete and valid CreateEditalDto', async () => {
      const dtoData = {
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
      
      const dto = plainToClass(CreateEditalDto, dtoData);
      
      // Mock validate to return no errors for this test
      (validate as jest.Mock).mockResolvedValueOnce([]);
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      const dtoData = {
        // Missing tipo_beneficio
        descricao: 'Edital de teste',
        // Missing edital_url
        data_inicio: new Date('2023-01-01'),
        // Missing data_fim
      };
      
      const dto = plainToClass(CreateEditalDto, dtoData);
      
      // Mock validate to return errors for this test
      const mockErrors = [
        { property: 'tipo_beneficio', constraints: { isEnum: 'tipo_beneficio should be an enum value' } },
        { property: 'edital_url', constraints: { isString: 'edital_url should be a string' } },
        { property: 'data_fim', constraints: { isDate: 'data_fim should be a date' } }
      ];
      (validate as jest.Mock).mockResolvedValueOnce(mockErrors);
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const errorFields = errors.map(error => error.property);
      expect(errorFields).toContain('tipo_beneficio');
      expect(errorFields).toContain('edital_url');
      expect(errorFields).toContain('data_fim');
    });

    it('should fail validation when tipo_beneficio is not a valid enum value', async () => {
      const dtoData = {
        tipo_beneficio: 'INVALID_TYPE',
        descricao: 'Edital de teste',
        edital_url: 'http://example.com/edital',
        data_inicio: new Date('2023-01-01'),
        data_fim: new Date('2023-12-31')
      };
      
      const dto = plainToClass(CreateEditalDto, dtoData);
      
      // Mock validate to return tipo_beneficio error
      const mockErrors = [
        { property: 'tipo_beneficio', constraints: { isEnum: 'tipo_beneficio should be an enum value' } }
      ];
      (validate as jest.Mock).mockResolvedValueOnce(mockErrors);
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const tipoError = errors.find(error => error.property === 'tipo_beneficio');
      expect(tipoError).toBeDefined();
    });

    it('should validate when etapas is empty or missing', async () => {
      const dtoData = {
        tipo_beneficio: EditalEnum.AUXILIO_ALIMENTACAO,
        descricao: 'Edital de teste',
        edital_url: 'http://example.com/edital',
        data_inicio: new Date('2023-01-01'),
        data_fim: new Date('2023-12-31'),
        // etapas is missing but optional
      };
      
      const dto = plainToClass(CreateEditalDto, dtoData);
      
      // Mock validate to return no errors
      (validate as jest.Mock).mockResolvedValueOnce([]);
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateEditalDto', () => {
    it('should validate a valid UpdateEditalDto with partial fields', async () => {
      const dto = plainToClass(UpdateEditalDto, {
        descricao: 'Edital atualizado',
        status_edital: StatusEdital.DESATIVADO
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate an empty UpdateEditalDto', async () => {
      const dto = plainToClass(UpdateEditalDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when status_edital is not a valid enum value', async () => {
      const dto = plainToClass(UpdateEditalDto, {
        status_edital: 'INVALID_STATUS'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const statusError = errors.find(error => error.property === 'status_edital');
      expect(statusError).toBeDefined();
    });
  });

  describe('CreateEtapasDto', () => {
    it('should validate a complete and valid CreateEtapasDto', async () => {
      const dto = plainToClass(CreateEtapasDto, {
        nome: 'Etapa 1',
        ordem: 1,
        descricao: 'Descrição da etapa 1'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      const dto = plainToClass(CreateEtapasDto, {
        // Missing nome
        ordem: 1,
        // Missing descricao
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const errorFields = errors.map(error => error.property);
      expect(errorFields).toContain('nome');
      expect(errorFields).toContain('descricao');
    });
  });
}); 