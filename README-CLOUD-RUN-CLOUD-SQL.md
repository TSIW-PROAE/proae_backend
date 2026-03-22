# Deploy no Cloud Run + Cloud SQL (PostgreSQL)

Este guia descreve o passo a passo para subir a API no Cloud Run e usar banco PostgreSQL no Cloud SQL.

## 1) Status atual dos YAMLs do projeto

Arquivos encontrados:

- `cloudbuild.yaml` (prod)
- `cloudbuild-dev.yaml` (dev)

O que eles **já fazem**:

- build da imagem Docker
- push da imagem para `gcr.io/$PROJECT_ID/...`
- deploy no Cloud Run
- vinculação da instância Cloud SQL via `--add-cloudsql-instances`
- leitura de segredos via Secret Manager em `--set-secrets`

O que eles **não fazem** (você precisa preparar antes):

- criar instância Cloud SQL
- criar banco e usuário no PostgreSQL
- criar segredos (`DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`)
- conceder IAM necessário para Cloud Build e Service Account do Cloud Run
- **rodar migrations no banco de produção** (o deploy da imagem não executa `migration:run` automaticamente)

Conclusão: os YAMLs estão bons para CI/CD do deploy, mas não são suficientes sozinhos para provisionar toda a infra nem para atualizar o schema do banco.

**Deploy “por aqui” (máquina local) vs “por fora” (Console / Cloud Shell / CI):** veja **[DEPLOY.md](./DEPLOY.md)** — este README foca na infraestrutura GCP; o `DEPLOY.md` descreve os dois fluxos de execução do pipeline.

## 2) Pré-requisitos

- Projeto GCP ativo
- Billing habilitado
- `gcloud` instalado e autenticado
- APIs habilitadas:
  - `run.googleapis.com`
  - `cloudbuild.googleapis.com`
  - `artifactregistry.googleapis.com` (recomendado)
  - `sqladmin.googleapis.com`
  - `secretmanager.googleapis.com`
  - `iam.googleapis.com`

Comando (rode **uma vez** no projeto, com billing ativo):

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com iam.googleapis.com
```

> **Importante (Cloud Build):** o passo `gcloud run deploy` com `--add-cloudsql-instances` exige a API **Cloud SQL Admin** (`sqladmin.googleapis.com`) **já habilitada**. Se não estiver, o `gcloud` tenta habilitar e pergunta `y/N` no terminal — no Cloud Build isso **não é interativo** e o deploy falha com *Aborted by user*.  
> Solução: execute o comando `gcloud services enable ...` acima (ou só `gcloud services enable sqladmin.googleapis.com`) **antes** de rodar o build.

## 3) Criar Cloud SQL (PostgreSQL)

Exemplo (ajuste nomes/região):

```bash
gcloud sql instances create proae-db-prod \
  --database-version=POSTGRES_15 \
  --cpu=1 \
  --memory=3840MB \
  --region=us-central1
```

Criar banco e usuário:

```bash
gcloud sql databases create proae --instance=proae-db-prod

gcloud sql users create proae_user \
  --instance=proae-db-prod \
  --password='SUA_SENHA_FORTE'
```

## 4) Criar Service Account da API (Cloud Run)

Seu `cloudbuild.yaml` usa:

- `proae-backend@PROJECT_ID.iam.gserviceaccount.com` (prod)
- `proae-backend-dev@PROJECT_ID.iam.gserviceaccount.com` (dev)

Crie (se ainda não existir):

```bash
gcloud iam service-accounts create proae-backend --display-name="PROAE Backend"
```

Permissões mínimas:

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:proae-backend@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:proae-backend@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 5) Criar segredos no Secret Manager

Prod (nomes usados no `cloudbuild.yaml`):

- `db-username`
- `db-password`
- `db-name`
- `jwt-secret`

Exemplo:

```bash
echo -n "proae_user" | gcloud secrets create db-username --data-file=-
echo -n "SUA_SENHA_FORTE" | gcloud secrets create db-password --data-file=-
echo -n "proae" | gcloud secrets create db-name --data-file=-
echo -n "UM_JWT_SECRET_BEM_FORTE" | gcloud secrets create jwt-secret --data-file=-
```

Se o segredo já existir:

```bash
echo -n "novo_valor" | gcloud secrets versions add db-password --data-file=-
```

## 6) Dar permissão para o Cloud Build executar deploy

Conta padrão do Cloud Build:

`PROJECT_NUMBER@cloudbuild.gserviceaccount.com`

Permissões comuns necessárias:

- `roles/run.admin`
- `roles/iam.serviceAccountUser` (na SA do Cloud Run)
- `roles/artifactregistry.writer` (ou permissão para push em GCR)
- `roles/cloudsql.client` (se necessário no passo de deploy)
- `roles/secretmanager.secretAccessor`

Exemplo:

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"
```

### 6.1) Erro: `Permission 'iam.serviceaccounts.actAs' denied` no deploy

O `gcloud run deploy` usa `--service-account proae-backend@...` (a SA **da aplicação** no Cloud Run). Quem executa o deploy (conta do **Cloud Build** ou da **Compute default**) precisa da permissão **`roles/iam.serviceAccountUser`** **em cima dessa SA** — não só no projeto.

Descubra o **número do projeto**:

```bash
gcloud projects describe PROJECT_ID --format='value(projectNumber)'
```

Contas que costumam rodar o build:

| Conta | Email típico |
|--------|----------------|
| Cloud Build (padrão) | `PROJECT_NUMBER@cloudbuild.gserviceaccount.com` |
| Compute Engine (padrão) | `PROJECT_NUMBER-compute@developer.gserviceaccount.com` |

Se o log do erro mostrar `...-compute@developer.gserviceaccount.com`, conceda **nessa** membro (e também na do Cloud Build, se usar os dois):

```bash
# Troque PROJECT_ID, PROJECT_NUMBER e o email da SA da API (proae-backend)
gcloud iam service-accounts add-iam-policy-binding \
  proae-backend@PROJECT_ID.iam.gserviceaccount.com \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts add-iam-policy-binding \
  proae-backend@PROJECT_ID.iam.gserviceaccount.com \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

Confirme que a SA **`proae-backend@PROJECT_ID.iam.gserviceaccount.com`** existe (`gcloud iam service-accounts list`). Se não existir, crie na seção 4.

Quem faz o deploy também precisa de **`roles/run.admin`** no projeto (ou permissões equivalentes para `gcloud run deploy`).

### 6.2) Erro `actAs` com e-mail `proae-backend@${PROJECT_ID}.iam...` (literal)

No `cloudbuild.yaml`, **não** use `${PROJECT_ID}` **dentro** de variáveis no bloco `substitutions:` para montar o e-mail da service account — em alguns casos o Cloud Build **não expande** e o `gcloud run deploy` recebe o texto literal `${PROJECT_ID}`. Aí o IAM que você aplicou em `proae-backend@proae-ufba...` **não vale** para essa “conta” inexistente.

O YAML correto usa `$PROJECT_ID` **direto nos `args` do passo** (ex.: `proae-backend@$PROJECT_ID.iam.gserviceaccount.com`), como no repositório atual.

## 7) Deploy com Cloud Build

Na pasta `proae_backend`.

**Prod (Linux/macOS/Git Bash):**

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```

**Prod (PowerShell no Windows)** — o Cloud Build exige `SHORT_SHA` em submit manual:

```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions=SHORT_SHA=local-$(Get-Date -Format 'yyyyMMddHHmmss')
```

**Dev:**

```bash
gcloud builds submit --config cloudbuild-dev.yaml --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```

> Sem `SHORT_SHA`, o build pode falhar porque a imagem usa a tag `gcr.io/$PROJECT_ID/proae-backend:$SHORT_SHA`.

## 8) Variáveis e conexão com Cloud SQL

O app usa Cloud SQL pelo socket Unix quando:

- `USE_CLOUD_SQL=true`
- Nome da instância no formato `PROJECT:REGION:INSTANCE` em **`INSTANCE_CONNECTION_NAME`** ou **`CLOUD_SQL_CONNECTION_NAME`** (o `cloudbuild.yaml` define `CLOUD_SQL_CONNECTION_NAME`; o código aceita os dois)
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` (via segredos no Cloud Run)

Isso já é passado no `cloudbuild.yaml` durante `gcloud run deploy` (`--set-env-vars` + `--set-secrets` + `--add-cloudsql-instances`).

## 9) Migrations (TypeORM)

As migrations ficam em **`src/migrations/`** e são compiladas para **`dist/migrations/`**. O DataSource está em:

- `src/infrastructure/persistence/typeorm/db.config.ts`

**O deploy no Cloud Run não roda migrations.** Após subir uma versão que altere o schema, execute as migrations no **mesmo** Postgres usado em produção (Cloud SQL), antes ou logo após o deploy.

### Rodar migrations localmente apontando para o Cloud SQL

1. Autentique e use o [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy) (ou conexão privada equivalente).
2. Configure `.env` com `DB_HOST`/`DB_PORT` do proxy (ou `DB_URL`), **sem** `USE_CLOUD_SQL=true` no laptop, **ou** use o socket só se estiver no mesmo ambiente que o connector.
3. Na pasta `proae_backend`:

```bash
npm run migration:run
```

### SQL manual (fallback)

Se não puder usar o CLI agora, há script de exemplo em `scripts/add-aluno-cadastro-email-confirmado.sql` (ajuste conforme a migration que precisar).

### Checklist de migrations em produção

- [ ] Backup / janela de manutenção se necessário
- [ ] Conectar ao Postgres de produção (proxy ou job na VPC)
- [ ] `npm run migration:run` com as mesmas credenciais/DB do Cloud Run
- [ ] Validar tabela `migrations` no Postgres (registros aplicados)

## 10) Pós-deploy (validação)

- Conferir serviço:

```bash
gcloud run services describe proae-backend --region us-central1
```

- Testar healthcheck/endpoint
- Verificar logs:

```bash
gcloud run services logs read proae-backend --region us-central1
```

## 11) Pontos de atenção

- **Schema:** novas colunas/tabelas exigem migration aplicada no Cloud SQL; a API pode falhar em runtime se o código esperar colunas que não existem no banco.
- **TypeORM:** `synchronize: false` — alterações de schema só via migrations (ou SQL controlado).
- DataSource / CLI: `src/infrastructure/persistence/typeorm/db.config.ts`

## 12) Checklist rápido

- [ ] APIs do GCP habilitadas
- [ ] Cloud SQL criado (instância + banco + usuário)
- [ ] Service Account do Cloud Run criada
- [ ] IAM correto para Cloud Run e Cloud Build
- [ ] Segredos criados no Secret Manager
- [ ] `cloudbuild.yaml` / `cloudbuild-dev.yaml` com nomes corretos (`_CLOUD_SQL_CONNECTION_NAME`, região, CORS)
- [ ] Deploy executado com `gcloud builds submit` (com `SHORT_SHA`)
- [ ] **Migrations aplicadas no Postgres de produção** quando o release alterar o schema

## 13) “O Cloud Run não reflete as mudanças do backend”

Confira nesta ordem:

### A) O front está apontando para a URL certa?

O frontend usa `VITE_API_URL_SERVICES` (veja `proae_frontend/src/config/api.ts`). Na **Vercel** (ou outro host), essa variável precisa ser a URL **do Cloud Run** da API (ex.: `https://proae-backend-xxxxx-uc.a.run.app`), **sem** barra no final.

- Depois de alterar env na Vercel, é preciso **novo deploy do front** para o bundle enxergar a URL.

### B) O build e o deploy terminaram com sucesso?

```bash
gcloud builds list --limit=5
```

Abra o último build no console e confira se os passos **build**, **push** e **deploy** estão verdes. Se o build falhar, o serviço continua na revisão antiga.

### C) Qual revisão e imagem estão no ar?

```bash
gcloud run services describe proae-backend --region us-central1 \
  --format="table(status.url,status.latestReadyRevisionName,spec.template.spec.containers[0].image)"
```

Compare a **tag da imagem** (`:local-...` ou `:abc1234`) com o build que você acabou de rodar.

### D) Confirme a versão via `/health` (após próximo deploy)

Após subir o backend com o `cloudbuild.yaml` atual, o deploy define `BUILD_SHA` no ambiente. A API responde:

`GET https://SUA_URL_DO_CLOUD_RUN/health`

```json
{ "status": "ok", "build": "local-20260322153000" }
```

O campo `build` deve bater com o `SHORT_SHA` que você passou no `gcloud builds submit`. Se não existir `build`, pode ser revisão antiga ou deploy feito sem essa variável.

### E) Forçar um deploy novo

Na pasta `proae_backend`, com código salvo e projeto GCP certo:

```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions=SHORT_SHA=local-$(Get-Date -Format 'yyyyMMddHHmmss')
```

Sempre use um `SHORT_SHA` **novo** para garantir imagem e revisão novas.

### F) Cache do Docker no Cloud Build

O `cloudbuild.yaml` usa `docker build --pull` para atualizar a imagem base. O código da aplicação entra no passo `COPY . .` no `Dockerfile`; qualquer alteração em arquivos versionados invalida o cache a partir daí. Se suspeitar de cache estranho, rode um build local com `docker build --no-cache` para testar (o fluxo na nuvem em geral não precisa de `--no-cache` no dia a dia).
