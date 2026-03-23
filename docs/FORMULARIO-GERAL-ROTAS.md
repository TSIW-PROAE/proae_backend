# Formulário Geral – Rotas e Especificação Frontend

## Regra de negócio

- **Aluno:** precisa preencher o **Formulário Geral** e ter a inscrição **aprovada** para poder se inscrever em outros editais/benefícios.
- Se não respondeu, respondeu e não foi aprovado, ou está pendente → **não pode** criar novas inscrições em outros editais.
- **Admin:** pode criar, editar e desativar o formulário geral (um por sistema).

---

## Rotas do backend (todas aplicadas)

### Formulário Geral (novas)
| Método | Rota | Quem | Descrição |
|--------|------|------|-----------|
| GET | `/formulario-geral` | Aluno / Admin (autenticado) | Retorna o formulário geral (edital + steps + perguntas + vagas). Para aluno: inclui `minha_inscricao` (id, status_inscricao, vaga_id) e `pode_se_inscrever_em_outros` (true só se inscrição aprovada). 404 se não houver FG. |
| POST | `/formulario-geral` | Admin | Cria o formulário geral (edital + uma vaga "Formulário Geral"). Body: `{ titulo_edital, descricao?, steps? }`. Em `steps`: array de `{ texto, perguntas: [{ pergunta, tipo_Pergunta, obrigatoriedade, opcoes?, tipo_formatacao? }] }`. O FG tem steps e perguntas como qualquer edital; o aluno envia respostas via **POST /inscricoes** (vaga_id do FG + array respostas). |
| PATCH | `/formulario-geral/:id` | Admin | Atualiza título/descrição do FG. |
| DELETE | `/formulario-geral/:id` | Admin | Desativa o FG (não remove dados). Erro se houver inscrições vinculadas. |

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/signup` | Cadastro aluno |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| PATCH | `/auth/update-password` | Atualizar senha (autenticado) |
| POST | `/auth/forgot-password` | Solicitar recuperação de senha |
| POST | `/auth/reset-password` | Resetar senha com token |
| POST | `/auth/validate-token` | Validar JWT do cookie |
| POST | `/auth/signup-admin` | Cadastro admin (aguardando aprovação) |
| GET | `/auth/approve-admin/:token` | Aprovar admin (link do email) |
| GET | `/auth/reject-admin/:token` | Rejeitar admin (link do email) |

### Aluno
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/aluno/me` | Dados do aluno logado |
| GET | `/aluno/all` | Listar alunos (admin) |
| PATCH | `/aluno/update` | Atualizar dados do aluno |
| GET | `/aluno/inscricoes` | Inscrições do aluno |
| GET | `/aluno/edital/:editalId/step/:stepId/alunos` | Alunos por edital/step (admin) |

### Editais
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/editais` | Criar edital |
| GET | `/editais` | Listar editais |
| GET | `/editais/abertos` | Editais abertos |
| GET | `/editais/:id` | Edital por ID |
| PATCH | `/editais/:id` | Atualizar edital |
| GET | `/editais/:id/inscritos` | Inscritos no edital (admin) |
| PATCH | `/editais/:id/status/:status` | Atualizar status |
| DELETE | `/editais/:id` | Remover edital |

### Inscrições
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/inscricoes` | Criar inscrição (bloqueado se FG não aprovado) |
| PATCH | `/inscricoes/:id` | Atualizar inscrição |
| GET | `/inscricoes` | Listar inscrições (do aluno ou admin) |
| POST | `/inscricoes/cache/save/respostas` | Salvar rascunho respostas em cache |
| GET | `/inscricoes/cache/respostas/vaga/:vagaId` | Obter rascunho por vaga |
| GET | `/inscricoes/aprovados/pdf` | PDF dos aprovados |

### Documentos
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/documentos/upload` | Upload documento |
| GET | `/documentos/inscricao/:inscricaoId` | Documentos por inscrição |
| GET | `/documentos/:id` | Documento por ID |
| PUT | `/documentos/:id` | Atualizar documento |
| DELETE | `/documentos/:id` | Remover documento |
| GET | `/documentos/reprovados/meus` | Meus documentos reprovados |
| PUT | `/documentos/resubmissao/:id` | Resubmissão |
| GET | `/documentos/pendencias/meus` | Minhas pendências |

### Steps
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/steps` | Criar step |
| GET | `/steps/edital/:id/with-perguntas` | Steps do edital com perguntas |
| GET | `/steps/edital/:id` | Steps do edital |
| PATCH | `/steps/:id` | Atualizar step |
| DELETE | `/steps/:id` | Remover step |

### Perguntas
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/perguntas` | Criar pergunta |
| GET | `/perguntas/step/:stepId` | Perguntas do step |
| PATCH | `/perguntas/:id` | Atualizar pergunta |
| DELETE | `/perguntas/:id` | Remover pergunta |

### Respostas
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/respostas` | Criar resposta |
| GET | `/respostas` | Listar respostas |
| GET | `/respostas/:id` | Resposta por ID |
| PATCH | `/respostas/:id` | Atualizar resposta |
| DELETE | `/respostas/:id` | Remover resposta |
| GET | `/respostas/aluno/:alunoId/edital/:editalId` | Respostas aluno/edital |
| GET | `/respostas/aluno/:alunoId/edital/:editalId/step/:stepId` | Por step |
| GET | `/respostas/aluno/:alunoId/edital/:editalId/step/:stepId/perguntas-com-respostas` | Perguntas com respostas |
| GET | `/respostas/pergunta/:perguntaId/edital/:editalId` | Por pergunta/edital |
| PATCH | `/respostas/:id/validate` | Validar resposta |

### Vagas
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/vagas` | Criar vaga |
| GET | `/vagas/edital/:editalId` | Vagas do edital |
| PATCH | `/vagas/:id` | Atualizar vaga |
| DELETE | `/vagas/:id` | Remover vaga |

### Dado / Valor Dado
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/dado` | Criar dado |
| GET | `/dado` | Listar |
| GET | `/dado/:id` | Por ID |
| PATCH | `/dado/:id` | Atualizar |
| DELETE | `/dado/:id` | Remover |
| POST | `/valor-dado` | Criar valor dado |
| GET | `/valor-dado/aluno/:alunoId` | Por aluno |
| PATCH | `/valor-dado/:id` | Atualizar |
| DELETE | `/valor-dado/:id` | Remover |

### Validação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/validacao` | Criar validação |
| GET | `/validacao` | Listar |
| GET | `/validacao/:id` | Por ID |
| PATCH | `/validacao/:id` | Atualizar |
| DELETE | `/validacao/:id` | Remover |

### Minio/Documents
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/documents/upload` | Upload |
| GET | `/documents/:filename` | Download por nome |

### Health
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |

---

## Especificação para o frontend

### 1. Menu – aba “Formulário Geral” (para aluno)

- No menu do portal do **aluno**, incluir sempre a aba **“Formulário Geral”**.
- Rota sugerida no front: `/formulario-geral` (ou `/aluno/formulario-geral`).
- Acesso: apenas para usuário com perfil aluno (e que tenha aluno vinculado).

### 2. Tela Formulário Geral (aluno)

- **GET** `GET /formulario-geral` (com cookie/token).
- Resposta esperada (exemplo):
```json
{
  "id": 1,
  "titulo_edital": "Formulário Geral",
  "descricao": "...",
  "status_edital": "Edital em aberto",
  "is_formulario_geral": true,
  "steps": [
    {
      "id": 1,
      "texto": "Dados pessoais",
      "perguntas": [
        {
          "id": 1,
          "pergunta": "Nome completo",
          "tipo_Pergunta": "texto",
          "obrigatoriedade": true,
          "opcoes": null,
          "tipo_formatacao": null
        }
      ]
    }
  ],
  "vagas": [{ "id": 1, "beneficio": "Formulário Geral", "descricao_beneficio": "..." }],
  "minha_inscricao": null,
  "pode_se_inscrever_em_outros": false
}
```

- **minha_inscricao:** `null` se ainda não tiver inscrição no FG; caso contrário `{ id, status_inscricao, vaga_id }`.
- **pode_se_inscrever_em_outros:** `true` somente quando existir inscrição no FG com `status_inscricao === "Inscrição Aprovada"`.

Comportamento na tela:

- Se **não existe** formulário geral (404): mostrar mensagem do tipo “Formulário geral não configurado” e não exibir formulário.
- Se **existe** e **minha_inscricao === null**: exibir o formulário para preenchimento; ao enviar, usar **POST /inscricoes** com `vaga_id` da primeira vaga retornada em `vagas[0].id` e as respostas no mesmo formato já usado em outras inscrições.
- Se **minha_inscricao** existe e status não é “Inscrição Aprovada”: exibir mensagem de que o formulário está em análise ou foi negado (conforme `status_inscricao`) e que é preciso estar aprovado para se inscrever em outros editais.
- Se **pode_se_inscrever_em_outros === true**: exibir que o formulário geral está aprovado e que o aluno pode se inscrever nos demais editais.

### 3. Bloqueio de outras inscrições (aluno)

- Ao listar ou acessar **editais/benefícios** (exceto o formulário geral), o front deve usar **pode_se_inscrever_em_outros** (ou equivalente obtido de `GET /formulario-geral`).
- Se `pode_se_inscrever_em_outros === false`:
  - Desabilitar ou ocultar botão “Inscrever-se” (ou equivalente) nos outros editais, e
  - Exibir mensagem clara: “É necessário preencher e ter o Formulário Geral aprovado para se inscrever em outros editais/benefícios.”
- Se o usuário tentar inscrever mesmo assim, o backend retorna **400** com a mensagem: `"É necessário ter o Formulário Geral preenchido e aprovado para se inscrever em outros editais/benefícios."` — o front pode exibir essa mesma mensagem em um toast/modal.

### 4. Admin – Formulário Geral (criar, editar, desativar)

- **Criar:** tela/modal com título (e opcionalmente descrição). Ao salvar, **POST /formulario-geral** com body `{ titulo_edital: "Formulário Geral", descricao?: "..." }`. Após criar, o admin pode: (1) adicionar steps e perguntas via **POST /steps** e **POST /perguntas** (usando o `id` do edital retornado); (2) abrir o edital para inscrições com **PATCH /editais/:id/status/ABERTO**.
- **Editar:** tela que carrega o FG com **GET /formulario-geral** e permite alterar título/descrição; salvar com **PATCH /formulario-geral/:id** com `{ titulo_edital?, descricao? }`. Steps e perguntas continuam sendo editados pelas rotas de steps e perguntas.
- **Desativar/Excluir:** ação (ex.: botão “Desativar formulário geral”) que chama **DELETE /formulario-geral/:id**. Se houver inscrições, o backend retorna erro; exibir a mensagem retornada.

### 5. Resumo de integração frontend

| Ação | Método | Rota | Observação |
|------|--------|------|------------|
| Aba menu aluno | — | — | Sempre visível: “Formulário Geral” → `/formulario-geral` |
| Carregar FG + status do aluno | GET | `/formulario-geral` | Cookie/token; usar `minha_inscricao` e `pode_se_inscrever_em_outros` |
| Enviar respostas do FG (aluno) | POST | `/inscricoes` | `vaga_id` = `vagas[0].id` do FG; mesmo schema de respostas das outras inscrições |
| Bloquear outras inscrições | — | — | Se `pode_se_inscrever_em_outros === false`, desabilitar inscrever e mostrar mensagem |
| Admin: criar FG | POST | `/formulario-geral` | Body: `titulo_edital`, `descricao?` |
| Admin: editar FG | PATCH | `/formulario-geral/:id` | Body: `titulo_edital?`, `descricao?` |
| Admin: desativar FG | DELETE | `/formulario-geral/:id` | Tratar erro quando houver inscrições |

---

## Migração de banco

Foi adicionada a coluna **`is_formulario_geral`** (boolean, default false) na tabela do **Edital**. Se usar migrations, crie uma migration que adicione essa coluna; caso use `synchronize: true` em desenvolvimento, o TypeORM já aplica a alteração.
