# 🚀 Guia de Deploy - Google Cloud Platform

Este guia explica como fazer deploy da aplicação no Google Cloud Platform usando Cloud Run e Cloud SQL.

## 📋 Pré-requisitos

1. Conta no Google Cloud Platform
2. `gcloud` CLI instalado e configurado
3. Projeto GCP criado
4. Permissões necessárias no projeto

## 🏗️ Estrutura de Infraestrutura

- **Cloud SQL (PostgreSQL)**: Banco de dados
  - Instância DEV: `proae-db-dev`
  - Instância PROD: `proae-db-prod`
- **Cloud Run**: Container para a API
  - Serviço DEV: `proae-backend-dev`
  - Serviço PROD: `proae-backend-prod`
- **Cloud SQL Connector**: Conexão via socket (sem IP público)

## 🔧 Configuração Inicial

### 1. Criar Instâncias Cloud SQL

#### Instância DEV

```bash
gcloud sql instances create proae-db-dev \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default \
  --no-assign-ip \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04
```

#### Instância PROD

```bash
gcloud sql instances create proae-db-prod \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-2 \
  --region=us-central1 \
  --network=default \
  --no-assign-ip \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --enable-point-in-time-recovery
```

### 2. Criar Bancos de Dados

```bash
# DEV
gcloud sql databases create proae_db_dev --instance=proae-db-dev

# PROD
gcloud sql databases create proae_db_prod --instance=proae-db-prod
```

### 3. Criar Usuários do Banco

```bash
# DEV
gcloud sql users create proae_user_dev \
  --instance=proae-db-dev \
  --password=SUA_SENHA_SEGURA_AQUI

# PROD
gcloud sql users create proae_user_prod \
  --instance=proae-db-prod \
  --password=SUA_SENHA_SEGURA_AQUI
```

### 4. Criar Service Accounts

```bash
# DEV
gcloud iam service-accounts create proae-backend-dev \
  --display-name="PROAE Backend DEV" \
  --description="Service account para Cloud Run DEV"

# PROD
gcloud iam service-accounts create proae-backend-prod \
  --display-name="PROAE Backend PROD" \
  --description="Service account para Cloud Run PROD"
```

### 5. Conceder Permissões

```bash
# Permissão para acessar Cloud SQL
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:proae-backend-dev@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:proae-backend-prod@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### 6. Criar Secrets no Secret Manager

```bash
# DEV
echo -n "proae_user_dev" | gcloud secrets create db-username-dev --data-file=-
echo -n "SUA_SENHA_SEGURA" | gcloud secrets create db-password-dev --data-file=-
echo -n "proae_db_dev" | gcloud secrets create db-name-dev --data-file=-
echo -n "JWT_SECRET_DEV" | gcloud secrets create jwt-secret-dev --data-file=-

# PROD
echo -n "proae_user_prod" | gcloud secrets create db-username --data-file=-
echo -n "SUA_SENHA_SEGURA" | gcloud secrets create db-password --data-file=-
echo -n "proae_db_prod" | gcloud secrets create db-name --data-file=-
echo -n "JWT_SECRET_PROD" | gcloud secrets create jwt-secret --data-file=-
```

### 7. Conceder Acesso aos Secrets

```bash
# DEV
gcloud secrets add-iam-policy-binding db-username-dev \
  --member="serviceAccount:proae-backend-dev@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-password-dev \
  --member="serviceAccount:proae-backend-dev@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-name-dev \
  --member="serviceAccount:proae-backend-dev@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-secret-dev \
  --member="serviceAccount:proae-backend-dev@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# PROD (mesmo processo com os secrets sem sufixo -dev)
```

## 🚀 Deploy

### Deploy Manual

#### DEV

```bash
gcloud builds submit --config=cloudbuild-dev.yaml \
  --substitutions=_REGION=us-central1
```

#### PROD

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1
```

### Deploy via CI/CD (GitHub Actions)

Crie um workflow no GitHub Actions:

```yaml
# .github/workflows/deploy-dev.yml
name: Deploy to DEV

on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      
      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v1'
      
      - name: 'Deploy to Cloud Run'
        run: |
          gcloud builds submit --config=cloudbuild-dev.yaml
```

## 🔍 Verificação

### Verificar Status do Deploy

```bash
# DEV
gcloud run services describe proae-backend-dev --region=us-central1

# PROD
gcloud run services describe proae-backend-prod --region=us-central1
```

### Verificar Logs

```bash
# DEV
gcloud run services logs read proae-backend-dev --region=us-central1

# PROD
gcloud run services logs read proae-backend-prod --region=us-central1
```

### Testar Conexão

```bash
# Obter URL do serviço
gcloud run services describe proae-backend-dev \
  --region=us-central1 \
  --format='value(status.url)'

# Testar endpoint
curl https://SERVICE_URL/api
```

## 🔄 Migrações de Banco de Dados

### Executar Migrações Localmente (via Cloud SQL Proxy)

```bash
# Instalar Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Conectar ao banco DEV
./cloud-sql-proxy PROJECT_ID:us-central1:proae-db-dev

# Em outro terminal, executar migrações
npm run migration:run
```

### Executar Migrações via Cloud Run Job

```bash
# Criar Cloud Run Job para migrações
gcloud run jobs create proae-migration \
  --image=gcr.io/PROJECT_ID/proae-backend:latest \
  --region=us-central1 \
  --add-cloudsql-instances=PROJECT_ID:us-central1:proae-db-prod \
  --set-env-vars="NODE_ENV=production,USE_CLOUD_SQL=true" \
  --set-secrets="DB_USERNAME=db-username:latest,DB_PASSWORD=db-password:latest,DB_NAME=db-name:latest" \
  --command="npm" \
  --args="run,migration:run"

# Executar o job
gcloud run jobs execute proae-migration --region=us-central1
```

## 🔐 Segurança

### Boas Práticas

1. **Sem IP Público**: Banco de dados sem IP público (já configurado)
2. **Secrets Manager**: Credenciais armazenadas no Secret Manager
3. **Service Accounts**: Uso de service accounts com permissões mínimas
4. **VPC**: Considere usar VPC para isolamento adicional
5. **SSL/TLS**: Conexões sempre criptografadas

### Atualizar Secrets

```bash
# Atualizar senha do banco
echo -n "NOVA_SENHA" | gcloud secrets versions add db-password --data-file=-

# Atualizar JWT secret
echo -n "NOVO_JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=-
```

## 📊 Monitoramento

### Cloud Monitoring

- Métricas de CPU, memória, requisições
- Alertas configuráveis
- Dashboards personalizados

### Cloud Logging

- Logs estruturados
- Filtros e buscas
- Exportação para BigQuery

## 🛠️ Troubleshooting

### Problema: Erro de conexão com Cloud SQL

**Solução:**
1. Verificar se o Cloud SQL Connector está configurado
2. Verificar permissões do service account
3. Verificar se o Cloud SQL instance está rodando
4. Verificar connection name

### Problema: Secrets não encontrados

**Solução:**
1. Verificar se os secrets existem no Secret Manager
2. Verificar permissões do service account
3. Verificar nomes dos secrets no cloudbuild.yaml

### Problema: Build falha

**Solução:**
1. Verificar logs do Cloud Build
2. Verificar Dockerfile
3. Verificar dependências no package.json

## 📝 Variáveis de Ambiente

### Variáveis Obrigatórias

- `NODE_ENV`: `production` ou `development`
- `PORT`: Porta do servidor (8080 para Cloud Run)
- `USE_CLOUD_SQL`: `true` para usar Cloud SQL Connector
- `CLOUD_SQL_CONNECTION_NAME`: Nome da conexão do Cloud SQL

### Variáveis de Secrets

- `DB_USERNAME`: Usuário do banco
- `DB_PASSWORD`: Senha do banco
- `DB_NAME`: Nome do banco
- `JWT_SECRET`: Secret para JWT

## 🔗 Links Úteis

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud SQL Connector](https://github.com/GoogleCloudPlatform/cloud-sql-connector-nodejs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)

