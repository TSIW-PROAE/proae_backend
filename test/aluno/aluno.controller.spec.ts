// import { AlunoController } from '@/src/aluno/aluno.controller';
// import { AlunoService } from '@/src/aluno/aluno.service';
// import { UnidadeEnum } from '@/src/enum/enumCampus';
// import { CursosEnum } from '@/src/enum/enumCursos';
// import { PronomesEnum } from '@/src/enum/enumPronomes';
// import AuthenticatedRequest from '@/src/types/authenticated-request.interface';
// import { NotFoundException } from '@nestjs/common';
// import { Test } from '@nestjs/testing';

// describe('AlunoController', () => {
//   let alunoController: AlunoController;
//   let alunoService: AlunoService;

//   beforeEach(async () => {
//     const moduleRef = await Test.createTestingModule({
//       controllers: [AlunoController],
//       providers: [
//         {
//           provide: AlunoService,
//           useValue: {
//             findByClerkId: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     alunoController = moduleRef.get(AlunoController);
//     alunoService = moduleRef.get(AlunoService);
//   });

//   describe('findOne', () => {
//     it('deve retornar os dados de um aluno da service', async () => {
//       const mockUserId = 'userId_jkshSDFHsd';
//       const mockSessionId = 'sessionId_jkshDFFVSERgegERGefSDFHsd';

//       const mockRequest = {
//         user: {
//           id: mockUserId,
//           sessionId: mockSessionId,
//         },
//       };

//       const mockResponse = {
//         sucesso: true,
//         dados: {
//           aluno: {
//             aluno_id: 123456,
//             nome: 'John',
//             sobrenome: 'Doe',
//             email: 'johndoe@gmail.com',
//             matricula: 'm-123456789',
//             pronome: PronomesEnum.ELE_DELE,
//             data_nascimento: new Date('2000-01-01'),
//             curso: CursosEnum.ARTES,
//             campus: UnidadeEnum.SALVADOR,
//             cpf: '12345678900',
//             data_ingresso: new Date('2020-01-01'),
//             celular: '999999999',
//             inscricoes: [],
//           },
//         },
//       };

//       jest
//         .spyOn(alunoService, 'findByClerkId')
//         .mockResolvedValue(mockResponse as any);

//       const result = await alunoController.findOne(
//         mockRequest as AuthenticatedRequest,
//       );

//       expect(alunoService.findByClerkId).toHaveBeenCalledWith(mockUserId);
//       expect(result).toEqual(mockResponse);
//     });

//     it('deve lançar uma exceção NotFoundException quando o aluno não for encontrado', async () => {
//       const mockUserId = 'userId_jkshSDFHsd';
//       const mockSessionId = 'sessionId_jkshDFFVSERgegERGefSDFHsd';

//       const mockRequest = {
//         user: {
//           id: mockUserId,
//           sessionId: mockSessionId,
//         },
//       };

//       jest
//         .spyOn(alunoService, 'findByClerkId')
//         .mockRejectedValue(new NotFoundException('Aluno não encontrado'));

//       await expect(
//         alunoController.findOne(mockRequest as AuthenticatedRequest),
//       ).rejects.toThrow(NotFoundException);
//     });
//   });
// });
