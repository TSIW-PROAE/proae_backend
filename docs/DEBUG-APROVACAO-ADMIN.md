# Debug: Aprovação de Admin e Redirecionamento

## Fluxo

1. **Novo admin se cadastra** → `POST /auth/signup-admin`
2. **Backend** cria o admin com `aprovado: false`, gera token, **envia email** para os endereços em `ADMINS_EMAILS` com links:
   - Aprovar: `{BACKEND_URL}/auth/approve-admin/{token}`
   - Rejeitar: `{BACKEND_URL}/auth/reject-admin/{token}`
3. **Admin existente** clica no link no email → request vai para o **backend**
4. **Backend** valida token, marca admin como aprovado, **envia email para o novo admin** (link para `{FRONTEND_URL}/login`) e **redireciona** o navegador do aprovador para:
   - Aprovação: `{FRONTEND_URL}/admin/aprovado?sucesso=true`
   - Rejeição: `{FRONTEND_URL}/admin/rejeitado?sucesso=true`
5. **Novo admin** recebe o email "Cadastro aprovado" e clica em "Acessar o sistema" → vai para a página de login. Ao fazer login, o backend retorna `adminAprovado: true`; o **frontend** deve redirecionar para a tela principal (dashboard) e não exibir mais "Aguardando Aprovação".
6. **Frontend** deve ter rotas `/admin/aprovado` e `/admin/rejeitado` para quem clicou no link (opcional) e, após **login** ou **validate-token**, se `adminAprovado === true`, redirecionar o admin para a página principal da conta.

## Onde pode estar o problema

### 1. Redirecionamento não acontece (usuário fica no backend ou vê 404)

- **Backend:** `FRONTEND_URL` não configurado ou com valor errado.
  - **Log:** Em produção, se não houver redirect, o backend loga:  
    `[approve-admin] FRONTEND_URL não configurado...`
  - **Solução:** Definir `FRONTEND_URL` no `.env` e no Cloud Run (ex.: `https://proae-frontend.vercel.app`) **sem barra no final**.

### 2. Link do email leva a lugar errado ou quebra

- **Backend:** `BACKEND_URL` errado no momento do envio do email.
  - **Log (só em dev):** `[sendAdminApprovalRequest] Link de aprovação (BACKEND_URL): ...`
  - **Solução:** Definir `BACKEND_URL` no `.env` e no Cloud Run com a URL pública do backend (ex.: `https://proae-backend-xxx.run.app`), sem barra no final.

### 3. Email de aprovação não chega

- **Backend:** `ADMINS_EMAILS` vazio ou não configurado.
  - **Log:** `[sendAdminApprovalRequest] ADMINS_EMAILS não configurado. Email de aprovação NÃO foi enviado.`
  - **Solução:** Definir `ADMINS_EMAILS` no `.env` com os emails separados por vírgula (ex.: `admin1@ufba.br,admin2@ufba.br`).

### 4. Frontend: usuário cai em 404 ou não vai para a tela principal

- O backend **só** redireciona para `{FRONTEND_URL}/admin/aprovado?sucesso=true` (ou `.../admin/rejeitado?sucesso=true`).
- O **frontend** precisa:
  - Ter rota para `/admin/aprovado` (e opcionalmente `/admin/rejeitado`).
  - Nessa rota: mostrar mensagem de sucesso e **redirecionar** para a tela principal da conta (ex.: dashboard ou `/admin`) ou exibir link para isso.

## Variáveis de ambiente (resumo)

| Variável       | Uso |
|----------------|-----|
| `FRONTEND_URL` | URL do frontend (sem `/` no final). Usada no redirect após aprovar/rejeitar. |
| `BACKEND_URL`  | URL pública do backend (sem `/` no final). Usada nos links do email. |
| `ADMINS_EMAILS`| Emails que recebem o pedido de aprovação (separados por vírgula). |

## Como debugar

1. **Dev:** Rodar o backend e simular aprovação; no console devem aparecer logs `[approve-admin] redirectTo=...` e `[sendAdminApprovalRequest] Link de aprovação...`.
2. **Produção:** Ver logs do Cloud Run ao clicar em “Aprovar” no email. Se aparecer `FRONTEND_URL não configurado`, configurar `FRONTEND_URL` no serviço.
3. **Frontend:** Garantir que `/admin/aprovado` e `/admin/rejeitado` existem e redirecionam (ou linkam) para a tela principal.
