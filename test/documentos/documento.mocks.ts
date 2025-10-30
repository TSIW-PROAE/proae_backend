import { Aluno } from "@/src/entities/aluno/aluno.entity";
import { Documento } from "@/src/entities/documento/documento.entity";
import { Inscricao } from "@/src/entities/inscricao/inscricao.entity";
import { Usuario } from "@/src/entities/usuarios/usuario.entity";
import { RolesEnum } from "@/src/enum/enumRoles";
import { StatusDocumento } from "@/src/enum/statusDocumento";

// ========== USUÁRIOS ==========
export const mockUsuarioMaria = {
  usuario_id: 2,
  email: 'maria.silva@ufba.br',
  nome: 'Maria Silva Santos',
  cpf: '12345678902',
  celular: '71988888888',
  roles: [RolesEnum.ALUNO],
} as Usuario;

export const mockUsuarioMarcos = {
  usuario_id: 7,
  email: 'marcos.medeiros@ufba.br',
  nome: 'Marcos Medeiros',
  cpf: '12345678905',
  celular: '71988888887',
  roles: [RolesEnum.ALUNO],
} as Usuario;

export const mockUsuarioPedro = {
  usuario_id: 8,
  email: 'pedro.medeiros@ufba.br',
  nome: 'Pedro Medeiros',
  cpf: '12345678906',
  celular: '71988888886',
  roles: [RolesEnum.ALUNO],
} as Usuario;

// ========== ALUNOS ==========
export const mockAlunoMaria = {
  aluno_id: 1,
  matricula: '2024001001',
  curso: 'Ciência da Computação',
  campus: 'Salvador',
  data_ingresso: '2024-03-01',
  usuario: mockUsuarioMaria,
} as Aluno;

// ========== EDITAIS ==========
export const mockEditalResidencias = {
  id: 2,
  titulo_edital: 'Residências Universitárias 2024.1',
  descricao: 'Seleção para concessão de vagas em residências universitárias da UFBA. DOCUMENTOS OBRIGATÓRIOS: CPF, RG, Histórico Escolar e Comprovante de Matrícula.',
  status_edital: 'Edital em andamento',
};

export const mockEditalTransporte = {
  id: 3,
  titulo_edital: 'Auxílio Transporte 2024.1',
  descricao: 'Auxílio financeiro para transporte dos alunos.',
  status_edital: 'Edital em andamento',
};

// ========== VAGAS ==========
export const mockVagaResidenciaFeminina = {
  id: 4,
  beneficio: 'Residência Feminina Salvador',
  descricao_beneficio: 'Vaga em residência universitária feminina no campus Salvador',
  numero_vagas: 30,
  edital: mockEditalResidencias,
};

export const mockVagaTransporte = {
  id: 3,
  beneficio: 'Auxílio Transporte',
  descricao_beneficio: 'Auxílio financeiro mensal para transporte',
  numero_vagas: 100,
  edital: mockEditalTransporte,
};

// ========== INSCRIÇÕES ==========
export const mockInscricaoMariaResidencia = {
  id: 5,
  data_inscricao: new Date('2024-10-10'),
  status_inscricao: 'Inscrição Pendente',
  vagas: mockVagaResidenciaFeminina,
  aluno: mockAlunoMaria,
} as Partial<Inscricao>;

// ========== VALIDAÇÕES ==========
export const mockValidacaoCPFAprovada = {
  id: 1,
  parecer: 'Documento válido e legível. CPF verificado no sistema da Receita Federal.',
  data_validacao: new Date('2024-10-12'),
};

export const mockValidacaoRGReprovada = {
  id: 2,
  parecer: 'Documento ilegível. Por favor, envie uma cópia mais nítida do RG com todas as informações visíveis.',
  data_validacao: new Date('2024-10-12'),
};

export const mockValidacaoMatriculaPendente = {
  id: 3,
  parecer: 'Documento aguardando análise.',
  data_validacao: new Date('2024-10-12'),
};

// ========== DOCUMENTOS ==========
export const mockDocumentoCPFAprovado = {
  documento_id: 1,
  tipo_documento: 'Comprovante de situação cadastral do cpf',
  documento_url: 'documentos/aluno_1/inscricao_5/cpf_maria_silva.pdf',
  status_documento: StatusDocumento.APROVADO,
  inscricao: mockInscricaoMariaResidencia,
  validacoes: [mockValidacaoCPFAprovada],
} as Partial<Documento>;

export const mockDocumentoRGReprovado = {
  documento_id: 2,
  tipo_documento: 'Documento de Identidade',
  documento_url: 'documentos/aluno_1/inscricao_5/rg_maria_silva.pdf',
  status_documento: StatusDocumento.REPROVADO,
  inscricao: mockInscricaoMariaResidencia,
  validacoes: [mockValidacaoRGReprovada],
} as Partial<Documento>;

export const mockDocumentoHistoricoNaoEnviado = {
  documento_id: 3,
  tipo_documento: 'Cert. de conclusão ou Hist. escolar do ensino médio',
  documento_url: undefined,
  status_documento: StatusDocumento.NAO_ENVIADO,
  inscricao: mockInscricaoMariaResidencia,
  validacoes: [],
} as Partial<Documento>;

export const mockDocumentoMatriculaEmAnalise = {
  documento_id: 4,
  tipo_documento: 'Comprovante de matrícula',
  documento_url: 'documentos/aluno_1/inscricao_5/comprovante_matricula_maria.pdf',
  status_documento: StatusDocumento.EM_ANALISE,
  inscricao: mockInscricaoMariaResidencia,
  validacoes: [mockValidacaoMatriculaPendente],
} as Partial<Documento>;

// ========== CENÁRIOS COMPLETOS ==========

/**
 * Mock da Maria com todos os documentos (como retornado pelo Query Builder)
 * Simula o retorno da query com documentos problemáticos já filtrados
 */
export const mockAlunoMariaComDocumentosProblematicos = {
  aluno_id: 1,
  inscricoes: [
    {
      id: 5,
      documentos: [
        {
          documento_id: 2,
          tipo_documento: 'Documento de Identidade',
          documento_url: 'documentos/aluno_1/inscricao_5/rg_maria_silva.pdf',
          status_documento: StatusDocumento.REPROVADO,
          validacoes: [
            {
              parecer: 'Documento ilegível. Por favor, envie uma cópia mais nítida do RG com todas as informações visíveis.',
              data_validacao: new Date('2024-10-12'),
            },
          ],
        },
        {
          documento_id: 4,
          tipo_documento: 'Comprovante de matrícula',
          documento_url: 'documentos/aluno_1/inscricao_5/comprovante_matricula_maria.pdf',
          status_documento: StatusDocumento.EM_ANALISE,
          validacoes: [
            {
              parecer: 'Documento aguardando análise.',
              data_validacao: new Date('2024-10-12'),
            },
          ],
        },
        {
          documento_id: 3,
          tipo_documento: 'Cert. de conclusão ou Hist. escolar do ensino médio',
          documento_url: null,
          status_documento: StatusDocumento.NAO_ENVIADO,
          validacoes: [],
        },
      ],
      vagas: {
        id: 4,
        edital: {
          titulo_edital: 'Residências Universitárias 2024.1',
        },
      },
    },
  ],
};

/**
 * Mock de aluno sem inscrições
 */
export const mockAlunoSemInscricoes = {
  aluno_id: 1,
  usuario: mockUsuarioMarcos,
  inscricoes: [],
};

/**
 * Mock de aluno sem documentos com problemas
 * Query Builder já filtrou e retornou array vazio
 */
export const mockAlunoSemDocumentosProblematicos = {
  aluno_id: 1,
  usuario: mockUsuarioPedro,
  inscricoes: [
    {
      id: 6,
      documentos: [], // Query Builder já filtrou documentos aprovados
      vagas: {
        id: 3,
        edital: {
          titulo_edital: 'Auxílio Transporte 2024.1',
        },
      },
    },
  ],
};

// ========== RESPOSTAS ESPERADAS ==========

/**
 * Resposta esperada para documentos com problemas da Maria
 */
export const expectedPendenciasMaria = {
  success: true,
  pendencias: [
    {
      inscricao_id: 5,
      titulo_edital: 'Residências Universitárias 2024.1',
      documentos: [
        {
          documento_id: 2,
          tipo_documento: 'Documento de Identidade',
          documento_url: 'documentos/aluno_1/inscricao_5/rg_maria_silva.pdf',
          status_documento: 'Reprovado',
          validacoes: [
            {
              parecer: 'Documento ilegível. Por favor, envie uma cópia mais nítida do RG com todas as informações visíveis.',
              data_validacao: new Date('2024-10-12'),
            },
          ],
        },
        {
          documento_id: 4,
          tipo_documento: 'Comprovante de matrícula',
          documento_url: 'documentos/aluno_1/inscricao_5/comprovante_matricula_maria.pdf',
          status_documento: 'Em Análise',
          validacoes: [
            {
              parecer: 'Documento aguardando análise.',
              data_validacao: new Date('2024-10-12'),
            },
          ],
        },
        {
          documento_id: 3,
          documento_url: null,
          status_documento: 'Não Enviado',
          tipo_documento: 'Cert. de conclusão ou Hist. escolar do ensino médio',
          validacoes: [],
        },
      ],
    },
  ],
};

/**
 * Resposta esperada quando não há pendências
 */
export const expectedSemPendencias = {
  success: true,
  pendencias: [],
};
