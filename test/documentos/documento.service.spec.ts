import { DocumentoService } from "@/src/documentos/documentos.service";
import { Aluno } from "@/src/entities/aluno/aluno.entity";
import { Documento } from "@/src/entities/documento/documento.entity";
import { Inscricao } from "@/src/entities/inscricao/inscricao.entity";
import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    mockAlunoMaria,
    mockAlunoMariaComDocumentosProblematicos,
    mockAlunoSemDocumentosProblematicos,
    mockAlunoSemInscricoes,
    expectedPendenciasMaria,
    expectedSemPendencias,
} from "./documento.mocks";

describe('DocumentoService', () => {
    let documentoService: DocumentoService;
    let documentoRepository: Repository<Documento>;
    let alunoRepository: Repository<Aluno>;
    let inscricaoRepository: Repository<Inscricao>;

    beforeEach(async () => {
        // Mock do QueryBuilder
        const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentoService,
                {
                    provide: getRepositoryToken(Documento),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Aluno),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        createQueryBuilder: jest.fn(() => mockQueryBuilder),
                    },
                },
                {
                    provide: getRepositoryToken(Inscricao),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        documentoService = module.get<DocumentoService>(DocumentoService);
        documentoRepository = module.get<Repository<Documento>>(getRepositoryToken(Documento));
        alunoRepository = module.get<Repository<Aluno>>(getRepositoryToken(Aluno));
        inscricaoRepository = module.get<Repository<Inscricao>>(getRepositoryToken(Inscricao));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(documentoService).toBeDefined();
    });


    describe('getDocumentsWithProblemsByStudent', () => {
        it('should return documents with problems for a given alunoId', async () => {
            const mockQueryBuilder = (alunoRepository.createQueryBuilder as jest.Mock)();
            mockQueryBuilder.getOne.mockResolvedValue(mockAlunoMariaComDocumentosProblematicos);

            const result = await documentoService.getDocumentsWithProblemsByStudent(mockAlunoMaria.aluno_id); 

            expect(result).toEqual(expectedPendenciasMaria);
        });

        it('should throw NotFoundException if aluno not found', async () => {
            const mockQueryBuilder = (alunoRepository.createQueryBuilder as jest.Mock)();
            mockQueryBuilder.getOne.mockResolvedValue(null);

            await expect(documentoService.getDocumentsWithProblemsByStudent(999))
                .rejects.toThrow(new NotFoundException('Aluno não encontrado'));
        });

        it('should return empty array if student has no inscriptions', async () => {
            const mockQueryBuilder = (alunoRepository.createQueryBuilder as jest.Mock)();
            mockQueryBuilder.getOne.mockResolvedValue(mockAlunoSemInscricoes);

            const result = await documentoService.getDocumentsWithProblemsByStudent(mockAlunoSemInscricoes.usuario.usuario_id);

            expect(result).toEqual(expectedSemPendencias);
        });

        it('should return empty array if student has no documents with problems', async () => {
            const mockQueryBuilder = (alunoRepository.createQueryBuilder as jest.Mock)();
            mockQueryBuilder.getOne.mockResolvedValue(mockAlunoSemDocumentosProblematicos);
    
            const result = await documentoService.getDocumentsWithProblemsByStudent(mockAlunoSemDocumentosProblematicos.usuario.usuario_id);
    
            expect(result).toEqual(expectedSemPendencias);
        });
    });
})