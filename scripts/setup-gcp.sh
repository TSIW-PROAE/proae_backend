#!/bin/bash

# Script de setup inicial para GCP
# Uso: ./scripts/setup-gcp.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"us-central1"}

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
  echo "Erro: Ambiente deve ser 'dev' ou 'prod'"
  exit 1
fi

echo "🚀 Configurando ambiente $ENVIRONMENT no projeto $PROJECT_ID"

# Definir projeto
gcloud config set project $PROJECT_ID

# Habilitar APIs necessárias
echo "📦 Habilitando APIs necessárias..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com

# Criar instância Cloud SQL
INSTANCE_NAME="proae-db-$ENVIRONMENT"
DB_NAME="proae_db_$ENVIRONMENT"
DB_USER="proae_user_$ENVIRONMENT"

if [ "$ENVIRONMENT" == "prod" ]; then
  TIER="db-n1-standard-2"
else
  TIER="db-f1-micro"
fi

echo "🗄️  Criando instância Cloud SQL: $INSTANCE_NAME"
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=$TIER \
  --region=$REGION \
  --network=default \
  --no-assign-ip \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --quiet || echo "Instância já existe"

# Criar banco de dados
echo "📊 Criando banco de dados: $DB_NAME"
gcloud sql databases create $DB_NAME \
  --instance=$INSTANCE_NAME \
  --quiet || echo "Banco já existe"

# Gerar senha aleatória
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Criar usuário
echo "👤 Criando usuário do banco: $DB_USER"
gcloud sql users create $DB_USER \
  --instance=$INSTANCE_NAME \
  --password=$DB_PASSWORD \
  --quiet || echo "Usuário já existe, atualizando senha..."
  
gcloud sql users set-password $DB_USER \
  --instance=$INSTANCE_NAME \
  --password=$DB_PASSWORD \
  --quiet

# Criar Service Account
SA_NAME="proae-backend-$ENVIRONMENT"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "🔐 Criando Service Account: $SA_NAME"
gcloud iam service-accounts create $SA_NAME \
  --display-name="PROAE Backend $ENVIRONMENT" \
  --description="Service account para Cloud Run $ENVIRONMENT" \
  --quiet || echo "Service Account já existe"

# Conceder permissões
echo "🔑 Concedendo permissões..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudsql.client" \
  --quiet

# Criar secrets
echo "🔒 Criando secrets..."
echo -n "$DB_USER" | gcloud secrets create db-username-$ENVIRONMENT --data-file=- --quiet || \
  echo -n "$DB_USER" | gcloud secrets versions add db-username-$ENVIRONMENT --data-file=-

echo -n "$DB_PASSWORD" | gcloud secrets create db-password-$ENVIRONMENT --data-file=- --quiet || \
  echo -n "$DB_PASSWORD" | gcloud secrets versions add db-password-$ENVIRONMENT --data-file=-

echo -n "$DB_NAME" | gcloud secrets create db-name-$ENVIRONMENT --data-file=- --quiet || \
  echo -n "$DB_NAME" | gcloud secrets versions add db-name-$ENVIRONMENT --data-file=-

# Conceder acesso aos secrets
echo "🔐 Concedendo acesso aos secrets..."
for secret in db-username db-password db-name jwt-secret; do
  gcloud secrets add-iam-policy-binding $secret-$ENVIRONMENT \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet || echo "Secret $secret-$ENVIRONMENT não existe ainda"
done

# Obter connection name
CONNECTION_NAME="$PROJECT_ID:$REGION:$INSTANCE_NAME"

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📋 Informações:"
echo "   Connection Name: $CONNECTION_NAME"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD (salva no Secret Manager)"
echo "   Service Account: $SA_EMAIL"
echo ""
echo "⚠️  IMPORTANTE: Guarde a senha do banco em local seguro!"
echo "   Senha: $DB_PASSWORD"
echo ""

