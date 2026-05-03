# Arquitetura DDD (Domain-Driven Design) – ProAE Backend

Este documento descreve a arquitetura em camadas inspirada em DDD adotada no projeto, com o **core** (domínio + aplicação) isolado e a infraestrutura e a apresentação como dependentes.

## Princípio central

- **Core (Domain + Application)** não depende de NestJS, TypeORM, Redis, MinIO, HTTP ou qualquer framework.
- **Infrastructure** implementa as portas (interfaces) definidas no domínio (repositórios, serviços externos).
- **Presentation** (módulos Nest, controllers) orquestra use cases e mapeia erros de domínio para HTTP.

## Estrutura de pastas

```
src/
├── core/                        # Núcleo da aplicação (sem deps externas)
│   ├── domain/                  # Camada de domínio
│   │   ├── aluno/
│   │   ├── edital/
│   │   └── inscricao/
│   │   │   ├── *.types.ts               # Tipos e contratos do agregado
│   │   │   ├── ports/*.repository.port.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── application/             # Casos de uso (application layer)
│       ├── aluno/
│       ├── edital/                      # CreateEdital, ListEditais, FindById, Update, Remove, ListAbertos, UpdateStatus, GetAlunosInscritos
│       ├── inscricao/                   # GetInscricoesComPendencias, CreateInscricao, UpdateInscricao
│       │   ├── ports/
│       │   ├── use-cases/
│       │   ├── *.tokens.ts
│       │   └── index.ts
│       └── index.ts
├── infrastructure/              # Adapters – dependem do core
│   └── persistence/
│       └── typeorm/
│           └── repositories/   # AlunoTypeOrmRepository, EditalTypeOrmRepository, InscricaoTypeOrmRepository
├── entities/                    # Entidades TypeORM (persistência) – podem migrar para infrastructure
├── aluno/                       # Módulo Nest (apresentação + wiring)
│   ├── aluno.module.ts          # Registra ALUNO_REPOSITORY → AlunoTypeOrmRepository, use cases, AlunoService
│   ├── aluno.controller.ts      # Chama use cases e mapeia exceções para HTTP
│   ├── aluno.service.ts         # Legado: métodos ainda não migrados para use cases
│   └── dto/
├── auth/, edital/, inscricao/, ...
└── main.ts, app.module.ts
```

## Padrões utilizados

### 1. Ports and Adapters (Hexagonal)

- **Porta**: interface no domínio (ex.: `IAlunoRepository`).
- **Adapter**: implementação na infraestrutura (ex.: `AlunoTypeOrmRepository` que usa TypeORM).
- O domínio e a aplicação só conhecem a porta; o container Nest injeta o adapter via token (`ALUNO_REPOSITORY`).

### 2. Use cases (Application layer)

- Cada ação de usuário vira um caso de uso: `FindAlunoByUserIdUseCase`, `ListAlunosUseCase`, `UpdateAlunoDataUseCase`.
- Use cases recebem apenas portas (repositórios) no construtor; não conhecem TypeORM nem HTTP.
- Erros de domínio são classes (`AlunoNaoEncontradoError`); o controller converte em `NotFoundException`, `BadRequestException`, etc.

### 3. Inversão de dependência

- `AlunoController` depende de `FindAlunoByUserIdUseCase`, não de `AlunoTypeOrmRepository`.
- `FindAlunoByUserIdUseCase` depende de `IAlunoRepository`, não de `AlunoTypeOrmRepository`.
- O módulo Nest faz o bind: `{ provide: ALUNO_REPOSITORY, useClass: AlunoTypeOrmRepository }`.

### 4. Domain types vs persistence

- O domínio define tipos como `AlunoData`, `AtualizaAlunoData` (sem decorators TypeORM).
- O repositório TypeORM mapeia entidades (Usuario, Aluno) para `AlunoData` ao sair do banco e de `AtualizaAlunoData` para entidades ao salvar.

## Como estender para outros módulos

Para refatorar outro módulo (ex.: Edital, Inscricao) no mesmo estilo:

1. **Domain**
   - Criar `src/core/domain/<contexto>/` com tipos e `ports/<contexto>.repository.port.ts` (interface do repositório).

2. **Application**
   - Criar `src/core/application/<contexto>/use-cases/` com um use case por ação.
   - Criar `aluno.tokens.ts` (ou `<contexto>.tokens.ts`) com `Symbol` para a porta.
   - Use cases com `@Injectable()` e `@Inject(TOKEN)` no construtor.

3. **Infrastructure**
   - Criar `src/infrastructure/persistence/typeorm/repositories/<contexto>.typeorm.repository.ts` implementando a porta.
   - Usar as entidades existentes em `src/entities/` e mapear para os tipos de domínio.

4. **Presentation**
   - No módulo Nest: `providers: [ { provide: TOKEN, useClass: RepoTypeOrm }, ...UseCases ]`.
   - No controller: injetar os use cases e chamar `useCase.execute(...)`; capturar erros de domínio e lançar exceções HTTP.

5. **Legado**
   - Manter o service antigo enquanto existirem métodos ainda não migrados; o controller pode usar use cases para uns endpoints e o service para outros (como em Aluno).

## Regras de dependência

- `core/domain`: nenhuma importação de `@nestjs/*`, `typeorm`, `express`, redis, minio, etc.
- `core/application`: pode usar `@nestjs/common` apenas para `@Injectable()` e `@Inject()` (DI); depende do domain.
- `infrastructure`: pode usar TypeORM, Redis, MinIO, etc.; implementa portas do domain.
- `presentation` (módulos em `src/<feature>/`): pode usar Nest, Swagger, guards; depende da application (use cases) e, se necessário, de services legados.

## Referências

- Domain-Driven Design (Eric Evans)
- Clean Architecture / Hexagonal Architecture (Ports and Adapters)
- NestJS custom providers e dependency injection
