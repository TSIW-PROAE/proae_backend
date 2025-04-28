# PROAE back-end

<img src="https://github.com/TSIW-PROAE/.github/raw/main/img/logo_pgcomp.png" alt="Logo pgcomp">

Back-end do sistema de gestão para a Pró-Reitoria de Ações Afirmativas e Assistência Estudantil (PROAE) da UFBA

## 🛠️ Tecnologias Utilizadas

O projeto foi desenvolvido com as seguintes tecnologias:

⚡ NodeJs - Plataforma que permite a execução de código JavaScript no servidor.

⚛️ NestJs - Framework back-end que auxilia no desenvolvimento de aplicações eficientes e escaláveis em cima do NodeJs.

:game_die: PostgreSQL - Sistema de gerenciamento de banco de dados relacional.

:whale: Docker - Plataforma de software que permite criar, testar e implantar modificações em containers virtuais.

:whale2: Docker-Compose - Ferramenta que gerencia múltiplos containers no docker.

🟦 TypeScript - Tipagem estática para JavaScript

## 💻 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- Node.js v16 ou superior
- Gerenciador de pacotes: npm
- Docker e Docker-Compose

## 📂 Estrutura do Projeto

```plaintext
src/
├── aluno/            # Módulo de gerenciamento de alunos
├── auth/             # Módulo de autenticação
├── db/               # Configuração de banco de dados
├── edital/           # Módulo de gerenciamento de editais
├── entities/         # Entidades do sistema
├── enum/             # Enumerações utilizadas no projeto
├── migrations/       # Migrações de banco de dados
├── types/            # Tipos personalizados
├── app.module.ts     # Módulo principal da aplicação
└── main.ts           # Ponto de entrada da aplicação
```

## 🚀 Como Rodar o Projeto

1. **Clone o repositório**

```bash
git clone https://github.com/TSIW-PROAE/proae_backend
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Renomeie o arquivo .env.example para .env e preencha com os valores necessários.

4. **Inicie o projeto**

Sem Docker

```bash
npm run start:dev
```

Com Docker

```bash
docker-compose up -d
```

Obs: A variável de ambiente `DB_HOST` deve ser `db` para o docker-compose.

## 🌐 Ambiente de Desenvolvimento

O ambiente de desenvolvimento baseado na branch `develop` está disponível em:

```
http://b8ckk40k0ook00gckgk44s84.201.54.12.165.sslip.io/
```

Este ambiente é atualizado automaticamente com as mudanças aprovadas na branch develop.

## 📚 Documentação da API (Atualizada em 27/04/2024)

### Autenticação

#### Cadastro de Usuário

```
POST /auth/signup
```

Cria um novo usuário no sistema.

**Corpo da requisição:**

```json
{
  "nome": "string",
  "email": "string",
  "clerkId": "string"
}
```

### Alunos

#### Obter Dados do Aluno Autenticado

```
GET /aluno
```

Retorna os dados do aluno atualmente autenticado.

**Cabeçalhos:**

- Authorization: Bearer {token}

#### Atualizar Dados do Aluno

```
PATCH /aluno/update
```

Atualiza os dados do aluno autenticado.

**Cabeçalhos:**

- Authorization: Bearer {token}

**Corpo da requisição:**

```json
{
  "nome": "string",
  "email": "string",
  "telefone": "string",
  "dataNascimento": "string",
  "cpf": "string",
  "rg": "string"
  // outros campos conforme necessário
}
```

### Editais

#### Listar Todos os Editais

```
GET /editais
```

Retorna uma lista de todos os editais disponíveis.

#### Obter Edital Específico

```
GET /editais/:id
```

Retorna os detalhes de um edital específico.

#### Criar Novo Edital

```
POST /editais
```

Cria um novo edital no sistema.

**Corpo da requisição:**

```json
{
  "titulo": "string",
  "descricao": "string",
  "dataInicio": "string",
  "dataFim": "string",
  "status": "string"
}
```

#### Atualizar Edital

```
PATCH /editais/:id
```

Atualiza os dados de um edital existente.

**Corpo da requisição:**

```json
{
  "titulo": "string",
  "descricao": "string",
  "dataInicio": "string",
  "dataFim": "string",
  "status": "string"
}
```

#### Remover Edital

```
DELETE /editais/:id
```

Remove um edital do sistema.

## 🤝 Colaboradores

Agradecemos às seguintes pessoas que contribuíram para este projeto:

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
  </tr>
</table>

## 📝 Licença

MIT

## :anchor: Requisitos

- **Centralização de Informações:** O sistema deve centralizar todos os documentos, informações de estudantes e seus núcleos familiares, histórico de processos e pareceres.
- **Gestão de Processos Seletivos:** O sistema deve permitir a gestão completa dos processos seletivos, desde a inscrição até a divulgação do resultado final, incluindo:
  - Cadastro de editais com seus respectivos baremas e documentos exigidos.
  - Inscrições online com validação automática de documentos.
  - Análise de renda automatizada e comparada com os documentos fornecidos.
  - Emissão de pareceres com opções pré-definidas para tipos de indeferimento.
  - Acompanhamento do status de cada inscrição.
  - Divulgação de resultados preliminares, prazos de recurso e resultados finais.
- **Validação de Documentos:** O sistema deve automatizar a validação de documentos, com alertas para documentos inválidos ou faltantes.
- **Comunicação com Estudantes:** O sistema deve permitir a comunicação direta com os estudantes, com envio de alertas e respostas automatizadas sobre o status de suas inscrições e pendências.
- **Relatórios e Análises:** O sistema deve gerar relatórios e análises sobre os dados coletados, auxiliando na tomada de decisões.
- **Segurança e Sigilo de Dados:** O sistema deve garantir a segurança e o sigilo dos dados sensíveis dos estudantes, com acesso restrito a pessoas autorizadas e histórico de observações com níveis de sigilo.
- **Integração com Outros Sistemas:** O sistema deve ser capaz de integrar com outros sistemas da faculdade, como o sistema de matrícula.
- **Manutenção de Histórico:** O sistema precisa manter o histórico dos dados pelo período de tempo legalmente exigido, mesmo após o encerramento dos processos seletivos.
