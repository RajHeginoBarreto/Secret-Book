# Secret Book

Plataforma de descoberta literária que simula um clube de assinatura de livros surpresa: o leitor responde a um
quiz, recebe um perfil literário e descobre livros "às cegas", guiado por pistas.

> **Protótipo de portfólio.** Livros, autores, planos, valores, depoimentos e assinaturas são demonstrativos
> (fictícios). Nenhum pagamento é processado.

## Estado atual

| Parte | Situação |
|---|---|
| `backend/` (Spring Boot) | ✅ Catálogo, quiz v2 com recomendação explicável, login só com nome de usuário e senha (LGPD), limite de tentativas de login, perfil do leitor, comentários, exportação/exclusão de conta e painel administrativo. **86 testes passando.** |
| `frontend/` (React + TypeScript) | ✅ Landing redesenhada, catálogo, quiz, login/cadastro, perfil do leitor, minha conta e painel. **134 testes passando.** |

## Pendências

Nenhuma pendência aberta. Concluído nesta rodada:

- [x] Testes do frontend para todas as telas (catálogo, quiz, autenticação, minha conta, perfil do leitor, painel e
      simulação de assinatura), com o simulador de API em `src/test/mockApi.ts`.
- [x] Verificado no navegador com banco + backend + frontend juntos: cadastro, perfil do leitor, comentário público, preferências, exportação, bloqueio de login, exclusão de conta e layout no celular (375 px).
- [x] Seção "Como funciona a recomendação" (abaixo).
- [x] Logo oficial sem fundo (`frontend/src/assets/secret-book-logo-*.webp`), com versão de letreiro claro para fundos escuros, no lugar do arquivo de 1,5 MB.
- [x] E-mail de verdade para a recuperação de senha: com `SPRING_MAIL_HOST` definido, o link vai por SMTP
      (`SmtpPasswordResetNotifier`); sem ele, continua indo para o log. Só contas com e-mail recebem.
- [x] Limite de tentativas de login: 5 falhas por conta ou 30 por IP em 15 minutos bloqueiam novas tentativas
      (HTTP 429) até a janela passar; um login certo zera o contador da conta.
- [x] Site estático da raiz aposentado (continua no histórico do Git).

## Como funciona a recomendação

O motor fica em `backend/src/main/java/br/com/secretbook/quiz/engine/` e é determinístico: as mesmas respostas
geram sempre o mesmo resultado.

1. **Perfil de preferências.** Cada opção do quiz soma pontos em quatro dimensões: gêneros, ritmo (lento,
   equilibrado, rápido), clima (leve, emocionante, sombrio, reflexivo) e tamanho (curto, médio, longo ou "tanto
   faz"). A pergunta de temas a evitar marca conteúdos sensíveis (violência, luto, terror...). Em empate, vale a
   resposta mais recente.
2. **Perfil literário.** O nome do perfil vem do gênero mais forte, ou da combinação dos dois mais fortes quando o
   segundo tem pelo menos `mix_threshold` pontos (ex.: "fantasia+romance").
3. **Exclusões.** Nunca são recomendados livros com temas a evitar e, para quem está logado, livros já lidos,
   avaliados como "não combina" ou de um gênero marcado como "não gosto" no perfil do leitor (o tipo literário casa
   com o gênero do catálogo pelo nome: "Ficção científica" → `ficcao-cientifica`).
4. **Nota de cada critério (0 a 1).**
   - Gênero: soma das frações do perfil que foram para os gêneros do livro (máximo 1).
   - Ritmo e tamanho: 1 se igual ao preferido, 0,5 se vizinho, 0 se oposto; tamanho "tanto faz" vale 1.
   - Clima: pontos do clima do livro divididos pelos pontos do clima preferido.
5. **Nota final (0 a 100)** = média ponderada dos critérios. Pesos padrão: gênero 0,50, clima 0,20, ritmo 0,15,
   tamanho 0,15; ajustáveis no painel (`/admin/recomendacao`), assim como a quantidade de livros (padrão 5).
6. **Ordem e explicação.** Ordena pela nota, depois pela nota de gênero e pelo título. Cada livro vem com a nota de
   cada critério e frases explicando a escolha ("Gênero Fantasia, que representa 60% do seu perfil"...).

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
| `LOGIN_MAX_FAILURES_PER_ACCOUNT` / `LOGIN_MAX_FAILURES_PER_IP` / `LOGIN_WINDOW` | `5` / `30` / `15m` | Limite de tentativas de login erradas |
| `SPRING_MAIL_HOST` (+ `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`) | vazio | Servidor SMTP para o e-mail de redefinição de senha; vazio = link no log |
| `MAIL_FROM` | `nao-responda@secretbook.local` | Remetente do e-mail de redefinição |
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
├── data/              # planos e FAQ demonstrativos da landing
├── features/
│   ├── landing/       # landing page (uma seção por arquivo) e ilustrações em CSS (pacote kraft, bandeirolas...)
│   ├── catalog/       # catálogo, página do livro e do autor
│   ├── quiz/          # quiz v2 (perguntas da API), resultado e cartões de recomendação
│   ├── auth/          # sessão (AuthProvider), login, cadastro, senha, proteção de rotas
│   ├── account/       # minha conta: perfil do leitor, comentários, biblioteca, histórico, avaliações, privacidade
│   ├── admin/         # painel administrativo
│   ├── plans/         # simulação de assinatura
│   └── misc/          # 404 e política de privacidade
├── hooks/             # usePageTitle, useApi, useReveal (animação ao rolar)
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
| `/entrar`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` | Autenticação (nome de usuário e senha) |
| `/privacidade` | Política de privacidade (LGPD) |
| `/minha-conta` (+ `/leitor`, `/biblioteca`, `/historico`, `/avaliacoes`, `/perfil`) | Área do leitor (exige login) |
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

- **Recuperação de senha:** contas novas não têm e-mail (minimização de dados), então só contas antigas e o admin
  com `ADMIN_EMAIL` recuperam a senha sozinhos; os demais pedem ajuda pelo WhatsApp.
- **Token no `localStorage`:** simples para o protótipo, mas vulnerável se houver XSS; a sessão pode ser revogada no
  servidor a qualquer momento.
- **Limite de login em memória:** os contadores valem por instância do backend e zeram ao reiniciar.
- **Tentativas anônimas do quiz** não são associadas à conta se a pessoa fizer login depois.
- **Contato:** o formulário apenas monta a mensagem e abre o WhatsApp.

## Roadmap

1. ~~Backend base: PostgreSQL local, Flyway, OpenAPI (Swagger), tratamento de erros, CORS.~~ ✅
2. ~~Catálogo: livros, autores e gêneros (modelagem, migrações, dados demonstrativos, API e telas).~~ ✅
3. ~~Quiz v2 no backend + motor de recomendação explicável (pesos configuráveis, justificativas, testes).~~ ✅
4. ~~Autenticação: cadastro, login, logout, recuperação de senha, papéis de usuário e administrador.~~ ✅
5. ~~Dashboard: biblioteca, favoritos, histórico, feedback de recomendações, assinatura demonstrativa persistida.~~ ✅
6. ~~Painel administrativo (etapa final; auditoria fora do escopo).~~ ✅

7. ~~Redesign da landing, login só com nome e senha (LGPD) e perfil do leitor.~~ ✅
