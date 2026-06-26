# <div align="center">PROAE Backend</div>

<div align="center">
  <img src="https://github.com/TSIW-PROAE/.github/raw/main/img/logo_pgcomp.png" width="200px" alt="Logo pgcomp">
  <p><i>Sistema de gestão para a Pró-Reitoria de Ações Afirmativas e Assistência Estudantil da UFBA</i></p>
</div>

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

</div>

## 🚀 Ambiente Online

O sistema está disponível em:

```
http://b8ckk40k0ook00gckgk44s84.201.54.12.165.sslip.io/
```

## 🔧 Instalação Rápida

```bash
# Clonar repositório
git clone https://github.com/TSIW-PROAE/proae_backend

# Instalar dependências
npm install

# Rodar com Docker
docker-compose up -d
```

> **Nota:** Configure o arquivo `.env` baseado no `.env.example` antes de rodar.

### Rodar local (sem Docker)

O Nest compila para `dist/src/main.js`. Após `npm run build`, um **`dist/main.js`** é gerado automaticamente (redireciona para `src/main.js`), então **`node dist/main`** e **`node dist/src/main.js`** funcionam. **`npm run start:prod`** compila e sobe com `node dist/main.js`. Se aparecer `Cannot find module '.../dist/main'`, rode `npm run build` em `proae_backend` (a pasta `dist` precisa existir).

## ☁️ Deploy GCP

| Documento | Conteúdo |
|-----------|----------|
| **[DEPLOY.md](./DEPLOY.md)** | **Dois fluxos:** deploy **por aqui** (PC / Cursor, `gcloud builds submit`) e **por fora** (Console, Cloud Shell, trigger Git) |
| [README-CLOUD-RUN-CLOUD-SQL.md](./README-CLOUD-RUN-CLOUD-SQL.md) | Infra: Cloud SQL, IAM, segredos, troubleshooting |

## 📊 Estrutura Principal

```
src/
├── aluno      # Gestão de alunos
├── auth       # Autenticação
├── edital     # Gestão de editais
└── ...
```

## 📚 API (Atualizada em 26/06/2026)

> A API não usa prefixo global (as rotas começam em `/`).
> Documentação interativa (Swagger): `GET /api`
> Health check: `GET /health`

### 🔐 Autenticação (`/auth`)

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `PATCH /auth/update-password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/validate-token`
- `POST /auth/signup-admin`
- `GET /auth/approve-admin/:token`
- `GET /auth/reject-admin/:token`
- `GET /auth/confirm-cadastro-aluno`

### 👤 Aluno (`/aluno`) e benefícios (`/beneficios`)

- `POST /aluno/complete-cadastro`
- `GET /aluno/me`
- `GET /aluno/all`
- `PATCH /aluno/update`
- `GET /aluno/inscricoes`
- `POST /aluno/inscricoes/:inscricaoId/recurso`
- `GET /aluno/admin/por-edital/:editalId/alunos`
- `GET /aluno/admin/:alunoId/resumo`
- `GET /aluno/edital/:editalId/step/:stepId/alunos`
- `DELETE /aluno/admin/:alunoId/perfil`
- `GET /beneficios/aluno`

### 👥 Admin (`/admin`)

- `GET /admin`
- `PATCH /admin/update`
- `GET /admin/listar`
- `GET /admin/notificacoes-aprovacao`
- `POST /admin/notificacoes-aprovacao`
- `DELETE /admin/notificacoes-aprovacao/:emailId`
- `PATCH /admin/:adminId/perfil`
- `PATCH /admin/:adminId/aprovar`
- `DELETE /admin/:adminId/rejeitar`
- `DELETE /admin/:adminId/perfil`

### 📋 Editais (`/editais`) e vagas (`/vagas`)

- `POST /editais`
- `GET /editais`
- `GET /editais/abertos`
- `GET /editais/visiveis-aluno`
- `GET /editais/:id`
- `PATCH /editais/:id`
- `GET /editais/:id/inscritos`
- `PATCH /editais/:id/status/:status`
- `DELETE /editais/:id`
- `POST /vagas`
- `GET /vagas/edital/:editalId`
- `PATCH /vagas/:id`
- `DELETE /vagas/:id`

### 🧩 Formulários: steps, perguntas, respostas

**Steps (`/steps`)**

- `POST /steps`
- `POST /steps/edital/:id/clonar-formulario`
- `PATCH /steps/edital/:id/reordenar`
- `GET /steps/edital/:id/with-perguntas`
- `GET /steps/edital/:id`
- `PATCH /steps/:id`
- `DELETE /steps/:id`

**Perguntas (`/perguntas`)**

- `POST /perguntas`
- `GET /perguntas/step/:stepId`
- `PATCH /perguntas/step/:stepId/reordenar`
- `PATCH /perguntas/:id`
- `DELETE /perguntas/:id`

**Respostas (`/respostas`)**

- `POST /respostas`
- `GET /respostas`
- `GET /respostas/aluno/:alunoId/edital/:editalId/steps-completos`
- `GET /respostas/aluno/:alunoId/edital/:editalId`
- `GET /respostas/aluno/:alunoId/edital/:editalId/step/:stepId`
- `GET /respostas/aluno/:alunoId/edital/:editalId/step/:stepId/perguntas-com-respostas`
- `GET /respostas/pergunta/:perguntaId/edital/:editalId`
- `PATCH /respostas/:id/reabrir-complemento`
- `PATCH /respostas/:id/validate`
- `GET /respostas/:id`
- `PATCH /respostas/:id`
- `DELETE /respostas/:id`

### 📝 Inscrições (`/inscricoes`)

- `POST /inscricoes`
- `PATCH /inscricoes/:id/correcao-respostas`
- `PATCH /inscricoes/:id`
- `GET /inscricoes`
- `POST /inscricoes/cache/save/respostas`
- `GET /inscricoes/cache/respostas/vaga/:vagaId`
- `GET /inscricoes/admin/:id/status-audit`
- `PATCH /inscricoes/admin/:id/status`
- `PATCH /inscricoes/admin/:id/beneficio-edital`
- `PATCH /inscricoes/admin/:id/resultado-recurso`
- `GET /inscricoes/aprovados/pdf`
- `GET /inscricoes/beneficiarios/pdf`
- `GET /inscricoes/admin/:id/pdf`
- `GET /inscricoes/admin/edital/:id/export.csv`

### 📎 Documentos

**Fluxo de documentos da inscrição (`/documentos`)**

- `POST /documentos/upload`
- `GET /documentos/inscricao/:inscricaoId`
- `GET /documentos/:id`
- `PUT /documentos/:id`
- `DELETE /documentos/:id`
- `GET /documentos/reprovados/meus`
- `PUT /documentos/resubmissao/:id`
- `GET /documentos/pendencias/meus`

**Armazenamento de arquivos (`/documents`)**

- `POST /documents/upload`
- `GET /documents/view?key=...`
- `GET /documents/presigned?key=...`
- `GET /documents/:filename`

### 🧱 Dados auxiliares

- `POST /dado`
- `GET /dado`
- `GET /dado/:id`
- `PATCH /dado/:id`
- `DELETE /dado/:id`
- `POST /valor-dado`
- `GET /valor-dado/aluno/:alunoId`
- `PATCH /valor-dado/:id`
- `DELETE /valor-dado/:id`
- `POST /validacao`
- `GET /validacao`
- `GET /validacao/:id`
- `PATCH /validacao/:id`
- `DELETE /validacao/:id`

## 👥 Equipe

<div align="center">
<table>
  <tr>
    <td align="center">
      <a href="#" title="defina o título do link">
        <img src="https://avatars.githubusercontent.com/u/24979899?s=96&v=4" width="100px;" alt="Foto do Thales no GitHub"/><br>
        <sub>
          <b>Thales Macêdo</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="#" title="defina o título do link">
        <img src="https://avatars.githubusercontent.com/u/20570844?v=4" width="100px;" alt="Foto do Maurício no GitHub"/><br>
        <sub>
          <b>Mauricio Menezes</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="#" title="defina o título do link">
        <img src="https://avatars.githubusercontent.com/u/83249854?s=64&v=4" width="100px;" alt="Foto do Hugo no GitHub"/><br>
        <sub>
          <b>Hugo Chaves</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="#" title="defina o título do link">
        <img src="https://avatars.githubusercontent.com/u/95954597?s=64&v=4" width="100px;" alt="Foto da Jessica no GitHub"/><br>
        <sub>
          <b>Jessica Ellen</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="#" title="defina o título do link">
        <img src="https://avatars.githubusercontent.com/u/53127444?s=64&v=4" width="100px;" alt="Foto do Lucas no GitHub"/><br>
        <sub>
          <b>Lucas Lima</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="#" title="defina o título do link">
        <img src="https://avatars.githubusercontent.com/u/11302968?s=70&v=4" width="100px;" alt="Foto do Marcos no GitHub"/><br>
        <sub>
          <b>Marcos Vinicius</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="#" title="defina o título do link">
        <img src="https://avatars.githubusercontent.com/u/101533543?v=4" width="100px;" alt="Foto do Matheus no GitHub"/><br>
        <sub>
          <b>Matheus Salaroli</b>
        </sub>
       </a>
    </td>
  </tr>
</table>
</div>

## 📄 Licença

MIT
