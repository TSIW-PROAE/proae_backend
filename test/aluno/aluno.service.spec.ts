import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { DeepPartial } from 'typeorm';
import { AlunoService } from '../../src/aluno/aluno.service';
import { Usuario } from '../../src/entities/usuarios/usuario.entity';
import { Step } from '../../src/entities/step/step.entity';
import { Edital } from '../../src/entities/edital/edital.entity';
import { Vagas } from '../../src/entities/vagas/vagas.entity';
import { Inscricao } from '../../src/entities/inscricao/inscricao.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusDocumento } from '../../src/enum/statusDocumento';
import { AtualizaDadosAlunoDTO } from '../../src/aluno/dto/atualizaDadosAluno';
import { Aluno } from '../../src/entities/aluno/aluno.entity';
import { UnidadeEnum } from '../../src/enum/enumCampus';
import { StatusInscricao } from '../../src/enum/enumStatusInscricao';

describe('AlunoService', () => {
  let service: AlunoService;
  let usuarioRepository: Repository<Usuario>;
  let stepRepository: Repository<Step>;
  let editalRepository: Repository<Edital>;
  let vagasRepository: Repository<Vagas>;
  let inscricaoRepository: Repository<Inscricao> & { createQueryBuilder?: any };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlunoService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Step),
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
          provide: getRepositoryToken(Vagas),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Inscricao),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlunoService>(AlunoService);
    usuarioRepository = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
    stepRepository = module.get<Repository<Step>>(getRepositoryToken(Step));
    editalRepository = module.get<Repository<Edital>>(getRepositoryToken(Edital));
    vagasRepository = module.get<Repository<Vagas>>(getRepositoryToken(Vagas));
    inscricaoRepository = module.get<any>(getRepositoryToken(Inscricao));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUsers', () => {
    it('should return mapped users when at least one user with aluno exists', async () => {
      // Arrange
      const usuariosMock: DeepPartial<Usuario>[] = [
        {
          usuario_id: '11111111-1111-1111-1111-111111111111',
          email: 'aluno1@ufba.br',
          data_nascimento: new Date('2000-01-02'),
          cpf: '123.456.789-09',
          celular: '+5584999999999',
          aluno: {
            aluno_id: 1,
            matricula: '20230001',
            curso: 'Computação',
            campus: UnidadeEnum.SALVADOR,
            data_ingresso: '2020-01-01',
            inscricoes: [],
          },
        },
      ];
      (usuarioRepository.find as jest.Mock).mockResolvedValue(usuariosMock);

      // Act
      const result = await service.findUsers();

      // Assert
      expect(result.sucesso).toBe(true);
      expect(result.dados).toHaveLength(1);
      expect(result.dados[0]).toMatchObject({
        email: 'aluno1@ufba.br',
        matricula: '20230001',
        curso: 'Computação',
      });
    });

    it('should throw NotFound if no users are found', async () => {
      // Arrange
      (usuarioRepository.find as jest.Mock).mockResolvedValue([]);

      // Act
      const findUsersCall = service.findUsers();

      // Assert
      await expect(findUsersCall).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should return aluno data if user and aluno exist', async () => {
      // Arrange
      const usuarioMock: DeepPartial<Usuario> = {
        usuario_id: '22222222-2222-2222-2222-222222222222',
        email: 'aluno2@ufba.br',
        data_nascimento: new Date('2001-02-03'),
        cpf: '987.654.321-00',
        celular: '+5584888888888',
        aluno: {
          aluno_id: 2,
          matricula: '20230002',
          curso: 'Engenharia',
          campus: UnidadeEnum.SALVADOR,
          data_ingresso: '2021-03-04',
          inscricoes: [],
        },
      };
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(usuarioMock);

      // Act
      const result = await service.findByUserId('22222222-2222-2222-2222-222222222222');

      // Assert
      expect(result.sucesso).toBe(true);
      expect(result.dados.aluno.email).toBe('aluno2@ufba.br');
      expect(result.dados.aluno.matricula).toBe('20230002');
    });

    it('should throw NotFound if user or aluno is not found', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const findByUserIdCall = service.findByUserId('ffffffff-ffff-ffff-ffff-ffffffffffff');

      // Assert
      await expect(findByUserIdCall).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('hasReprovadoDocuments', () => {
    it('should return true if any document is REPROVADO', async () => {
      // Arrange
      const usuarioMock: DeepPartial<Usuario> = {
        aluno: {
          inscricoes: [
            { documentos: [{ status_documento: StatusDocumento.APROVADO }, { status_documento: StatusDocumento.REPROVADO }] },
          ],
        } as any,
      };
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(usuarioMock);

      // Act
      const hasRejected = await service.hasReprovadoDocuments('11111111-1111-1111-1111-111111111111');

      // Assert
      expect(hasRejected).toBe(true);
    });

    it('should return false if no user or aluno or no REPROVADO documents', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({ aluno: { inscricoes: [{ documentos: [{ status_documento: StatusDocumento.APROVADO }] }] } } as Partial<Usuario> as any);

      // Act
      const hasRejected = await service.hasReprovadoDocuments('11111111-1111-1111-1111-111111111111');

      // Assert
      expect(hasRejected).toBe(false);
    });
  });

  describe('updateStudentData', () => {
    it('should update student and user data when payload is valid and email is free', async () => {
      // Arrange
      const usuarioMock: DeepPartial<Usuario> = {
        usuario_id: '33333333-3333-3333-3333-333333333333',
        email: 'old@ufba.br',
        celular: '+5584777777777',
        aluno: {
          aluno_id: 3,
          matricula: '20230003',
          curso: 'Direito',
          campus: UnidadeEnum.SALVADOR,
          data_ingresso: '2020-01-01',
        },
      };
      (usuarioRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(usuarioMock) // find by userId
        .mockResolvedValueOnce(null); // email not in use

      const updateDto: AtualizaDadosAlunoDTO = {
        email: 'new@ufba.br',
        celular: '+5584666666666',
        matricula: '20239999',
        curso: 'Medicina',
        campus: UnidadeEnum.SALVADOR as any,
        data_ingresso: '2022-02-02' as any,
      } as any;

      // Act
      const result = await service.updateStudentData('33333333-3333-3333-3333-333333333333', updateDto);

      // Assert
      expect(usuarioRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Dados do aluno atualizados com sucesso!' });
    });

    it('should throw NotFound if user or aluno is not found', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const updateCall = service.updateStudentData('00000000-0000-0000-0000-000000000000', {} as any);

      // Assert
      await expect(updateCall).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequest if no data provided', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({ aluno: {} } as Partial<Usuario> as any);

      // Act
      const updateCall = service.updateStudentData('33333333-3333-3333-3333-333333333333', {} as any);

      // Assert
      await expect(updateCall).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequest if email is already in use by another user', async () => {
      // Arrange
      const usuarioMock: DeepPartial<Usuario> = { email: 'old@ufba.br', aluno: {} };
      (usuarioRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(usuarioMock) // find by userId
        .mockResolvedValueOnce({ usuario_id: '99999999-9999-9999-9999-999999999999' } as DeepPartial<Usuario>); // email exists

      const updateDto: AtualizaDadosAlunoDTO = { email: 'old2@ufba.br' } as any;

      // Act
      const updateCall = service.updateStudentData('33333333-3333-3333-3333-333333333333', updateDto);

      // Assert
      await expect(updateCall).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('checkUpdatePermission', () => {
    it('should return canUpdate true when user has REPROVADO documents', async () => {
      // Arrange
      jest.spyOn(service, 'hasReprovadoDocuments').mockResolvedValue(true);

      // Act
      const result = await service.checkUpdatePermission('11111111-1111-1111-1111-111111111111');

      // Assert
      expect(result.success).toBe(true);
      expect(result.canUpdate).toBe(true);
      expect(result.message).toContain('pode editar');
    });

    it('should return canUpdate false when user has no REPROVADO documents', async () => {
      // Arrange
      jest.spyOn(service, 'hasReprovadoDocuments').mockResolvedValue(false);

      // Act
      const result = await service.checkUpdatePermission('11111111-1111-1111-1111-111111111111');

      // Assert
      expect(result.success).toBe(true);
      expect(result.canUpdate).toBe(false);
      expect(result.message).toContain('não possui documentos reprovados');
    });
  });

  describe('findAlunosInscritosEmStep', () => {
    it('should throw NotFound if edital is not found', async () => {
      // Arrange
      (editalRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const callFind = service.findAlunosInscritosEmStep(1, 10);

      // Assert
      await expect(callFind).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFound if step is not found for the edital', async () => {
      // Arrange
      (editalRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, steps: [] });
      (stepRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const callFind = service.findAlunosInscritosEmStep(1, 10);

      // Assert
      await expect(callFind).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return empty data when there are no vagas in edital', async () => {
      // Arrange
      (editalRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, steps: [] });
      (stepRepository.findOne as jest.Mock).mockResolvedValue({ id: 10, edital: { id: 1 } });
      (vagasRepository.find as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.findAlunosInscritosEmStep(1, 10);

      // Assert
      expect(result.sucesso).toBe(true);
      expect(result.dados).toEqual([]);
      expect(result.mensagem).toBe('Nenhuma vaga encontrada para este edital.');
    });

    it('should return mapped students when inscricoes exist for the step', async () => {
      // Arrange
      (editalRepository.findOne as jest.Mock).mockResolvedValue({ id: 2, steps: [] });
      (stepRepository.findOne as jest.Mock).mockResolvedValue({ id: 20, edital: { id: 2 } });
      (vagasRepository.find as jest.Mock).mockResolvedValue([{ id: 7 }, { id: 8 }]);

      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 101,
            status_inscricao: StatusInscricao.PENDENTE,
            data_inscricao: new Date('2024-01-01'),
            aluno: {
              aluno_id: 4,
              usuario: {
                usuario_id: '44444444-4444-4444-4444-444444444444',
                email: 'student@ufba.br',
                nome: 'Aluno Exemplo',
                cpf: '123.456.789-09',
                celular: '+5584333333333',
                data_nascimento: new Date('2002-02-02'),
              },
              matricula: '20235555',
              curso: 'Sistemas',
              campus: UnidadeEnum.SALVADOR,
              data_ingresso: '2021-01-01',
            },
            respostas: [
              { pergunta: { id: 1, step: { id: 20 } }, texto: 'resp ok', dataResposta: new Date('2024-01-02') },
              { pergunta: { id: 2, step: { id: 99 } }, texto: 'outro', dataResposta: new Date('2024-01-03') },
            ],
          },
        ]),
      };
      (inscricaoRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      // Act
      const result: any = await service.findAlunosInscritosEmStep(2, 20);

      // Assert
      expect(result.sucesso).toBe(true);
      expect(result.dados.alunos).toHaveLength(1);
      expect(result.dados.alunos[0]).toMatchObject({
        email: 'student@ufba.br',
        curso: 'Sistemas',
      });
      expect(result.dados.alunos[0].respostas_step).toHaveLength(1);
      expect(result.dados.alunos[0].respostas_step[0]).toMatchObject({ pergunta_id: 1, resposta_texto: 'resp ok' });
      expect(qb.leftJoinAndSelect).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalled();
    });
  });
});