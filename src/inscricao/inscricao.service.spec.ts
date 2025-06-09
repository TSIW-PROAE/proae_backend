import { Test, TestingModule } from '@nestjs/testing';
import { InscricaoService } from './inscricao.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Documento } from '../entities/documento/documento.entity';
import { Validacao } from '../entities/validacao/validacao.entity';
import { StatusDocumento } from '../enum/statusDocumento';
import { EditalEnum } from '../enum/enumEdital';
import { EnumTipoDocumento } from '../enum/enumTipoDocumento';
import { Pergunta } from 'src/entities/edital/pergunta.entity';

describe('InscricaoService', () => {
  let service: InscricaoService;
  let inscricaoRepository: Repository<Inscricao>;
  let alunoRepository: Repository<Aluno>;
  let editalRepository: Repository<Edital>;
  let documentoRepository: Repository<Documento>;

  const mockAluno = {
    aluno_id: 1,
    id_clerk: 'clerk_123',
    cpf: '12345678901',
    inscricoes: [],
  } as Partial<Aluno>;

  const mockEdital = {
    id: 1,
    titulo_edital: 'Auxílio Permanência',
    tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
    inscricoes: [],
  } as Partial<Edital>;

  const mockValidacao = {
    id: 1,
    parecer: 'Documento necessita correção',
    data_validacao: new Date('2024-01-15'),
  } as Partial<Validacao>;

  const mockDocumentoPendente = {
    documento_id: 1,
    tipo_documento: EnumTipoDocumento.RG,
    status_documento: StatusDocumento.PENDENTE,
    documento_url: 'http://example.com/rg.pdf',
    validacoes: [mockValidacao],
  } as Partial<Documento>;

  const mockDocumentoAprovado = {
    documento_id: 2,
    tipo_documento: EnumTipoDocumento.CPF,
    status_documento: StatusDocumento.APROVADO,
    documento_url: 'http://example.com/cpf.pdf',
    validacoes: [],
  } as Partial<Documento>;

  const mockInscricao = {
    inscricao_id: 1,
    aluno: mockAluno,
    edital: mockEdital,
    documentos: [mockDocumentoPendente, mockDocumentoAprovado],
  } as Partial<Inscricao>;

  const mockInscricaoSemPendencias = {
    inscricao_id: 2,
    aluno: mockAluno,
    edital: mockEdital,
    documentos: [mockDocumentoAprovado],
  } as Partial<Inscricao>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscricaoService,
        {
          provide: getRepositoryToken(Inscricao),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Aluno),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Edital),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Documento),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Pergunta),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InscricaoService>(InscricaoService);
    inscricaoRepository = module.get<Repository<Inscricao>>(
      getRepositoryToken(Inscricao),
    );
    alunoRepository = module.get<Repository<Aluno>>(
      getRepositoryToken(Aluno),
    );
    editalRepository = module.get<Repository<Edital>>(
      getRepositoryToken(Edital),
    );
    documentoRepository = module.get<Repository<Documento>>(
      getRepositoryToken(Documento),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInscricoesByAluno', () => {
    it('should return inscriptions with pending documents and validation data for a valid student', async () => {
      jest.spyOn(alunoRepository, 'findOne').mockResolvedValue(mockAluno as Aluno);
      jest.spyOn(inscricaoRepository, 'find').mockResolvedValue([mockInscricao as Inscricao]);

      const result = await service.getInscricoesByAluno('clerk_123');

      expect(result).toEqual([
        {
          titulo_edital: 'Auxílio Permanência',
          tipo_edital: [EditalEnum.AUXILIO_ALIMENTACAO],
          documentos: [
            {
              tipo_documento: EnumTipoDocumento.RG,
              status_documento: StatusDocumento.PENDENTE,
              documento_url: 'http://example.com/rg.pdf',
              parecer: 'Documento necessita correção',
              data_validacao: new Date('2024-01-15'),
            },
          ],
        },
      ]);

      expect(alunoRepository.findOne).toHaveBeenCalledWith({
        where: { id_clerk: 'clerk_123' },
      });

      expect(inscricaoRepository.find).toHaveBeenCalledWith({
        where: {
          aluno: { aluno_id: mockAluno.aluno_id },
          documentos: {
            status_documento: StatusDocumento.PENDENTE,
          },
        },
        relations: ['edital', 'documentos', 'documentos.validacoes'],
      });
    });

    it('should return empty array when student has no inscriptions with pending documents', async () => {
      jest.spyOn(alunoRepository, 'findOne').mockResolvedValue(mockAluno as Aluno);
      jest.spyOn(inscricaoRepository, 'find').mockResolvedValue([mockInscricaoSemPendencias as Inscricao]);

      const result = await service.getInscricoesByAluno('clerk_123');

      expect(result).toEqual([]);
    });

    it('should return empty array when student has no inscriptions', async () => {
      jest.spyOn(alunoRepository, 'findOne').mockResolvedValue(mockAluno as Aluno);
      jest.spyOn(inscricaoRepository, 'find').mockResolvedValue([]);

      const result = await service.getInscricoesByAluno('clerk_123');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when student is not found', async () => {
      jest.spyOn(alunoRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getInscricoesByAluno('clerk_inexistente')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getInscricoesByAluno('clerk_inexistente')).rejects.toThrow(
        'Aluno não encontrado',
      );

      expect(alunoRepository.findOne).toHaveBeenCalledWith({
        where: { id_clerk: 'clerk_inexistente' },
      });
    });

    it('should throw BadRequestException when repository throws an error', async () => {
      jest.spyOn(alunoRepository, 'findOne').mockRejectedValue(new Error('Database error'));

      await expect(service.getInscricoesByAluno('clerk_123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getInscricoesByAluno('clerk_123')).rejects.toThrow(
        'Falha ao buscar inscrições com pendências do aluno: Database error',
      );
    });

    it('should filter out approved documents and keep only pending ones with validation data', async () => {
      const mockValidacao2 = {
        id: 2,
        parecer: 'Documento em análise',
        data_validacao: new Date('2024-01-20'),
      } as Partial<Validacao>;

      const mockInscricaoMultiplosDocumentos = {
        ...mockInscricao,
        documentos: [
          mockDocumentoPendente,
          mockDocumentoAprovado,
          {
            documento_id: 3,
            tipo_documento: EnumTipoDocumento.HISTORICO_ESCOLAR,
            status_documento: StatusDocumento.PENDENTE,
            documento_url: 'http://example.com/historico.pdf',
            validacoes: [mockValidacao2],
          } as Partial<Documento>,
        ],
      };

      jest.spyOn(alunoRepository, 'findOne').mockResolvedValue(mockAluno as Aluno);
      jest.spyOn(inscricaoRepository, 'find').mockResolvedValue([mockInscricaoMultiplosDocumentos as Inscricao]);

      const result = await service.getInscricoesByAluno('clerk_123');

      expect(result[0].documentos).toHaveLength(2);
      expect(result[0].documentos.every(doc => doc.status_documento === StatusDocumento.PENDENTE)).toBe(true);
      expect(result[0].documentos[0].parecer).toBe('Documento necessita correção');
      expect(result[0].documentos[1].parecer).toBe('Documento em análise');
    });

    it('should return null validation fields when document has no validations', async () => {
      const mockDocumentoSemValidacao = {
        documento_id: 4,
        tipo_documento: EnumTipoDocumento.COMPROVANTE_MATRICULA,
        status_documento: StatusDocumento.PENDENTE,
        documento_url: 'http://example.com/matricula.pdf',
        validacoes: [],
      } as Partial<Documento>;

      const mockInscricaoSemValidacao = {
        ...mockInscricao,
        documentos: [mockDocumentoSemValidacao],
      };

      jest.spyOn(alunoRepository, 'findOne').mockResolvedValue(mockAluno as Aluno);
      jest.spyOn(inscricaoRepository, 'find').mockResolvedValue([mockInscricaoSemValidacao as Inscricao]);

      const result = await service.getInscricoesByAluno('clerk_123');

      expect(result[0].documentos[0].parecer).toBeNull();
      expect(result[0].documentos[0].data_validacao).toBeNull();
    });
  });
}); 