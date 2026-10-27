# Secret Book

Plataforma de descoberta literária que simula um clube de assinatura de livros surpresa: o leitor responde a um
quiz, recebe um perfil literário e descobre livros "às cegas", guiado por pistas.

> **Protótipo de portfólio.** Livros, autores, planos, valores, depoimentos e assinaturas são demonstrativos
> (fictícios). Nenhum pagamento é processado.

## Estado atual

| Parte | Situação |
|---|---|
| `backend/` (Spring Boot) | ✅ Etapas 1 a 6 implementadas: catálogo, quiz v2 com recomendação explicável, autenticação, área do leitor e painel administrativo. **71 testes passando.** |
| `frontend/` (React + TypeScript) | 🟡 Todas as telas escritas (catálogo, quiz v2, login/cadastro, minha conta, painel). Compila e passa no lint, mas **as telas novas ainda não têm testes nem foram verificadas no navegador** (ver Pendências). |
| Arquivos na raiz (`index.html`, `Quiz.html`, `estilo.css`, `img/`) | 📦 Site estático original, mantido como referência até a nova versão ser aprovada. |

## Pendências (o que falta fazer)

- [ ] **Testes do frontend para as telas novas** (Vitest + Testing Library, usando o simulador de API em
      `src/test/mockApi.ts`):
  - [ ] Catálogo: lista, filtro por gênero, busca, paginação, página do livro e do autor (incluindo 404).
  - [ ] Quiz v2: fluxo completo, pergunta condicional (`tipo-de-magia` só aparece após escolher "magia"),
        opção exclusiva "Nenhum" na pergunta de temas, retomada do progresso salvo, envio e tela de resultado
        (revelar livro, justificativas, avaliação só com login).
  - [ ] Autenticação: login (sucesso, erro e redirecionamento `?voltar=`), cadastro com erros de campo vindos da
        API, esqueci/redefinir senha, `RequireAuth` redirecionando visitantes e mostrando 403 para não-admins.
  - [ ] Minha conta: visão geral, biblioteca (status, favorito, remover), histórico, avaliações, perfil e troca
        de senha.
  - [ ] Painel: visão geral, cadastro/edição/exclusão de livros, autores, gêneros, usuários (papel e acesso),
        avaliações, assinaturas e pesos da recomendação.
  - [ ] Simulação de assinatura com login (grava na conta) e sem login (não grava).
- [ ] **Verificar tudo no navegador** com banco + backend + frontend rodando juntos: fluxos reais, layout no
      celular (largura ~375 px) e mensagens de erro.
- [ ] **Escrever a seção "Como funciona a recomendação"** neste README (resumo do que está documentado em
      `backend/src/main/java/br/com/secretbook/quiz/engine/RecommendationEngine.java`).
- [x] **Logo pesado:** trocado por um SVG desenhado no próprio componente `Logo.tsx` (o arquivo de 1,5 MB foi removido).
- [ ] **E-mail de verdade** para a recuperação de senha (hoje o link sai só no log do backend; ver
      `LoggingPasswordResetNotifier`).
- [ ] **Limite de tentativas de login** (proteção contra força bruta), ainda não implementado.
- [ ] Decidir quando aposentar o site estático da raiz.

## Tecnologias

**Frontend**: React 19, TypeScript 6 (modo estrito), Vite 8, React Router 8, CSS Modules, Lucide (ícones),
Vitest + Testing Library (testes).

**Backend**: Java 21, Spring Boot 4.1, Spring Web MVC, Spring Data JPA, Bean Validation, Spring Security
(OAuth2 Resource Server com JWT), Flyway, PostgreSQL 18, springdoc-openapi (Swagger), Actuator, Testcontainers.
O Maven vem pelo Maven Wrapper (`mvnw`), sem instalação global.

## Pré-requisitos

- Node.js 22+ e npm
- JDK 21 (ex.: Eclipse Temurin 21). Confira com `java -version`; se aparecer outra versão, defina `JAVA_HOME`
  apontando para o JDK 21.
- Docker Desktop **em execução** (banco local e testes do backend)

## Como rodar

### 1. Banco e backend

```bash
cd backend
docker compose up -d       # PostgreSQL local na porta 5433
./mvnw spring-boot:run     # Windows: mvnw.cmd spring-boot:run  →  http://localhost:8080
```

As migrações do Flyway criam as tabelas e os dados demonstrativos (24 livros fictícios, 12 autores, 4 gêneros,
perguntas do quiz e 3 planos) na primeira subida.

**Administrador inicial.** Nenhuma senha fica no código. Para criar o primeiro admin, defina as variáveis abaixo
antes de subir o backend; se a conta ainda não existir, ela é criada com o papel ADMIN. O login é pelo nome de
usuário (`ADMIN_USERNAME`, padrão `admin`); `ADMIN_EMAIL` é opcional e permite também entrar pelo e-mail e
recuperar a senha:

```bash
# PowerShell
$env:ADMIN_USERNAME='admin'; $env:ADMIN_PASSWORD='SuaSenhaForte123'; .\mvnw.cmd spring-boot:run
```

Depois é só entrar em `/entrar` com o nome de usuário e abrir `/admin`. Pelo próprio painel dá para promover outros usuários.

| Endereço | O que é |
|---|---|
| http://localhost:8080/swagger-ui.html | Documentação interativa da API (Swagger UI) |
| http://localhost:8080/v3/api-docs | Especificação OpenAPI em JSON |
| http://localhost:8080/actuator/health | Saúde da aplicação e do banco |

| Comando | O que faz |
|---|---|
| `./mvnw test` | Roda todos os testes (os de integração sobem um PostgreSQL temporário via Testcontainers) |
| `docker compose down` | Para o banco local (os dados ficam no volume `secretbook-pgdata`) |
| `docker compose down -v` | Para o banco e apaga os dados locais |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  (o Vite encaminha /api para o backend na 8080)
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm test` | Roda todos os testes uma vez |
| `npm run test:watch` | Testes em modo observação |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos do TypeScript |
| `npm run build` | Typecheck + build de produção em `frontend/dist` |

### Variáveis de ambiente do backend

Todas são opcionais em desenvolvimento.

| Variável | Padrão | Uso |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/secretbook` | Endereço do banco |
| `DB_USERNAME` / `DB_PASSWORD` | `secretbook` / `secretbook` | Credenciais do banco (só para uso local) |
| `DB_PORT` | `5433` | Porta do host usada pelo `compose.yaml` |
| `JWT_SECRET` | chave de desenvolvimento | Chave dos tokens de login (mínimo 32 caracteres). **Troque fora do ambiente local.** |
| `AUTH_TOKEN_TTL` | `12h` | Duração de uma sessão |
| `FRONTEND_URL` | `http://localhost:5173` | Usado para montar o link de redefinição de senha |
| `ADMIN_USERNAME` | `admin` | Nome de usuário do administrador inicial (ver acima) |
| `ADMIN_PASSWORD` / `ADMIN_EMAIL` / `ADMIN_NAME` | vazio / vazio / `Administrador` | Senha (sem ela, nenhum admin é criado), e-mail opcional e nome de exibição do administrador inicial |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens do frontend autorizadas, separadas por vírgula |
| `PORT` | `8080` | Porta HTTP da API |

Variável do frontend: `VITE_API_URL` (padrão vazio = mesma origem, via proxy do Vite).

> A porta do banco é **5433**, e não 5432, para não conflitar com um PostgreSQL já instalado na máquina.

## API (resumo)

A documentação completa está no Swagger. Rotas públicas, de leitor logado e de administrador:

| Área | Rotas | Acesso |
|---|---|---|
| Catálogo | `GET /api/genres`, `/api/books?genre=&q=&page=`, `/api/books/{slug}`, `/api/books/{slug}/comments`, `/api/authors/{slug}` | Público |
| Quiz | `GET /api/quiz`, `POST /api/quiz/attempts`, `GET /api/quiz/attempts/{id}` | Público (tentativas de uma conta só abrem para o dono ou admin) |
| Planos | `GET /api/plans` | Público |
| Autenticação | `POST /api/auth/register` (nome de usuário + senha + aceite da política de privacidade, sem e-mail), `/login` (nome de usuário; contas antigas também pelo e-mail), `/password/forgot`, `/password/reset` (só contas com e-mail) | Público |
| Sessão | `GET/PATCH /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/password/change` | Logado |
| Minha conta | `/api/me/library`, `PUT/DELETE /api/me/library/{slug}/review` (comentário de livro lido), `/api/me/reader-profile`, `/api/me/feedback`, `/api/me/quiz-attempts`, `/api/me/subscription` | Logado |
| Dados pessoais (LGPD) | `GET /api/me/export` (tudo o que guardamos, em JSON), `DELETE /api/me` (exclui a conta; pede a senha) | Logado |
| Painel | `/api/admin/**` (estatísticas, livros, autores, gêneros, usuários, avaliações, assinaturas, pesos) | Admin |

## Backend: convenções

- **Organização por funcionalidade**: `catalog`, `quiz` (com o motor em `quiz/engine`, Java puro e testado sem
  banco), `auth`, `account`, `admin`, `common`, `config`.
- **Migrações**: o esquema é criado só pelo Flyway, em `backend/src/main/resources/db/migration`
  (`V1__catalog`, `V2__quiz`, `V3__auth`, `V4__account`, `V5__reader_profile`). O Hibernate apenas valida (`ddl-auto=validate`).
- **Erros**: todas as respostas de erro seguem o padrão [Problem Details (RFC 9457)](https://www.rfc-editor.org/rfc/rfc9457),
  com `Content-Type: application/problem+json` e textos em português, inclusive 401 e 403. Erros de validação
  trazem a lista `errors` (`[{ "field": "title", "message": "é obrigatório" }]`). Use `ResourceNotFoundException`
  (404) ou `ApiException` (400, 401, 403, 409) para erros de negócio. Erros inesperados viram 500 com mensagem
  genérica; o detalhe técnico vai só para o log.
- **Autenticação**: o login devolve um JWT (HS256) que carrega o id de uma sessão gravada no banco. A cada
  requisição a sessão é conferida, então "Sair", troca de senha, desativação da conta e mudança de papel valem na
  hora. Senhas com BCrypt; o link de redefinição guarda só o hash (SHA-256) e vale 30 minutos.
- **Testes de integração**: estendem `IntegrationTest` (aplicação completa + PostgreSQL em contêiner compartilhado),
  e cada teste roda em uma transação desfeita no final.

## Estrutura do frontend

```
frontend/src/
├── api/               # cliente HTTP (erros da API em português), token de sessão, erros de formulário
├── components/
│   ├── layout/        # cabeçalho (menu mobile, Entrar/Minha conta/Painel), rodapé, layout raiz
│   └── ui/            # Button, campos de formulário, paginação, estados de carregamento/erro/vazio
├── config/site.ts     # dados públicos do site (nome, WhatsApp)
├── data/              # planos, FAQ e depoimentos demonstrativos da landing
├── features/
│   ├── landing/       # landing page, uma seção por arquivo
│   ├── catalog/       # catálogo, página do livro e do autor
│   ├── quiz/          # quiz v2 (perguntas da API), resultado e cartões de recomendação
│   ├── auth/          # sessão (AuthProvider), login, cadastro, senha, proteção de rotas
│   ├── account/       # minha conta: visão geral, biblioteca, histórico, avaliações, perfil
│   ├── admin/         # painel administrativo
│   ├── plans/         # simulação de assinatura
│   └── misc/          # 404
├── hooks/             # usePageTitle, useApi
├── styles/            # tokens.css (paleta, tipografia, sombras) e global.css
├── test/              # setup dos testes, renderRoute e simulador de API (mockApi)
├── router.tsx         # tabela de rotas
└── main.tsx           # ponto de entrada
```

### Rotas

| Rota | Página |
|---|---|
| `/` | Landing page |
| `/catalogo`, `/livros/:slug`, `/autores/:slug` | Catálogo demonstrativo |
| `/quiz`, `/quiz/resultado/:id` | Quiz v2 e resultado com recomendações |
| `/assinar/:planSlug` | Simulação de assinatura (com login, fica registrada na conta) |
| `/entrar`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` | Autenticação |
| `/minha-conta` (+ `/biblioteca`, `/historico`, `/avaliacoes`, `/perfil`) | Área do leitor (exige login) |
| `/admin` (+ `/livros`, `/autores`, `/generos`, `/usuarios`, `/avaliacoes`, `/assinaturas`, `/recomendacao`) | Painel administrativo (exige papel ADMIN) |
| qualquer outra | Página 404 |

## Decisões

- **Código em inglês, interface em português.**
- **CSS Modules + tokens**, sem biblioteca de componentes: os elementos nativos já são acessíveis.
- **Dados ilustrativos sempre sinalizados.** O catálogo usa livros e autores fictícios, para não inventar dados
  sobre obras reais.
- **Recomendação explicável**: cada livro recomendado vem com a nota de cada critério (gênero, ritmo, clima,
  tamanho) e frases dizendo por que foi escolhido. Os pesos ficam no banco e são editáveis no painel. Livros com
  temas que o leitor pediu para evitar, já lidos ou avaliados como "não combina" nunca são recomendados.
- **Auditoria fora do escopo** (decisão do projeto); o painel administrativo é a etapa final.

## Limitações conhecidas

- **Recuperação de senha sem e-mail:** o link aparece no log do backend (protótipo). Contas novas não têm e-mail
  (minimização de dados), então só contas antigas e o admin com `ADMIN_EMAIL` conseguem recuperar a senha.
- **Token no `localStorage`:** simples para o protótipo, mas vulnerável se houver XSS; a sessão pode ser revogada no
  servidor a qualquer momento.
- **Sem limite de tentativas de login.**
- **Tentativas anônimas do quiz** não são associadas à conta se a pessoa fizer login depois.
- **Contato:** o formulário apenas monta a mensagem e abre o WhatsApp.

## Roadmap

1. ~~Backend base: PostgreSQL local, Flyway, OpenAPI (Swagger), tratamento de erros, CORS.~~ ✅
2. ~~Catálogo: livros, autores e gêneros (modelagem, migrações, dados demonstrativos, API e telas).~~ ✅
3. ~~Quiz v2 no backend + motor de recomendação explicável (pesos configuráveis, justificativas, testes).~~ ✅
4. ~~Autenticação: cadastro, login, logout, recuperação de senha, papéis de usuário e administrador.~~ ✅
5. ~~Dashboard: biblioteca, favoritos, histórico, feedback de recomendações, assinatura demonstrativa persistida.~~ ✅
6. ~~Painel administrativo (etapa final; auditoria fora do escopo).~~ ✅

Implementado; falta concluir os itens de **Pendências** (testes do frontend e verificação no navegador).
