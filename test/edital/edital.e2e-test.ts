// import { EditalEnum } from '@/src/enum/enumEdital';
// import { StatusEdital } from '@/src/enum/enumStatusEdital';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { Test, TestingModule } from '@nestjs/testing';
// import { CreateEditalDto } from 'src/edital/dto/create-edital.dto';
// import { UpdateEditalDto } from 'src/edital/dto/update-edital.dto';
// import * as request from 'supertest';
// import { AppModule } from '../../src/app.module';

// describe('EditalController (e2e)', () => {
//   let app: INestApplication;
//   let editalId: number;

//   const createEditalDto: CreateEditalDto = {
//     tipo_edital: EditalEnum.AUXILIO_ALIMENTACAO,
//     descricao: 'Edital de teste e2e',
//     edital_url: 'http://example.com/edital',
//     titulo_edital: 'Edital de teste e2e',
//     quantidade_bolsas: 10,
//     etapas: [
//       {
//         nome: 'Etapa 1',
//         ordem: 1,
//         data_inicio: new Date('2023-01-01'),
//         data_fim: new Date('2023-06-31'),
//       },
//       {
//         nome: 'Etapa 2',
//         ordem: 2,
//         data_inicio: new Date('2023-07-01'),
//         data_fim: new Date('2023-12-31'),
//       },
//     ],
//   };

//   const updateEditalDto: UpdateEditalDto = {
//     descricao: 'Edital de teste e2e atualizado',
//     status_edital: StatusEdital.ENCERRADO,
//   };

//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     app.useGlobalPipes(new ValidationPipe({ transform: true }));
//     await app.init();
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   it('/editais (POST) - should create a new edital', () => {
//     return request(app.getHttpServer())
//       .post('/editais')
//       .send(createEditalDto)
//       .expect(201)
//       .then((response) => {
//         expect(response.body).toBeDefined();
//         expect(response.body.id).toBeDefined();
//         expect(response.body.tipo_beneficio).toBe(createEditalDto.tipo_edital);
//         expect(response.body.descricao).toBe(createEditalDto.descricao);
//         expect(response.body.edital_url).toBe(createEditalDto.edital_url);

//         // Save the ID for later tests
//         editalId = response.body.id;
//       });
//   });

//   it('/editais (GET) - should return an array of editais', () => {
//     return request(app.getHttpServer())
//       .get('/editais')
//       .expect(200)
//       .then((response) => {
//         expect(Array.isArray(response.body)).toBe(true);
//         expect(response.body.length).toBeGreaterThan(0);
//       });
//   });

//   it('/editais/:id (GET) - should return a single edital by id', () => {
//     return request(app.getHttpServer())
//       .get(`/editais/${editalId}`)
//       .expect(200)
//       .then((response) => {
//         expect(response.body).toBeDefined();
//         expect(response.body.id).toBe(editalId);
//         expect(response.body.tipo_beneficio).toBe(createEditalDto.tipo_edital);
//         expect(response.body.descricao).toBe(createEditalDto.descricao);

//         // Check that etapas were created properly
//         expect(Array.isArray(response.body.etapas)).toBe(true);
//         expect(response.body.etapas.length).toBe(2);
//         expect(response.body.etapas[0].nome).toBe('Etapa de Teste 1');
//         expect(response.body.etapas[0].ordem).toBe(1);
//         expect(response.body.etapas[1].nome).toBe('Etapa de Teste 2');
//         expect(response.body.etapas[1].ordem).toBe(2);
//       });
//   });

//   it('/editais/:id (PATCH) - should update an edital', () => {
//     return request(app.getHttpServer())
//       .patch(`/editais/${editalId}`)
//       .send(updateEditalDto)
//       .expect(200)
//       .then(() => {
//         // Verify the update by getting the edital
//         return request(app.getHttpServer())
//           .get(`/editais/${editalId}`)
//           .expect(200)
//           .then((response) => {
//             expect(response.body.descricao).toBe(updateEditalDto.descricao);
//             expect(response.body.status_edital).toBe(
//               updateEditalDto.status_edital,
//             );
//           });
//       });
//   });

//   it('/editais/:id (DELETE) - should delete an edital and related entities', () => {
//     // First, create a new edital specifically for deletion
//     const deletionEditalDto = {
//       ...createEditalDto,
//       descricao: 'Edital para ser excluído',
//     };

//     return request(app.getHttpServer())
//       .post('/editais')
//       .send(deletionEditalDto)
//       .expect(201)
//       .then((createResponse) => {
//         const deleteId = createResponse.body.id;

//         // Now delete the edital
//         return request(app.getHttpServer())
//           .delete(`/editais/${deleteId}`)
//           .expect(200)
//           .then((deleteResponse) => {
//             expect(deleteResponse.body).toBeDefined();
//             expect(deleteResponse.body.message).toBe(
//               'Edital e entidades relacionadas excluídos com sucesso',
//             );

//             // Verify the edital is gone by trying to get it
//             return request(app.getHttpServer())
//               .get(`/editais/${deleteId}`)
//               .expect(404);
//           });
//       });
//   });

//   it('/editais/:id (DELETE) - should return 404 for non-existent edital', () => {
//     const nonExistentId = 9999;

//     return request(app.getHttpServer())
//       .delete(`/editais/${nonExistentId}`)
//       .expect(404)
//       .then((response) => {
//         expect(response.body).toBeDefined();
//         expect(response.body.message).toBe('Edital não encontrado');
//       });
//   });
// });
