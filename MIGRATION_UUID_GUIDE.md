# Guia de Migração: IDs Integer → UUID

## Visão Geral

Todos os IDs do backend foram migrados de `integer` (auto-increment) para `UUID` (v4). Isso afeta **todas as tabelas** exceto `usuario` (que já usava UUID).

---

## 1. Instruções para o Frontend

### 1.1 Mudança de Tipos

Todos os campos de ID que antes eram `number` agora são `string` (UUID).

**Antes:**
```typescript
interface Edital {
  id: number;
  titulo_edital: string;
  // ...
}
```

**Depois:**
```typescript
interface Edital {
  id: string; // UUID ex: "550e8400-e29b-41d4-a716-446655440000"
  titulo_edital: string;
  // ...
}
```

### 1.2 Tabela Completa de Campos Alterados

| Entidade | Campo | Antes | Depois |
|----------|-------|-------|--------|
| Aluno | `aluno_id` | `number` | `string` |
| Admin | `id_admin` | `number` | `string` |
| Edital | `id` | `number` | `string` |
| Vagas | `id` | `number` | `string` |
| Step | `id` | `number` | `string` |
| Pergunta | `id` | `number` | `string` |
| Resposta | `id` | `number` | `string` |
| Inscricao | `id` | `number` | `string` |
| Documento | `documento_id` | `number` | `string` |
| Validacao | `id` | `number` | `string` |
| Dado | `id` | `number` | `string` |
| ValorDado | `id` | `number` | `string` |

### 1.3 Alterações nos DTOs de Requisição

| Endpoint | Campo no Body | Antes | Depois |
|----------|--------------|-------|--------|
| `POST /documentos` | `inscricao` | `number` | `string` |
| `POST /inscricao` | `vaga_id` | `number` | `string` |
| `POST /step` | `edital_id` | `number` | `string` |
| `POST /vagas` | `edital_id` | `number` | `string` |
| `POST /perguntas` | `step_id` | `number` | `string` |
| `POST /perguntas` | `dadoId` | `number \| undefined` | `string \| undefined` |
| `PATCH /perguntas/:id` | `dadoId` | `number \| null` | `string \| null` |
| `POST /respostas` | `perguntaId` | `number` | `string` |
| `POST /respostas` | `inscricaoId` | `number` | `string` |
| `POST /validacao` | `responsavel_id` | `number` | `string` |
| `POST /validacao` | `questionario_id` | `number \| undefined` | `string \| undefined` |
| `POST /validacao` | `documento_id` | `number \| undefined` | `string \| undefined` |
| `POST /valor-dado` | `alunoId` | `number` | `string` |
| `POST /valor-dado` | `dadoId` | `number` | `string` |
| `PATCH /inscricao/indeferir` | `formulario` | `number` | `string` |
| `PATCH /inscricao/indeferir` | `documentos` | `number[]` | `string[]` |

### 1.4 Alterações nos Parâmetros de URL

Todos os parâmetros de rota que eram inteiros agora esperam UUID. A API retornará **400 Bad Request** se o parâmetro não for um UUID válido.

**Antes:**
```
GET /edital/1
GET /step/edital/3
GET /perguntas/step/5
GET /respostas/inscricao/2/step/3
DELETE /vagas/10
```

**Depois:**
```
GET /edital/550e8400-e29b-41d4-a716-446655440000
GET /step/edital/a1b2c3d4-e5f6-7890-abcd-ef1234567890
GET /perguntas/step/b2c3d4e5-f6a7-8901-bcde-f12345678901
GET /respostas/inscricao/c3d4e5f6-a7b8-9012-cdef-123456789012/step/d4e5f6a7-b8c9-0123-defa-234567890123
DELETE /vagas/e5f6a7b8-c9d0-1234-efab-345678901234
```

### 1.5 Rotas Afetadas (lista completa)

| Método | Rota | Parâmetros UUID |
|--------|------|-----------------|
| `GET` | `/edital/:id` | `id` |
| `PATCH` | `/edital/:id` | `id` |
| `DELETE` | `/edital/:id` | `id` |
| `GET` | `/edital/:id/alunos` | `id` |
| `PATCH` | `/edital/:id/status` | `id` |
| `GET` | `/step/edital/:editalId` | `editalId` |
| `GET` | `/step/edital/:editalId/perguntas` | `editalId` |
| `PATCH` | `/step/:id` | `id` |
| `DELETE` | `/step/:id` | `id` |
| `GET` | `/perguntas/step/:stepId` | `stepId` |
| `PATCH` | `/perguntas/:id` | `id` |
| `DELETE` | `/perguntas/:id` | `id` |
| `GET` | `/respostas/inscricao/:inscricaoId` | `inscricaoId` |
| `GET` | `/respostas/inscricao/:inscricaoId/step/:stepId` | `inscricaoId`, `stepId` |
| `GET` | `/respostas/inscricao/:inscricaoId/all-steps` | `inscricaoId` |
| `GET` | `/respostas/inscricao/:inscricaoId/step/:stepId/perguntas` | `inscricaoId`, `stepId` |
| `PATCH` | `/respostas/:id` | `id` |
| `DELETE` | `/respostas/:id` | `id` |
| `GET` | `/documentos/inscricao/:inscricaoId` | `inscricaoId` |
| `GET` | `/documentos/:id` | `id` |
| `PATCH` | `/documentos/:id` | `id` |
| `DELETE` | `/documentos/:id` | `id` |
| `PATCH` | `/documentos/:id/resubmit` | `id` |
| `GET` | `/vagas/edital/:editalId` | `editalId` |
| `PATCH` | `/vagas/:id` | `id` |
| `DELETE` | `/vagas/:id` | `id` |
| `GET` | `/validacao/:id` | `id` |
| `PATCH` | `/validacao/:id` | `id` |
| `DELETE` | `/validacao/:id` | `id` |
| `GET` | `/tipo-dado/:id` | `id` |
| `PATCH` | `/tipo-dado/:id` | `id` |
| `DELETE` | `/tipo-dado/:id` | `id` |
| `GET` | `/valor-dado/aluno/:alunoId` | `alunoId` |
| `PATCH` | `/valor-dado/:id` | `id` |
| `DELETE` | `/valor-dado/:id` | `id` |
| `PATCH` | `/inscricao/:inscricaoId` | `inscricaoId` |
| `GET` | `/aluno/edital/:editalId/step/:stepId/alunos` | `editalId`, `stepId` |

### 1.6 Checklist de Alterações no Frontend

- [ ] **Interfaces/Types**: Trocar todos os campos de ID de `number` para `string`
- [ ] **Comparações**: Trocar `===` com números para comparação com strings
  ```typescript
  // Antes
  if (edital.id === 1) { ... }
  // Depois
  if (edital.id === 'uuid-aqui') { ... }
  ```
- [ ] **parseInt/Number()**: Remover conversões de ID para número
  ```typescript
  // Antes
  const id = parseInt(params.id, 10);
  // Depois
  const id = params.id; // já é string UUID
  ```
- [ ] **URL Params**: Não precisa mudar a construção de URLs (já são interpoladas como string), mas garantir que os IDs vêm da API como string
- [ ] **localStorage/sessionStorage**: Se IDs estão armazenados, garantir que o formato UUID é tratado
- [ ] **Formulários**: Remover `type="number"` de campos hidden que armazenam IDs
- [ ] **Navegação/Router**: Se IDs estão em URLs, verificar que rotas aceitam strings mais longas
- [ ] **Validação de formulários**: Remover validações numéricas (`min: 1`, etc.) de campos de ID
- [ ] **Cache do frontend**: Limpar qualquer cache que armazene IDs numéricos antigos

### 1.7 Formato do UUID

Os UUIDs seguem o formato padrão v4:
```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```
Exemplo: `550e8400-e29b-41d4-a716-446655440000`

- Comprimento: 36 caracteres (com hífens)
- Regex para validação: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

---

## 2. Guia para Rodar as Migrações (Dados Persistidos)

### 2.1 Pré-requisitos

- PostgreSQL rodando
- Banco de dados existente com as migrações anteriores aplicadas
- Node.js e npm instalados

### 2.2 ⚠️ BACKUP OBRIGATÓRIO

**ANTES de executar a migração, faça backup do banco:**

```bash
# Backup completo do banco
pg_dump -h localhost -U seu_usuario -d nome_do_banco -F c -f backup_pre_uuid.dump

# OU, se estiver usando Docker:
docker exec -t nome_container pg_dump -U seu_usuario -d nome_do_banco -F c > backup_pre_uuid.dump
```

### 2.3 Como a Migração Funciona

A migração `1771200000000-migrate-to-uuid.ts` executa estas fases:

1. **Habilita `uuid-ossp`** — extensão do PostgreSQL para gerar UUIDs
2. **Cria colunas UUID temporárias** — em todas as tabelas (PKs e FKs)
3. **Gera UUIDs para cada linha existente** — automaticamente via `DEFAULT uuid_generate_v4()`
4. **Mapeia FKs** — preenche as colunas UUID de FK com base nos relacionamentos existentes (JOIN nas tabelas referenciadas)
5. **Remove FK constraints antigas** — de todas as tabelas
6. **Substitui colunas** — dropa coluna int, renomeia coluna UUID para o nome original
7. **Recria FK constraints** — com os novos tipos UUID
8. **Remove sequences** — as sequences SERIAL não são mais necessárias

**Resultado:** Todos os dados são preservados. Cada registro recebe um novo UUID, e as relações entre tabelas são mantidas.

### 2.4 Executando a Migração

```bash
# 1. Instalar dependências (se necessário)
npm install

# 2. Compilar o projeto (migrações são lidas de dist/)
npm run build

# 3. Executar a migração
npx typeorm migration:run -d dist/db/db.config.js
```

### 2.5 Verificação Pós-Migração

Após executar, verifique se tudo está correto:

```sql
-- Verificar se PKs são UUID
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'edital' AND column_name = 'id';
-- Deve retornar: data_type = 'uuid'

-- Verificar se FKs estão funcionando
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Verificar contagem de registros (deve ser igual ao antes)
SELECT 'edital' as tabela, COUNT(*) FROM edital
UNION ALL SELECT 'vagas', COUNT(*) FROM vagas
UNION ALL SELECT 'step', COUNT(*) FROM step
UNION ALL SELECT 'pergunta', COUNT(*) FROM pergunta
UNION ALL SELECT 'resposta', COUNT(*) FROM resposta
UNION ALL SELECT 'inscricao', COUNT(*) FROM inscricao
UNION ALL SELECT 'documento', COUNT(*) FROM documento
UNION ALL SELECT 'validacao', COUNT(*) FROM validacao
UNION ALL SELECT 'aluno', COUNT(*) FROM aluno
UNION ALL SELECT 'admin', COUNT(*) FROM admin
UNION ALL SELECT 'dado', COUNT(*) FROM dado
UNION ALL SELECT 'valor_dado', COUNT(*) FROM valor_dado;
```

### 2.6 Rollback (Se Necessário)

Esta migração **NÃO possui rollback automático** porque os IDs inteiros originais são perdidos. Se algo der errado:

```bash
# Restaurar do backup
pg_restore -h localhost -U seu_usuario -d nome_do_banco -c backup_pre_uuid.dump

# OU, se estiver usando Docker:
docker exec -i nome_container pg_restore -U seu_usuario -d nome_do_banco -c < backup_pre_uuid.dump
```

### 2.7 Ordem de Deploy

1. **Fazer backup do banco** (obrigatório)
2. **Deploy do backend** com as novas entities/services/controllers
3. **Rodar a migração** (`npx typeorm migration:run`)
4. **Verificar a migração** (queries SQL acima)
5. **Deploy do frontend** com as alterações de tipo
6. **Testar end-to-end** todas as funcionalidades

> **IMPORTANTE:** O backend e frontend devem ser atualizados juntos. Após a migração do banco, o frontend antigo (com IDs numéricos) não funcionará mais.

---

## 3. Resumo das Alterações no Backend

### Arquivos Modificados

| Camada | Alteração |
|--------|-----------|
| **Entities** | `@PrimaryGeneratedColumn('uuid')` + tipo `string` |
| **DTOs** | `@IsNumber()` → `@IsString()`, tipo `number` → `string` |
| **Services** | Parâmetros `number` → `string`, `Map<number>` → `Map<string>` |
| **Controllers** | `ParseIntPipe` → `ParseUUIDPipe`, tipo `number` → `string` |
| **Migration** | Nova migration para converter PKs e FKs de int → uuid |

### Tabela `usuario`
Já usava UUID (`@PrimaryGeneratedColumn('uuid')`) — **sem alteração**.
