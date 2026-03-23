# Benefício no edital × Análise da inscrição

São **dois eixos independentes**:

| Conceito | Campo | Significado |
|----------|--------|-------------|
| **Análise da inscrição** | `status_inscricao` | Trâmite da inscrição: pendente, aprovada na análise, negada, ajuste necessário, etc. |
| **Benefício no edital** | `status_beneficio_edital` | Homologação como **beneficiário da vaga** no edital: pendente de seleção, beneficiário, não beneficiário. |

Exemplos possíveis (conforme regras da PROAE):

- Inscrição **aprovada na análise**, benefício **ainda pendente** (aguardando lista final).
- Inscrição **aprovada na análise** e **beneficiário** homologado.
- Outras combinações, se a política permitir.

**Formulário Geral** e **Renovação** não usam `status_beneficio_edital` na API de alteração: a gestão é feita só pelo status da inscrição.

## API

- `PATCH /inscricoes/admin/:id/status` — análise da inscrição (+ observação).
- `PATCH /inscricoes/admin/:id/beneficio-edital` — corpo `{ "status_beneficio_edital": "Beneficiário no edital" }` (valores do enum). **Regra:** não é possível marcar **Beneficiário no edital** se a inscrição **não** estiver com status **Inscrição Aprovada** (a homologação do benefício vem depois da validação da inscrição).
- `GET /beneficios/aluno` (JWT aluno) — lista benefícios para o card **Meus benefícios** no portal: só entram inscrições **Beneficiário no edital** **e** **Inscrição Aprovada** (formato `{ dados: { beneficios: [...] } }`).
- `GET /aluno/admin/por-edital/:editalId/alunos?apenas_beneficiarios_edital=true&apenas_inscricao_aprovada=true` — lista alunos com inscrição naquele edital, com filtros opcionais.

### PDFs (admin, JWT)

- `GET /inscricoes/aprovados/pdf?editalId=` — lista quem tem **Inscrição Aprovada** (análise). `editalId` recomendado.
- `GET /inscricoes/beneficiarios/pdf?editalId=` — lista quem está como **Beneficiário no edital** (homologação). `editalId` obrigatório.

## Banco

Coluna `inscricao.status_beneficio_edital` (varchar, default `Pendente seleção`). Rodar a migration em `src/migrations/1739632000000-AddStatusBeneficioEdital.ts` (ou o SQL equivalente) antes de subir o backend.
