# Deploy no Cloud Run + Cloud SQL (PostgreSQL)

Este guia descreve o passo a passo para subir a API no Cloud Run e usar banco PostgreSQL no Cloud SQL.

## 1) Status atual dos YAMLs do projeto

Arquivos encontrados:

- `cloudbuild.yaml` (prod)
- `cloudbuild-dev.yaml` (dev)

O que eles **ja fazem**:

- build da imagem Docker
- push da imagem para `gcr.io/$PROJECT_ID/...`
- deploy no Cloud Run
- vinculacao da instancia Cloud SQL via `--add-cloudsql-instances`
- leitura de segredos via Secret Manager em `--set-secrets`

O que eles **nao fazem** (voce precisa preparar antes):

- criar instancia Cloud SQL
- criar banco e usuario no PostgreSQL
- criar segredos (`DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`)
- conceder IAM necessario para Cloud Build e Service Account do Cloud Run
- executar migrations (atualmente o projeto nao tem pasta de migrations no repositorio)

Conclusao: os YAMLs estao bons para CI/CD do deploy, mas nao sao suficientes sozinhos para provisionar toda a infra.

## 2) Pre-requisitos

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

Comando:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com iam.googleapis.com
```

## 3) Criar Cloud SQL (PostgreSQL)

Exemplo (ajuste nomes/regiao):

```bash
gcloud sql instances create proae-db-prod \
  --database-version=POSTGRES_15 \
  --cpu=1 \
  --memory=3840MB \
  --region=us-central1
```

Criar banco e usuario:

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

Crie (se ainda nao existir):

```bash
gcloud iam service-accounts create proae-backend --display-name="PROAE Backend"
```

Permissoes minimas:

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

Se o segredo ja existir:

```bash
echo -n "novo_valor" | gcloud secrets versions add db-password --data-file=-
```

## 6) Dar permissao para o Cloud Build executar deploy

Conta padrao do Cloud Build:

`PROJECT_NUMBER@cloudbuild.gserviceaccount.com`

Permissoes comuns necessarias:

- `roles/run.admin`
- `roles/iam.serviceAccountUser` (na SA do Cloud Run)
- `roles/artifactregistry.writer` (ou permissao para push em GCR)
- `roles/cloudsql.client` (se necessario no passo de deploy)
- `roles/secretmanager.secretAccessor`

Exemplo:

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"
```

## 7) Deploy com Cloud Build

Prod:

```bash
gcloud builds submit --config cloudbuild.yaml
```

Dev:

```bash
gcloud builds submit --config cloudbuild-dev.yaml
```

## 8) Variaveis e conexao com Cloud SQL

O app ja esta preparado para Cloud SQL quando:

- `USE_CLOUD_SQL=true`
- `INSTANCE_CONNECTION_NAME` definido (formato `PROJECT:REGION:INSTANCE`)
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` definidos

Isso ja esta sendo passado no `cloudbuild.yaml` durante `gcloud run deploy`.

## 9) Pos-deploy (validacao)

- conferir servico:

```bash
gcloud run services describe proae-backend --region us-central1
```

- testar healthcheck/endpoint
- verificar logs:

```bash
gcloud run services logs read proae-backend --region us-central1
```

## 10) Pontos de atencao

- Este repositorio nao possui migrations versionadas no momento (`src/migrations` inexistente).
- Se forem adicionadas migrations depois, execute-as em pipeline separado ou job controlado antes de trocar trafego.
- Script de TypeORM foi atualizado para novo caminho:
  - `src/infrastructure/persistence/typeorm/db.config.ts`

## 11) Checklist rapido

- [ ] APIs do GCP habilitadas
- [ ] Cloud SQL criado (instancia + banco + usuario)
- [ ] Service Account do Cloud Run criada
- [ ] IAM correto para Cloud Run e Cloud Build
- [ ] Segredos criados no Secret Manager
- [ ] `cloudbuild.yaml`/`cloudbuild-dev.yaml` com nomes corretos
- [ ] deploy executado com `gcloud builds submit`
