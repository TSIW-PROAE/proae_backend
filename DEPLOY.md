# Deploy da API no Cloud Run — dois jeitos

| | **Por aqui** | **Por fora** |
|---|--------------|--------------|
| **Onde** | Seu PC (terminal, Cursor, VS Code) com `gcloud` instalado | Console do Google Cloud, Cloud Shell no navegador, ou CI (GitHub etc.) |
| **Quando usar** | Desenvolvimento, teste rápido, “subir agora” sem configurar trigger | Equipe sem `gcloud` local, deploy automático a cada push, ou só navegador |

Infra (Cloud SQL, segredos, IAM, APIs) está em **[README-CLOUD-RUN-CLOUD-SQL.md](./README-CLOUD-RUN-CLOUD-SQL.md)** — faça isso **uma vez** antes de qualquer deploy.

---

## 1. Por aqui (máquina local — mesmo fluxo do Cursor)

**Pré-requisito:** `gcloud` instalado e projeto certo.

```powershell
gcloud auth login
gcloud config set project SEU_PROJECT_ID
```

Na pasta do backend:

```powershell
cd caminho\para\proae_backend
```

**Produção** (`cloudbuild.yaml`):

```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions=SHORT_SHA=local-$(Get-Date -Format 'yyyyMMddHHmmss')
```

**Linux / macOS / Git Bash:**

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```

**Homologação / dev** (`cloudbuild-dev.yaml`):

```powershell
gcloud builds submit --config cloudbuild-dev.yaml --substitutions=SHORT_SHA=local-$(Get-Date -Format 'yyyyMMddHHmmss')
```

O que acontece: o código da pasta atual é enviado ao **Cloud Build**, que faz Docker build → push em `gcr.io/...` → `gcloud run deploy`.

**Depois do deploy:** conferir URL e `/health` — ver README Cloud Run, seção pós-deploy.

**Migrations:** o build **não** roda migrations. Rode `npm run migration:run` contra o Postgres de produção quando o release mudar o schema (proxy Cloud SQL ou job dedicado).

---

## 2. Por fora (sem depender do seu PC)

### 2.1 Google Cloud Shell (navegador)

1. Abra [console.cloud.google.com](https://console.cloud.google.com) → projeto correto.
2. Ícone **>_\** (ativar **Cloud Shell**) no topo.
3. Faça upload do código ou `git clone` do repositório.
4. `cd` até a pasta `proae_backend` e rode o mesmo `gcloud builds submit` da seção 1.

Vantagem: não precisa instalar `gcloud` no Windows; a autenticação já é a da conta Google do navegador.

### 2.2 Cloud Build — executar manualmente pelo Console

1. **Cloud Build** → **Histórico** (ou **Triggers**).
2. Se já existir **trigger** ligado ao repositório: pode rodar **“Run”** no trigger (usa o commit da branch configurada).
3. Sem trigger: **Cloud Build** → **Submit manually** (conforme a UI do GCP): enviar **zip** do código ou apontar para **Cloud Source Repositories** / **GitHub** conectado, e escolher `cloudbuild.yaml`.

> A UI muda de nome entre versões; o fluxo é sempre: subir fonte + escolher `cloudbuild.yaml` + substituições (`SHORT_SHA` obrigatório em submit manual).

### 2.3 Trigger automático (recomendado para equipe)

1. **Cloud Build** → **Triggers** → **Create trigger**.
2. Conectar **GitHub** (ou Cloud Source Repos).
3. Repositório/branch (ex.: `main`), evento **Push**.
4. Configuração: **Cloud Build configuration file** → `proae_backend/cloudbuild.yaml` (ou caminho no repo).
5. Em **Substitution variables**, se o YAML precisar, garanta que `SHORT_SHA` exista — em triggers GitHub o Cloud Build costuma expor `SHORT_SHA` / `COMMIT_SHA` automaticamente (ver documentação atual do GCP para o seu conector).

Assim, **ninguém precisa rodar `gcloud` no PC**: cada push dispara o build.

### 2.4 Só atualizar imagem no Cloud Run (avançado)

Quem já tem imagem em `gcr.io/...` pode ir em **Cloud Run** → serviço → **Edit & deploy new revision** → selecionar nova imagem. Normalmente o fluxo do projeto é **sempre** via `cloudbuild.yaml` para manter envs, secrets e Cloud SQL alinhados.

---

## 3. Checklist rápido (qualquer fluxo)

- [ ] APIs habilitadas (`sqladmin`, `run`, `cloudbuild`, etc.) — ver README Cloud Run.
- [ ] Service account `proae-backend@...` existe e tem IAM (Cloud SQL + Secret Manager + `actAs` para o Cloud Build).
- [ ] Segredos `db-url` e `jwt-secret` no Secret Manager (conforme `cloudbuild.yaml`).
- [ ] (Opcional) Secret `admins-emails` para e-mails de aprovação de admin; depois acrescente `ADMINS_EMAILS=admins-emails:latest` em `--set-secrets` ou defina `ADMINS_EMAILS` no Cloud Run.
- [ ] **Não** definir `PORT` em `--set-env-vars` (o Cloud Run reserva).
- [ ] Migrations aplicadas no banco de produção quando o código exigir colunas novas.

---

## 4. Onde está o que

| Arquivo | Uso |
|---------|-----|
| `cloudbuild.yaml` | Pipeline prod: build Docker + push + deploy `proae-backend` |
| `cloudbuild-dev.yaml` | Pipeline dev: serviço `proae-backend-dev` |
| `Dockerfile` | Imagem da API (`node dist/src/main.js`, porta via `PORT` do Cloud Run) |
| `README-CLOUD-RUN-CLOUD-SQL.md` | Infra GCP, IAM, SQL, troubleshooting |
