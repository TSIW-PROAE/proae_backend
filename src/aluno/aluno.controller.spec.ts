import { Test } from '@nestjs/testing';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { PronomesEnum } from '../enum/enumPronomes';
import { UnidadeEnum } from '../enum/enumCampus';
import { CursosEnum } from '../enum/enumCursos';
import { NotFoundException } from '@nestjs/common';

describe('AlunoController', () => {
  let alunoController: AlunoController;
  let alunoService: AlunoService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AlunoController],
      providers: [
        {
          provide: AlunoService,
          useValue: {
            findByClerkId: jest.fn(),
          },
        },
      ],
    }).compile();

    alunoController = moduleRef.get(AlunoController);
    alunoService = moduleRef.get(AlunoService);
  });

  describe('findOne', () => {
    it('deve retornar os dados de um aluno da service', async () => {
      const mockUserId = 'userId_jkshSDFHsd';
      const mockSessionId = 'sessionId_jkshDFFVSERgegERGefSDFHsd';

      const mockRequest = {
        user: {
          id: mockUserId,
          sessionId: mockSessionId,
        },
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            aluno_id: 123456,
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@gmail.com',
            registrationNumber: 'm-123456789',
            pronoun: PronomesEnum.ELE_DELE,
            dateOfBirth: new Date('2000-01-01'),
            course: CursosEnum.ARTES,
            campus: UnidadeEnum.SALVADOR,
            cpf: '12345678900',
            enrollmentDate: new Date('2020-01-01'),
            identity: '123456789',
            phone: '999999999',
            enrollments: [],
          },
        },
      };

      jest.spyOn(alunoService, 'findByClerkId').mockResolvedValue(mockResponse);

      const result = await alunoController.findOne(
        mockRequest as AuthenticatedRequest,
      );

      expect(alunoService.findByClerkId).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockResponse);
    });

    it('deve lançar uma exceção NotFoundException quando o aluno não for encontrado', async () => {
      const mockUserId = 'userId_jkshSDFHsd';
      const mockSessionId = 'sessionId_jkshDFFVSERgegERGefSDFHsd';

      const mockRequest = {
        user: {
          id: mockUserId,
          sessionId: mockSessionId,
        },
      };

      jest
        .spyOn(alunoService, 'findByClerkId')
        .mockRejectedValue(new NotFoundException('Aluno não encontrado'));

      await expect(
        alunoController.findOne(mockRequest as AuthenticatedRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
