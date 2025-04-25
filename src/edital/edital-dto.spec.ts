import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { CreateEtapasDto } from './dto/create-etapas-edital.dto';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';

describe('Edital DTOs', () => {
  describe('CreateEditalDto', () => {
    it('should validate a complete and valid CreateEditalDto', async () => {
      const dto = plainToClass(CreateEditalDto, {
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
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      const dto = plainToClass(CreateEditalDto, {
        // Missing tipo_beneficio
        descricao: 'Edital de teste',
        // Missing edital_url
        data_inicio: new Date('2023-01-01'),
        // Missing data_fim
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const errorFields = errors.map(error => error.property);
      expect(errorFields).toContain('tipo_beneficio');
      expect(errorFields).toContain('edital_url');
      expect(errorFields).toContain('data_fim');
    });

    it('should fail validation when tipo_beneficio is not a valid enum value', async () => {
      const dto = plainToClass(CreateEditalDto, {
        tipo_beneficio: 'INVALID_TYPE',
        descricao: 'Edital de teste',
        edital_url: 'http://example.com/edital',
        data_inicio: new Date('2023-01-01'),
        data_fim: new Date('2023-12-31')
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const tipoError = errors.find(error => error.property === 'tipo_beneficio');
      expect(tipoError).toBeDefined();
    });

    it('should validate when etapas is empty or missing', async () => {
      const dto = plainToClass(CreateEditalDto, {
        tipo_beneficio: EditalEnum.AUXILIO_ALIMENTACAO,
        descricao: 'Edital de teste',
        edital_url: 'http://example.com/edital',
        data_inicio: new Date('2023-01-01'),
        data_fim: new Date('2023-12-31'),
        // etapas is missing but optional
      });

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