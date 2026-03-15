# O que o front precisa fazer: perfil Aluno vs Admin

O backend **não** mistura “quem está logado” com “quem tem perfil de aluno”. Uma conta pode ser só admin, só aluno, ou os dois. O front deve usar a API como fonte da verdade e só mostrar o que fizer sentido.

---

## 1. Não assumir “logado = tem perfil aluno”

- **Não** mostrar abas/menu de aluno (Formulário Geral, Inscrições, Editais para estudante, etc.) só porque a pessoa está logada.
- **Não** usar só o “role” ou um flag do JWT para decidir se mostra área de aluno. O JWT pode ter `ALUNO` em `roles` em alguns fluxos, mas o que garante que a pessoa pode se inscrever é **existir registro de aluno** no backend.

---

## 2. Usar GET /aluno/me como fonte da verdade para “tem perfil aluno”

- Ao carregar a área do estudante (ou ao decidir o que mostrar no menu), chamar **GET /aluno/me** (com o token do usuário).
- **200 + body com dados** → a conta **tem** perfil de aluno. Pode mostrar:
  - Formulário Geral (se aplicável)
  - Editais abertos
  - Inscrições
  - Qualquer fluxo de estudante
- **404** → a conta **não tem** perfil de aluno. Nesse caso **não** mostrar formulários de inscrição, editais para se inscrever, etc. Em vez disso, fazer uma das opções abaixo.

---

## 3. Quando GET /aluno/me retorna 404: duas opções

**Opção A – Esconder área de aluno**

- Não mostrar menu/abas de “Aluno”, “Formulário Geral”, “Minhas Inscrições”, etc.
- Mostrar só o que a pessoa realmente pode usar (ex.: se for admin, só área admin).

**Opção B – Oferecer “Completar cadastro de estudante” (recomendado)**

- Mostrar **uma única tela**: “Complete seu cadastro de estudante para acessar editais e inscrições.”
- Formulário com: **matrícula**, **curso**, **campus**, **data de ingresso**.
- No envio: **POST /aluno/complete-cadastro** com esse JSON (mesmo token da sessão).
- Em caso de **200**: mostrar mensagem de sucesso e daí sim passar a tratar como “tem aluno” (ex.: chamar de novo GET /aluno/me e mostrar o fluxo normal de aluno).
- Em caso de **400** (ex.: “Sua conta já possui cadastro de aluno”, “Matrícula já em uso”): mostrar a mensagem que vier no body e não assumir que tem aluno até GET /aluno/me retornar 200.

---

## 4. Resumo do fluxo recomendado no front

1. **Login** → guardar token e dados básicos do usuário (e roles se quiser).
2. **Ao entrar na “área do estudante” ou ao montar o menu:**
   - Chamar **GET /aluno/me**.
   - **200** → usuário tem aluno: mostrar Formulário Geral, Editais, Inscrições, etc.
   - **404** → usuário não tem aluno:
     - **Ou** não mostrar nada de aluno (opção A).
     - **Ou** mostrar só a tela “Complete seu cadastro de estudante” com o form que chama **POST /aluno/complete-cadastro** (opção B).
3. **Não** mostrar formulários de inscrição em editais nem “Formulário Geral” como se o usuário já fosse aluno quando GET /aluno/me tiver retornado 404.

Assim o front não mostra nada de aluno para quem não tem perfil de aluno, a não ser a tela de completar cadastro quando fizer sentido.

---

## 5. Endpoints que importam para esse ajuste

| Método | Rota | Uso no front |
|--------|------|-----------------------------|
| GET | /aluno/me | Decidir se mostra área de aluno e dados do estudante. 404 = não tem aluno. |
| POST | /aluno/complete-cadastro | Quando não tem aluno: form “Complete seu cadastro” → body: `{ matricula, curso, campus, data_ingresso }`. |
| POST | /inscricoes | Só chamar quando o usuário **já tem** aluno (GET /aluno/me retornou 200). |

---

## 6. Admin

- Área/menu de **admin** podem ser controlados por role no token ou por um endpoint específico de admin (se existir). O importante é: **área de aluno** deve depender de **GET /aluno/me** retornar 200, não de “estar logado” ou “ter role de admin”.
