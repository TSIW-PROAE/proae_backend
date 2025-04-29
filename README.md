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

## 📊 Estrutura Principal

```
src/
├── aluno      # Gestão de alunos
├── auth       # Autenticação
├── edital     # Gestão de editais
└── ...
```

## 📚 API (Atualizada em 27/04/2024)

### 🔐 Autenticação

**Cadastro de Usuário**

```
POST /auth/signup
```

- **Corpo:**
  ```json
  {
    "registrationNumber": "123456789", // Número de matrícula
    "email": "email@example.com",
    "password": "Senha@123", // Mínimo 8 caracteres, 1 letra, 1 número, 1 especial
    "firstName": "Nome",
    "lastName": "Sobrenome"
  }
  ```
- **Resposta:** Dados do usuário cadastrado com ID do Clerk

### 👤 Alunos

**Obter Dados do Aluno**

```
GET /aluno
```

- **Autenticação:** Token Bearer obrigatório
- **Resposta:** Dados completos do aluno autenticado

**Atualizar Dados do Aluno**

```
PATCH /aluno/update
```

- **Autenticação:** Token Bearer obrigatório
- **Corpo:** (todos campos opcionais)
  ```json
  {
    "nome": "string", // Nome do aluno
    "sobrenome": "string", // Sobrenome do aluno
    "email": "email@example.com", // Email do aluno
    "matricula": "123456789", // Matrícula do aluno
    "pronome": "MASCULINO", // Enum: MASCULINO, FEMININO, NEUTRO...
    "data_nascimento": "2000-01-01", // Data formato ISO
    "curso": "ADMINISTRACAO", // Enum do curso
    "campus": "SALVADOR", // Enum do campus/unidade
    "data_ingresso": "2022-01-01", // Data formato ISO
    "celular": "71999999999" // Telefone celular
  }
  ```
- **Resposta:** Dados atualizados do aluno

### 📋 Editais

**Listar Todos os Editais**

```
GET /editais
```

- **Resposta:** Lista de todos os editais cadastrados

**Obter Edital Específico**

```
GET /editais/:id
```

- **Parâmetros:** `id` - ID numérico do edital
- **Resposta:** Detalhes completos do edital solicitado

**Criar Novo Edital**

```
POST /editais
```

- **Corpo:**
  ```json
  {
    "nome_edital": "Edital 2024.1",
    "descricao": "Descrição do edital",
    "tipo_beneficio": ["AUXILIO_ALIMENTACAO", "AUXILIO_TRANSPORTE"],
    "edital_url": ["http://url-do-documento.pdf"],
    "categoria_edital": ["AUXILIO"],
    "status_edital": "ATIVO",
    "quantidade_bolsas": 100,
    "etapas": [
      {
        "nome": "Inscrição",
        "descricao": "Etapa de inscrição",
        "ordem": 1,
        "data_inicio": "2024-05-01T00:00:00.000Z",
        "data_fim": "2024-05-15T23:59:59.000Z"
      }
    ]
  }
  ```
- **Resposta:** Edital criado com ID

**Atualizar Edital**

```
PATCH /editais/:id
```

- **Parâmetros:** `id` - ID numérico do edital
- **Corpo:**
  ```json
  {
    "nome_edital": "Edital Atualizado",
    "descricao": "Nova descrição",
    "tipo_beneficio": ["AUXILIO_ALIMENTACAO"],
    "edital_url": ["http://nova-url.pdf"],
    "categoria_edital": ["AUXILIO"],
    "status_edital": "DESATIVADO",
    "quantidade_bolsas": 50
  }
  ```
- **Resposta:** Dados atualizados do edital

**Excluir Edital**

```
DELETE /editais/:id
```

- **Parâmetros:** `id` - ID numérico do edital
- **Resposta:** Confirmação da exclusão

## 👥 Equipe

<div align="center">
<table>
  <tr>
    <td align="center"><img src="https://avatars.githubusercontent.com/u/24979899?s=96&v=4" width="70px;" alt=""/><br><b>Thales</b></td>
    <td align="center"><img src="https://avatars.githubusercontent.com/u/20570844?v=4" width="70px;" alt=""/><br><b>Mauricio</b></td>
    <td align="center"><img src="https://avatars.githubusercontent.com/u/83249854?s=64&v=4" width="70px;" alt=""/><br><b>Hugo</b></td>
    <td align="center"><img src="https://avatars.githubusercontent.com/u/95954597?s=64&v=4" width="70px;" alt=""/><br><b>Jessica</b></td>
    <td align="center"><img src="https://avatars.githubusercontent.com/u/53127444?s=64&v=4" width="70px;" alt=""/><br><b>Lucas</b></td>
    <td align="center"><img src="https://avatars.githubusercontent.com/u/11302968?s=70&v=4" width="70px;" alt=""/><br><b>Marcos</b></td>
  </tr>
</table>
</div>

## 📄 Licença

MIT
