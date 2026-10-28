# Editor de textos e fotos do site — design

Data: 2026-10-28 · Status: aguardando revisão

## Objetivo

O administrador altera, pelo painel (`/admin`), os textos e as fotos da landing e a foto de cada autor, sem mexer
no código e sem novo deploy. As fotos ficam no Supabase Storage do projeto pessoal do dono do site.

**Sucesso:** o admin troca um título, um item do FAQ ou a foto de uma seção, clica em "Salvar" e a mudança aparece
para os visitantes ao recarregar a página. Se nada for editado, ou se a API falhar, o site continua exatamente como
hoje.

## Fora do escopo

- Planos (textos e preços): ligados à tela de assinatura e ao checkout de demonstração; etapa própria.
- Logo do site.
- Textos de validação e erro do formulário de contato.
- Estante do leitor "tipo Skoob" (livros fora do catálogo, fotos do leitor): projeto 2, com especificação própria.
  Ele reaproveita o `MediaStorage` definido aqui.

## Modelo de conteúdo

Uma linha por seção na tabela `site_content`. O JSON guarda **só o que o admin alterou**; o frontend mescla com os
padrões do código. Toda foto é opcional: sem foto, aparece a ilustração atual.

Uma foto é sempre o objeto `{ "url": string, "alt": string }`; `alt` é obrigatório quando há `url`.

| Seção (`section`) | Campos de texto | Listas | Fotos |
|---|---|---|---|
| `hero` | `eyebrow`, `title`, `lead`, `primaryCta`, `secondaryCta`, `note`, `signTitle`, `signPrice`, `signNote` | `genres` (texto curto, 3–20 itens) | `photo` (substitui os pacotes ilustrados) |
| `how-it-works` | `eyebrow`, `title`, `description`, `posterTitle`, `posterSubtitle`, `posterFooter` | `steps` (exatamente 3: `title`, `text`, `photo?`) | uma por passo |
| `products` | `eyebrow`, `title`, `description` | `cards` (exatamente 4: `kicker`, `title`, `text`, `specs[]` até 5) | uma por card |
| `quiz-cta` | `eyebrow`, `title`, `description` | — | `photo` (substitui o pacote) |
| `reader-profile` | `eyebrow`, `title`, `description` | — | `photo` |
| `faq` | `eyebrow`, `title` | `items` (1–20: `question`, `answer`) | — |
| `contact` | `eyebrow`, `title`, `description`, `whatsappNumber` (só dígitos, 10–15), `footerTagline` | — | — |

Os nomes exatos de campo seguem os textos que existem hoje em cada componente; ao implementar, cada texto fixo da
seção vira um campo com o mesmo conteúdo como padrão.

**Limites:** campos curtos (`eyebrow`, `kicker`, botões, itens de lista curtos) até 60 caracteres; títulos até 120;
textos e respostas até 600; `alt` até 150. Listas de tamanho fixo (passos, cards) não permitem adicionar ou
remover, só reordenar e editar.

Autores: nova coluna `author.photo_url` (`varchar(500)`, nula). O texto alternativo é o nome do autor.

## Backend

### Banco (`V7__site_content.sql`)

```sql
create table site_content (
    section    varchar(40) primary key,
    content    jsonb       not null,
    updated_at timestamptz not null default now(),
    updated_by bigint      references app_user (id) on delete set null
);
alter table site_content enable row level security;
alter table author add column photo_url varchar(500);
```

### API

| Método e rota | Acesso | O que faz |
|---|---|---|
| `GET /api/site-content` | público | `{ "<section>": { ...content } }` com todas as seções salvas |
| `PUT /api/admin/site-content/{section}` | admin | valida e grava a seção inteira (substitui); 404 para seção desconhecida |
| `DELETE /api/admin/site-content/{section}` | admin | "Restaurar padrão": apaga a linha e as fotos dela |
| `POST /api/admin/media` (multipart `file`) | admin | grava a foto e devolve `{ "url": "..." }` |
| `PUT /api/admin/authors/{id}` | admin | passa a aceitar `photoUrl` (já existe) |

O `GET /api/authors/{slug}` e as listas de autores passam a devolver `photoUrl`.

**Validação:** cada seção tem um record Java (`HeroContent`, `FaqContent`…) com Bean Validation. O `PUT` converte o
JSON para o record da seção; campos desconhecidos são rejeitados (400 com a lista `errors`, no padrão do projeto).
URLs de foto só são aceitas se forem do próprio armazenamento (prefixo da URL pública do bucket ou `/media/`), para
o admin não apontar para imagens de terceiros por engano.

### Fotos: `MediaStorage`

Interface com `store(bytes, contentType) → url` e `delete(url)`. Duas implementações, escolhidas pela configuração:

- **`SupabaseMediaStorage`** — ativa quando `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` estão definidas. Usa a API REST
  do Storage com `RestClient` (sem SDK novo). Na subida, cria o bucket público `secret-book-media` se ele não
  existir. Nome do arquivo: `site/<uuid>.<ext>`.
- **`LocalMediaStorage`** — padrão sem Supabase. Grava em `backend/uploads` (ignorado pelo git) e serve em
  `GET /media/**` (público, cache longo).

**Upload:** aceita JPG, PNG e WebP até 5 MB (`spring.servlet.multipart.max-file-size=5MB`). O tipo é conferido
pelos primeiros bytes do arquivo, não pela extensão. Ao salvar uma seção ou autor, as fotos que deixaram de ser
usadas são apagadas do armazenamento; falha ao apagar só gera aviso no log (não impede o salvamento).

### Configuração nova

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | `https://<id>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | chave secreta (Project Settings → API Keys → secret/service_role). Só no backend. |
| `MEDIA_LOCAL_DIR` | pasta das fotos sem Supabase (padrão `uploads`) |

## Frontend

- `src/content/siteDefaults.ts`: os textos atuais de cada seção, tipados por seção (`HeroContent` etc.).
- `src/content/SiteContentProvider.tsx` + `useSiteContent(section)`: busca `GET /api/site-content` uma vez por
  carregamento, mescla com os padrões (campo a campo; listas salvas substituem a lista padrão inteira) e devolve o
  conteúdo da seção. Enquanto carrega ou se a chamada falhar, devolve os padrões — o site nunca fica em branco.
- As seções da landing, o `FAQ` e o `SITE.whatsappNumber` passam a ler de `useSiteContent`. Onde houver foto, a
  ilustração é trocada por `<img>` com `alt`, `loading="lazy"` e o mesmo enquadramento do espaço da ilustração.
- **Painel:** nova aba "Conteúdo do site" (`/admin/conteudo`) com a lista de seções e `/admin/conteudo/:section`
  com o formulário. Componentes reutilizáveis: `TextField` com contador, `ListEditor` (adicionar, remover,
  subir/descer, respeitando tamanhos fixos) e `PhotoField` (prévia, "Trocar foto", "Remover", campo de texto
  alternativo, progresso do envio). Botões "Salvar" e "Restaurar padrão" (com confirmação).
- Formulário de autor ganha `PhotoField`; a página do autor mostra a foto quando houver.

## Erros

- Foto inválida, de outro tipo ou acima de 5 MB: 400 com mensagem em português, mostrada no `PhotoField`.
- Supabase indisponível no envio: 503 "Não foi possível enviar a foto agora"; o formulário mantém o que foi digitado.
- Campos inválidos: 400 com `errors` por campo, exibidos ao lado de cada campo (padrão de `formErrors.ts`).
- Visitante: falha em `GET /api/site-content` é silenciosa (usa padrões).

## Testes

- Backend (integração, `IntegrationTest`): salvar e ler seção; validação de limites e de seção desconhecida;
  restaurar padrão; acesso negado para leitor e anônimo; upload aceito e recusado (tipo, tamanho, bytes falsos) com
  `LocalMediaStorage`; foto antiga apagada ao trocar; `photoUrl` do autor.
- Backend (unitário): `SupabaseMediaStorage` contra um servidor HTTP simulado (upload, delete, criação do bucket).
- Frontend (Vitest): mescla de padrões com conteúdo salvo e com falha da API; formulário de seção (editar, salvar,
  erros por campo, restaurar); `PhotoField` (envio, erro, remover); landing renderizando foto quando há `url`.
- Manual: trocar textos e fotos de cada seção com o Supabase ligado e conferir no site e no bucket.
