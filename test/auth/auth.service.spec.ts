import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../src/email/email.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Usuario } from '../../src/entities/usuarios/usuario.entity';
import { Aluno } from '../../src/entities/aluno/aluno.entity';
import { Admin } from '../../src/entities/admin/admin.entity';
import { RolesEnum } from '../../src/enum/enumRoles';
import { SignupDto } from '../../src/auth/dto/signup.dto';
import { ForgotPasswordDto } from '../../src/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../src/auth/dto/reset-password.dto';
import { SignupDtoAdmin } from '../../src/auth/dto/siginupAdmin.dto';
import { UnidadeEnum } from '../../src/enum/enumCampus';

// Mocks para libs externas
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock('validation-br/dist/cpf', () => ({
  mask: jest.fn((v: string) => v),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usuarioRepository: Repository<Usuario>;
  let alunoRepository: Repository<Aluno>;
  let adminRepository: Repository<Admin>;
  let jwtService: JwtService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Aluno),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Admin),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: EmailService, useValue: { sendPasswordRecovery: jest.fn(), sendAdminApprovalRequest: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuarioRepository = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
    alunoRepository = module.get<Repository<Aluno>>(getRepositoryToken(Aluno));
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (jwtService.sign as jest.Mock).mockReturnValue('jwt-token');
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-id', email: 'e@x.com' });
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
     it('should return user without password when credentials are valid', async () => {
      // Arrange
      const user: Partial<Usuario> = {
        usuario_id: '11111111-1111-1111-1111-111111111111',
        email: 'aluno@ufba.br',
        senha_hash: '$2b$12$abcdefghijkABCDEFGHIJK123456789012345678901234567890',
        nome: 'João Pereira',
        cpf: '123.456.789-09',
        celular: '+5584999999999',
        roles: [RolesEnum.ALUNO],
      };
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const res = await service.validateUser(user.email!, 'senha');

      // Assert
      expect(res).toEqual({
        usuario_id: user.usuario_id,
        email: user.email,
        nome: user.nome,
        cpf: user.cpf,
        celular: user.celular,
        roles: user.roles,
      });
     });

     it('should return null when user does not exist', async () => {
       // Arrange
       (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);

       // Act
       const res = await service.validateUser('naoexiste@ufba.br', 'senha');

       // Assert
       expect(res).toBeNull();
     });

     it('should return null when password is invalid', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({
        usuario_id: '11111111-1111-1111-1111-111111111111',
        email: 'aluno@ufba.br',
        senha_hash: '$2b$12$abcdefghijkABCDEFGHIJK123456789012345678901234567890',
        nome: 'João Pereira',
        cpf: '123.456.789-09',
        celular: '+5584999999999',
        roles: [RolesEnum.ALUNO],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const res = await service.validateUser('aluno@ufba.br', 'senhaErrada');

      // Assert
      expect(res).toBeNull();
     });
   });

  describe('login', () => {
    it('should return token and user data when a valid user logs in', async () => {
      // Arrange
      const user: Partial<Usuario> = {
        usuario_id: '11111111-1111-1111-1111-111111111111',
        email: 'a@b.com',
        nome: 'Nome',
        roles: [RolesEnum.ALUNO],
      };
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      // Act
      const res = await service.login(user as Usuario);

      // Assert
      expect(res.access_token).toBe('token');
      expect(res.user).toEqual({ usuario_id: '11111111-1111-1111-1111-111111111111', email: 'a@b.com', nome: 'Nome', roles: [RolesEnum.ALUNO] });
      expect(jwtService.sign as jest.Mock).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should return success when user logs out', async () => {
      // Arrange
      // none

      // Act
      const res = await service.logout();

      // Assert
      expect(res).toEqual({ sucesso: true, mensagem: 'Logout realizado com sucesso' });
    });
  });

  describe('signupAluno', () => {
    const dto: SignupDto = {
      email: 'novoaluno@ufba.br',
      nome: 'Maria Souza',
      cpf: '123.456.789-09',
      celular: '+5584998887777',
      senha: 'SenhaForte@123',
      data_nascimento: '2000-01-01',
      matricula: '202301234',
      curso: 'Engenharia de Computação',
      campus: UnidadeEnum.SALVADOR,
      data_ingresso: '2020-01-01',
    };

    it('should register student successfully when email and cpf are unique', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (usuarioRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (alunoRepository.create as jest.Mock).mockReturnValue({} as any);
      (usuarioRepository.create as jest.Mock).mockReturnValue({ senha_hash: 'hashed' } as any);
      (usuarioRepository.save as jest.Mock).mockResolvedValue({ usuario_id: '11111111-1111-1111-1111-111111111111', senha_hash: 'hashed' } as any);

      // Act
      const res = await service.signupAluno(dto);

      // Assert
      expect(res.sucesso).toBe(true);
      expect(usuarioRepository.save).toHaveBeenCalled();
    });

    it('should throw error if email is duplicate', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValueOnce({ usuario_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } as any);

      // Act
      const signupAlunoCall = service.signupAluno(dto);

      // Assert
      await expect(signupAlunoCall).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw error if cpf is duplicate', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ usuario_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' } as any);

      // Act
      const signupAlunoCall = service.signupAluno(dto);

      // Assert
      await expect(signupAlunoCall).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw internal error if saving fails', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (usuarioRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (usuarioRepository.save as jest.Mock).mockRejectedValue(new Error('db error'));

      // Act
      const signupAlunoCall = service.signupAluno(dto);

      // Assert
      await expect(signupAlunoCall).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('updatePassword', () => {
    it('should update password if user exists', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({ usuario_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' } as any);

      // Act
      const res = await service.updatePassword('cccccccc-cccc-cccc-cccc-cccccccccccc', 'nova');

      // Assert
      expect(res).toEqual({ sucesso: true, mensagem: 'Senha atualizada com sucesso' });
      expect(usuarioRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFound if user does not exist', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const updatePasswordCall = service.updatePassword('dddddddd-dddd-dddd-dddd-dddddddddddd', 'nova');

      // Assert
      await expect(updatePasswordCall).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('forgotPassword', () => {
    it('should send email if user exists', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({ email: 'a@b.com' } as any);
      (jwtService.sign as jest.Mock).mockReturnValue('reset-token');
      const payload: ForgotPasswordDto = { email: 'a@b.com' };

      // Act
      const res = await service.forgotPassword(payload);

      // Assert
      expect(emailService.sendPasswordRecovery).toHaveBeenCalledWith('a@b.com', 'reset-token');
      expect(res).toEqual({ sucesso: true, mensagem: 'Email de recuperação enviado' });
    });

    it('should throw NotFound if email is not found', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);
      const payload: ForgotPasswordDto = { email: 'x@x.com' };

      // Act
      const forgotPasswordCall = service.forgotPassword(payload);

      // Assert
      await expect(forgotPasswordCall).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should throw error if passwords do not match', async () => {
      // Arrange
      const payload: ResetPasswordDto = { token: 't', newPassword: 'a', confirmPassword: 'b' };

      // Act
      const resetPasswordCall = service.resetPassword(payload);

      // Assert
      await expect(resetPasswordCall).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should change password if token is valid', async () => {
      // Arrange
      (jwtService.verify as jest.Mock).mockReturnValue({ email: 'a@b.com' });
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({ email: 'a@b.com' } as any);
      const payload: ResetPasswordDto = { token: 't', newPassword: 'a', confirmPassword: 'a' };

      // Act
      const res = await service.resetPassword(payload);

      // Assert
      expect(usuarioRepository.save).toHaveBeenCalled();
      expect(res).toEqual({ sucesso: true, mensagem: 'Senha alterada com sucesso' });
    });

    it('should throw Unauthorized if token is invalid', async () => {
      // Arrange
      (jwtService.verify as jest.Mock).mockReturnValue({ email: 'a@b.com' });
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);
      const payload: ResetPasswordDto = { token: 't', newPassword: 'a', confirmPassword: 'a' };

      // Act
      const resetPasswordCall = service.resetPassword(payload);

      // Assert
      await expect(resetPasswordCall).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('should return valid if user is found', async () => {
      // Arrange
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' });
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({ usuario_id: '11111111-1111-1111-1111-111111111111', roles: [RolesEnum.ALUNO] } as any);

      // Act
      const res = await service.validateToken('token');

      // Assert
      expect(res.valid).toBe(true);
      expect(res.user).toBeDefined();
    });

    it('should return invalid if verification fails', async () => {
      // Arrange
      (jwtService.verify as jest.Mock).mockImplementation(() => { throw new Error('bad'); });

      // Act
      const validateTokenResult = await service.validateToken('token');

      // Assert
      expect(validateTokenResult.valid).toBe(false);
      expect(validateTokenResult.error).toBe('bad');
    });

    it('should return invalid if user is not found', async () => {
      // Arrange
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'ffffffff-ffff-ffff-ffff-ffffffffffff' });
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const validateTokenResult = await service.validateToken('token');

      // Assert
      expect(validateTokenResult.valid).toBe(false);
      expect(validateTokenResult.error).toBeDefined();
    });
  });

  describe('signupAdmin', () => {
    const dto: SignupDtoAdmin = {
      email: 'admin@ufba.br',
      nome: 'Carlos Admin',
      cpf: '987.654.321-00',
      celular: '+5584991112222',
      senha: 'SenhaAdmin@123',
      data_nascimento: '1990-01-01',
      cargo: 'Servidor',
    };

    it('should register admin successfully and send approval request when data is valid', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (usuarioRepository.create as jest.Mock).mockReturnValue({} as any);
      (usuarioRepository.save as jest.Mock).mockResolvedValue({ usuario_id: '22222222-2222-2222-2222-222222222222', email: 'admin@ufba.br' } as any);
      (adminRepository.create as jest.Mock).mockReturnValue({ id_admin: 5 } as any);
      (adminRepository.save as jest.Mock).mockResolvedValue({ id_admin: 5, usuario: { usuario_id: '22222222-2222-2222-2222-222222222222', email: 'admin@ufba.br' } } as any);
      (jwtService.sign as jest.Mock).mockReturnValue('approval-token');

      // Act
      const res = await service.signupAdmin(dto);

      // Assert
      expect(res.sucesso).toBe(true);
      expect(adminRepository.update).toHaveBeenCalled();
      expect(emailService.sendAdminApprovalRequest).toHaveBeenCalledWith('admin@ufba.br', 'approval-token');
    });

    it('should fail if email is duplicate', async () => {
      // Arrange
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue({ usuario_id: 'x' } as any);

      // Act
      const signupAdminCall = service.signupAdmin(dto);

      // Assert
      await expect(signupAdminCall).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('approveAdmin', () => {
    it('should approve if token is valid and not expired', async () => {
      // Arrange
      (adminRepository.findOne as jest.Mock).mockResolvedValue({ approvalToken: 't', approvalTokenExpires: new Date(Date.now() + 10000), usuario: {} } as any);

      // Act
      await service.approveAdmin('t');

      // Assert
      expect(adminRepository.save).toHaveBeenCalled();
    });

    it('should not approve if admin is not found', async () => {
      // Arrange
      (adminRepository.findOne as jest.Mock).mockResolvedValue(null as any);

      // Act
      const approveAdminCall = service.approveAdmin('t');

      // Assert
      await expect(approveAdminCall).rejects.toBeDefined();
    });

    it('should not approve if token is expired', async () => {
      // Arrange
      (adminRepository.findOne as jest.Mock).mockResolvedValue({ approvalToken: 't', approvalTokenExpires: new Date(Date.now() - 1000), usuario: {} } as any);

      // Act
      const approveAdminCall = service.approveAdmin('t');

      // Assert
      await expect(approveAdminCall).rejects.toBeDefined();
    });
  });

  describe('rejectAdmin', () => {
     it('should reject and remove user if token is valid and not expired', async () => {
      // Arrange
      const adminMock = {
         approvalToken: 't',
         approvalTokenExpires: new Date(Date.now() + 10000),
         usuario: {
          usuario_id: '22222222-2222-2222-2222-222222222222',
           email: 'adminrejeitar@ufba.br',
           cpf: '111.222.333-44',
           celular: '+5584993334444',
         },
       } as any;
       (adminRepository.findOne as jest.Mock).mockResolvedValue(adminMock);
       (usuarioRepository.remove as jest.Mock).mockResolvedValue({});

       // Act
       const res = await service.rejectAdmin('t');

       // Assert
       expect(usuarioRepository.remove).toHaveBeenCalledWith(adminMock.usuario);
       expect(res).toEqual({ sucesso: true, mensagem: 'Admin rejeitado e removido' });
     });

     it('should fail if admin is not found', async () => {
       // Arrange
       (adminRepository.findOne as jest.Mock).mockResolvedValue(null as any);

       // Act
       const rejectAdminCall = service.rejectAdmin('t');

       // Assert
       await expect(rejectAdminCall).rejects.toBeInstanceOf(BadRequestException);
     });

     it('should fail if token is expired', async () => {
      // Arrange
      (adminRepository.findOne as jest.Mock).mockResolvedValue({
         approvalToken: 't',
         approvalTokenExpires: new Date(Date.now() - 1000),
         usuario: { usuario_id: '22222222-2222-2222-2222-222222222222', email: 'expirado@ufba.br', cpf: '555.666.777-88', celular: '+5584995556666' },
       } as any);

       // Act
       const rejectAdminCall = service.rejectAdmin('t');

       // Assert
       await expect(rejectAdminCall).rejects.toBeInstanceOf(BadRequestException);
     });
   });
});