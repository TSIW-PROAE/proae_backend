# 🚀 Quick Start - Deploy GCP

## Setup Rápido

### 1. Configurar Variáveis de Ambiente

```bash
export GCP_PROJECT_ID="seu-projeto-id"
export GCP_REGION="us-central1"
```

### 2. Executar Script de Setup

```bash
# Para DEV
./scripts/setup-gcp.sh dev

# Para PROD
./scripts/setup-gcp.sh prod
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Deploy

```bash
# DEV
gcloud builds submit --config=cloudbuild-dev.yaml

# PROD
gcloud builds submit --config=cloudbuild.yaml
```

## 📝 Variáveis Necessárias

### Secrets (Secret Manager)
- `db-username-dev` / `db-username`
- `db-password-dev` / `db-password`
- `db-name-dev` / `db-name`
- `jwt-secret-dev` / `jwt-secret`

### Environment Variables (Cloud Run)
- `NODE_ENV`: `production` ou `development`
- `PORT`: `8080` (padrão Cloud Run)
- `USE_CLOUD_SQL`: `true`
- `CLOUD_SQL_CONNECTION_NAME`: `PROJECT_ID:REGION:INSTANCE_NAME`

## 🔗 Connection Name

Formato: `PROJECT_ID:REGION:INSTANCE_NAME`

Exemplo: `my-project:us-central1:proae-db-prod`

## 📚 Documentação Completa

Veja [DEPLOY.md](./DEPLOY.md) para documentação detalhada.

