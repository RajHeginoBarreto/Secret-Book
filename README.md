# Secret Book

Plataforma de descoberta literária que simula um clube de assinatura de livros surpresa: o leitor responde a um
quiz, recebe um perfil literário e descobre livros "às cegas", guiado por pistas.

> **Protótipo de portfólio.** Planos, valores, depoimentos e assinaturas são demonstrativos. Nenhum pagamento é
> processado.

## Estado atual

| Parte | Situação |
|---|---|
| `frontend/` (React + TypeScript) | ✅ Landing completa, quiz v1, simulação de assinatura, 404. Sem backend ainda. |
| `backend/` (Spring Boot) | 🟡 Base pronta: PostgreSQL local, Flyway, Swagger, erros padronizados, CORS e segurança base. Sem endpoints de negócio ainda. |
| Arquivos na raiz (`index.html`, `Quiz.html`, `estilo.css`, `img/`) | 📦 Site estático original, mantido como referência até a nova versão ser aprovada. |

## Tecnologias

**Frontend**: React 19, TypeScript 6 (modo estrito), Vite 8, React Router 8, CSS Modules, Lucide (ícones),
Vitest + Testing Library (testes).

**Backend**: Java 21, Spring Boot 4.1, Spring Web MVC, Spring Data JPA, Bean Validation, Spring Security,
Flyway, PostgreSQL 18, springdoc-openapi (Swagger), Actuator, Testcontainers. O Maven vem pelo Maven Wrapper
(`mvnw`), sem instalação global.

## Pré-requisitos

- Node.js 22+ e npm
- JDK 21 (ex.: Eclipse Temurin 21). Confira com `java -version`.
- Docker Desktop **em execução** (usado pelos testes do backend)

## Como rodar

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm test` | Roda todos os testes uma vez |
| `npm run test:watch` | Testes em modo observação |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos do TypeScript |
| `npm run build` | Typecheck + build de produção em `frontend/dist` |

### Backend

```bash
cd backend
docker compose up -d       # PostgreSQL local na porta 5433
./mvnw spring-boot:run     # Windows: mvnw.cmd spring-boot:run  →  http://localhost:8080
```

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

**Variáveis de ambiente** (todas opcionais em desenvolvimento; os valores padrão batem com o `compose.yaml`):

| Variável | Padrão | Uso |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/secretbook` | Endereço do banco |
| `DB_USERNAME` / `DB_PASSWORD` | `secretbook` / `secretbook` | Credenciais do banco (só para uso local) |
| `DB_PORT` | `5433` | Porta do host usada pelo `compose.yaml` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens do frontend autorizadas, separadas por vírgula |
| `PORT` | `8080` | Porta HTTP da API |

> A porta do banco é **5433**, e não 5432, para não conflitar com um PostgreSQL já instalado na máquina.

## Backend: convenções

- **Migrações**: o esquema do banco é criado só pelo Flyway, em `backend/src/main/resources/db/migration`
  (`V1__descricao.sql`, `V2__...`). O Hibernate apenas valida (`ddl-auto=validate`). Enquanto não houver migrações,
  o Flyway avisa "No migrations found" no log; isso é esperado até a etapa do catálogo.
- **Erros**: todas as respostas de erro seguem o padrão [Problem Details (RFC 9457)](https://www.rfc-editor.org/rfc/rfc9457),
  com `Content-Type: application/problem+json` e textos em português. Erros de validação trazem a lista `errors`:

  ```json
  {
    "status": 400,
    "title": "Dados inválidos",
    "detail": "Um ou mais campos estão inválidos.",
    "instance": "/api/...",
    "errors": [{ "field": "title", "message": "é obrigatório" }]
  }
  ```

  Para "não encontrado", lance `ResourceNotFoundException` com a mensagem a exibir. Erros inesperados viram 500 com
  mensagem genérica; o detalhe técnico vai só para o log. Os textos dos erros padrão do Spring ficam em
  `messages.properties`.
- **Segurança**: sem sessão nem login por enquanto. Tudo sob `/api/**`, o Swagger e o health são públicos; qualquer
  outro caminho é negado (403). A autenticação real chega na etapa 4.
- **CORS**: liberado apenas para `/api/**` e para as origens de `CORS_ALLOWED_ORIGINS`.

## Estrutura do frontend

```
frontend/src/
├── components/
│   ├── layout/        # cabeçalho (com menu mobile), rodapé, layout raiz, botão do WhatsApp
│   └── ui/            # Button, SectionHeader: peças reutilizáveis do design system
├── config/site.ts     # dados públicos do site (nome, WhatsApp)
├── data/              # planos, FAQ e depoimentos demonstrativos
├── features/
│   ├── landing/       # landing page, dividida em uma seção por arquivo
│   ├── quiz/          # quizData (perguntas), quizEngine (cálculo), quizStorage (progresso), telas
│   ├── plans/         # simulação de assinatura
│   └── misc/          # 404
├── hooks/             # usePageTitle
├── styles/            # tokens.css (paleta, tipografia, sombras) e global.css
├── test/              # setup dos testes e helper renderRoute
├── router.tsx         # tabela de rotas
└── main.tsx           # ponto de entrada
```

### Rotas

| Rota | Página |
|---|---|
| `/` | Landing page (âncoras: `#como-funciona`, `#pistas`, `#caixa`, `#descobertas`, `#beneficios`, `#planos`, `#depoimentos`, `#faq`, `#contato`) |
| `/quiz` | Quiz literário v1 |
| `/assinar/:planSlug` | Simulação de assinatura (`leitor-casual`, `leitor-avido`, `maratona-literaria`) |
| qualquer outra | Página 404 |

## Como o perfil do quiz é calculado (v1)

A regra é a mesma do `Quiz.html` original, agora isolada em `quizEngine.ts` e coberta por testes:

1. Cada uma das 6 respostas soma **1 ponto** ao gênero da opção escolhida (mistério, romance, fantasia ou ficção
   científica).
2. Os gêneros são ordenados por pontos. **Empate**: vence o gênero escolhido mais recentemente, porque as últimas
   perguntas falam mais do livro em si.
3. Se o 2º gênero tiver **2 pontos ou mais**, o perfil combina os dois primeiros (ex.: fantasia + romance =
   "Romantasia"). Caso contrário, o perfil é o gênero principal puro.
4. As barras de resultado mostram **quantas respostas** apontaram para cada gênero (ex.: "3 de 6"). Não é uma
   probabilidade nem um percentual de compatibilidade com livros.

O progresso fica salvo no `localStorage` do navegador (`secretbook:quiz-progress:v1`), o que permite retomar um quiz
interrompido. Dados corrompidos são descartados com segurança.

## Decisões desta etapa

- **Código em inglês, interface em português.** É o padrão de mercado e combina com os nomes das entidades
  planejadas (`Book`, `Author`, `QuizAttempt`).
- **CSS Modules + tokens.** A paleta do `estilo.css` original virou variáveis em `styles/tokens.css`, e cada
  componente tem seu `.module.css`, com nomes de classe isolados (sem conflitos).
- **Sem biblioteca de componentes.** Os elementos nativos (`<details>`, `<fieldset>`, rádios) já são acessíveis,
  e uma biblioteca adicionaria peso sem benefício real neste momento.
- **Dados ilustrativos sempre sinalizados.** Os pacotes de "Descobertas" e o cartão de pistas de exemplo não
  representam livros reais. O "livro do mês" com nota e páginas inventadas do quiz antigo foi removido.

## Limitações conhecidas

- **Logo pesado:** `frontend/src/assets/logo.svg` tem ~1,5 MB (um PNG 1536×1024 embutido num SVG, com fundo branco
  e paleta roxo/terracota). Recomendo substituir por uma versão vetorial ou otimizada.
- **Sem persistência no servidor:** quiz e simulação de assinatura não são salvos no backend (isso depende das
  etapas de backend e autenticação).
- **Quiz v1 é simples:** 6 perguntas e 4 gêneros, sem perguntas condicionais, temas a evitar, extensão ou idioma.
  Isso será substituído pelo quiz v2, servido pela API.
- **Contato:** o formulário apenas monta a mensagem e abre o WhatsApp. Nada passa por servidor próprio.

## Próximas etapas

1. ~~Backend base: configuração do PostgreSQL local, Flyway, OpenAPI (Swagger), tratamento de erros, CORS.~~ ✅
2. Catálogo: livros, autores e gêneros (modelagem, migrações, dados demonstrativos, API e telas).
3. Quiz v2 no backend + motor de recomendação explicável (pesos configuráveis, justificativas, testes).
4. Autenticação: cadastro, login, logout, recuperação de senha, papéis de usuário e administrador.
5. Dashboard: biblioteca, favoritos, histórico, feedback de recomendações, assinatura demonstrativa persistida.
6. Painel administrativo (etapa final; auditoria fora do escopo).
