import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../src/auth/auth.guard';
import { EditalEnum } from '../src/enum/enumEdital';
import { StatusEdital } from '../src/enum/enumStatusEdital';
import { EnumTipoDocumento } from '../src/enum/enumTipoDocumento';
import { StatusDocumento } from '../src/enum/statusDocumento';
import { InscricaoController } from '../src/inscricao/inscricao.controller';
import { InscricaoService } from '../src/inscricao/inscricao.service';
import AuthenticatedRequest from '../src/types/authenticated-request.interface';

describe('InscricaoController', () => {
  let controller: InscricaoController;
  let service: InscricaoService;

  const mockInscricoesComPendencias = [
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
    {
      titulo_edital: 'Auxílio Transporte',
      tipo_edital: [EditalEnum.AUXILIO_TRANSPORTE],
      documentos: [
        {
          tipo_documento: EnumTipoDocumento.CPF,
          status_documento: StatusDocumento.PENDENTE,
          documento_url: 'http://example.com/cpf.pdf',
          parecer: null,
          data_validacao: null,
        },
        {
          tipo_documento: EnumTipoDocumento.HISTORICO_ESCOLAR,
          status_documento: StatusDocumento.PENDENTE,
          documento_url: 'http://example.com/historico.pdf',
          parecer: 'Em análise pela coordenação',
          data_validacao: new Date('2024-01-20'),
        },
      ],
      status_edital: StatusEdital.EM_ANDAMENTO,
    },
  ];

  const mockAuthenticatedRequest = {
    user: {
      id: 'clerk_123',
      sessionId: 'session_456',
    },
  } as AuthenticatedRequest;

  const mockInscricaoService = {
    getInscricoesByAluno: jest.fn(),
    createInscricao: jest.fn(),
    updateInscricao: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InscricaoController],
      providers: [
        {
          provide: InscricaoService,
          useValue: mockInscricaoService,
        },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: jest.fn().mockReturnValue(true) })
    .compile();

    controller = module.get<InscricaoController>(InscricaoController);
    service = module.get<InscricaoService>(InscricaoService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInscricoesAluno', () => {
    it('should return inscriptions with pending documents for authenticated student', async () => {
      mockInscricaoService.getInscricoesByAluno.mockResolvedValue(mockInscricoesComPendencias);

      const result = await controller.getInscricoesAluno(mockAuthenticatedRequest);

      expect(result).toEqual(mockInscricoesComPendencias);
      expect(mockInscricaoService.getInscricoesByAluno).toHaveBeenCalledWith('clerk_123');
    });

    it('should return empty array when student has no inscriptions with pending documents', async () => {
      mockInscricaoService.getInscricoesByAluno.mockResolvedValue([]);

      const result = await controller.getInscricoesAluno(mockAuthenticatedRequest);

      expect(result).toEqual([]);
      expect(mockInscricaoService.getInscricoesByAluno).toHaveBeenCalledWith('clerk_123');
    });

    it('should handle service errors properly', async () => {
      const error = new Error('Database connection failed');
      mockInscricaoService.getInscricoesByAluno.mockRejectedValue(error);

      await expect(controller.getInscricoesAluno(mockAuthenticatedRequest)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockInscricaoService.getInscricoesByAluno).toHaveBeenCalledWith('clerk_123');
    });

    it('should call service with correct clerk id from authenticated request', async () => {
      const customRequest = {
        user: {
          id: 'clerk_different',
          sessionId: 'session_789',
        },
      } as AuthenticatedRequest;

      mockInscricaoService.getInscricoesByAluno.mockResolvedValue([]);

      await controller.getInscricoesAluno(customRequest);

      expect(mockInscricaoService.getInscricoesByAluno).toHaveBeenCalledWith('clerk_different');
    });
  });
}); 