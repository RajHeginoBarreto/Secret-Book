# Editor de textos e fotos do site — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o admin edita pelo painel os textos e as fotos da landing e a foto dos autores; fotos vão para o Supabase Storage (ou para uma pasta local sem Supabase).

**Architecture:** tabela `site_content` (uma linha JSON por seção, só com o que foi alterado) validada por um record Java por seção; o frontend mescla com os padrões que hoje estão fixos nos componentes. Upload passa sempre pelo backend, por uma interface `MediaStorage` com implementação Supabase (REST) e local (disco).

**Tech Stack:** Spring Boot 4 (Java 21, JPA/Hibernate 7, Flyway, Bean Validation, `RestClient`, Jackson 3 `tools.jackson`), PostgreSQL 18 / Supabase, React 19 + TypeScript + Vite, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-28-editor-do-site-design.md`

## Global Constraints

- Textos de interface, mensagens de erro, comentários e nomes de commit em português, no estilo do código vizinho (tabs no Java, 2 espaços no TS, sem ponto e vírgula no TS).
- Limites: campos curtos (`eyebrow`, `kicker`, botões, itens de lista curtos, gêneros, `specs`) até 60; títulos até 120; textos e respostas até 600; `alt` até 150. `whatsappNumber`: só dígitos, 10–15.
- Foto = `{ "url": string, "alt": string }`; `alt` obrigatório quando há `url`.
- Upload: JPG, PNG, WebP; até 5 MB; tipo conferido pelos primeiros bytes.
- Bucket público `secret-book-media`; objetos em `site/<uuid>.<ext>`. Sem Supabase: pasta `MEDIA_LOCAL_DIR` (padrão `uploads`), servida em `/media/**`.
- Toda tabela nova recebe `enable row level security` na própria migração.
- `SUPABASE_SERVICE_KEY` nunca vai para o frontend nem para o git.
- Erros seguem o padrão Problem Details já existente (`ApiException`, lista `errors` por campo).

## Review Focus

- Arquivo HTML/SVG renomeado para `.jpg` → recusado com 400 (Task 2: teste `rejectsFileWhoseBytesAreNotAnImage`).
- Arquivo acima de 5 MB → 400 com "A foto deve ter no máximo 5 MB.", não 500 (Task 2: `rejectsFileOverFiveMegabytes`).
- Seção salva com foto apontando para outro domínio → 400 no campo da foto (Task 4: `rejectsPhotoFromOutsideStorage`).
- Conteúdo salvo antigo com campo que deixou de existir ou faltando campo novo → o site usa o padrão para o que falta e ignora o que sobra (Task 5: teste `mergeSection ignora campos desconhecidos e completa os ausentes`).
- Falha do Storage ao apagar a foto antiga → salvamento e "Restaurar padrão" concluem mesmo assim (Task 4: `restoreSucceedsWhenStorageDeleteFails`).

---

## Arquivos

Backend (`backend/src/main/java/br/com/secretbook/`):
- `content/SiteContent.java` — entidade da tabela `site_content`.
- `content/SiteContentRepository.java`
- `content/SiteSection.java` — enum das seções (`HERO("hero", HeroContent.class)` …), resolve slug → record.
- `content/sections/*.java` — `Photo`, `HeroContent`, `HowItWorksContent`, `ProductsContent`, `QuizCtaContent`, `ReaderProfileContent`, `FaqContent`, `ContactContent`.
- `content/SiteContentService.java`, `content/SiteContentController.java` (público), `content/AdminSiteContentController.java`.
- `media/MediaStorage.java`, `media/LocalMediaStorage.java`, `media/SupabaseMediaStorage.java`, `media/MediaConfig.java`, `media/ImageType.java`, `media/MediaController.java`, `media/MediaProperties.java`.
- Modificar: `catalog/Author.java`, `catalog/CatalogService.java`, `catalog/dto/AuthorDetail.java`, `admin/dto/AdminDtos.java`, `admin/AdminCatalogService.java`, `config/SecurityConfig.java`, `common/error/ApiExceptionHandler.java`, `resources/application.properties`.
- `resources/db/migration/V7__site_content.sql`

Frontend (`frontend/src/`):
- `content/siteDefaults.ts`, `content/siteContentTypes.ts`, `content/mergeSection.ts`, `content/SiteContentProvider.tsx`, `content/useSiteContent.ts`, `content/SitePhoto.tsx`.
- `api/client.ts` (+ `apiUpload`).
- `features/admin/content/AdminContentListPage.tsx`, `AdminContentSectionPage.tsx`, `sectionForms.tsx`, `fields/TextField.tsx`, `fields/ListEditor.tsx`, `fields/PhotoField.tsx`.
- Modificar: as seções em `features/landing/sections/`, `data/faq.ts` (vira padrão), `config/site.ts`, `components/layout/SiteFooter.tsx`, `features/admin/AdminLayout.tsx`, `features/admin/AdminAuthorsPage.tsx`, `features/admin/adminTypes.ts`, `features/catalog/AuthorPage.tsx`, `features/catalog/catalogTypes.ts`, `router.tsx`, `main.tsx` (provider).

---

### Task 1: Conteúdo por seção no backend (sem fotos ainda)

**Files:**
- Create: `V7__site_content.sql`, `content/SiteContent.java`, `content/SiteContentRepository.java`, `content/SiteSection.java`, `content/sections/*.java`, `content/SiteContentService.java`, `content/SiteContentController.java`, `content/AdminSiteContentController.java`
- Modify: `config/SecurityConfig.java` (GET `/api/site-content` público)
- Test: `backend/src/test/java/br/com/secretbook/content/SiteContentApiTest.java` (estende `IntegrationTest`)

**Interfaces:**
- Produces: `GET /api/site-content` → `Map<String, JsonNode>`; `PUT /api/admin/site-content/{section}` (corpo = JSON da seção, devolve o salvo); `DELETE /api/admin/site-content/{section}` → 204.
- Produces: `record Photo(@Size(max=500) String url, @Size(max=150) String alt)` com validação de classe "alt obrigatório quando há url" (mensagem do campo `alt`: "é obrigatório quando há foto").
- Produces: `SiteContentService.save(SiteSection, JsonNode, AuthenticatedUser) : JsonNode`, `restore(SiteSection)`, `findAll() : Map<String, JsonNode>`; `SiteSection.fromSlug(String) : SiteSection` (lança `ResourceNotFoundException("Seção não encontrada.")`).

Migração exatamente como na spec (tabela `site_content` + RLS + `author.photo_url`). A coluna `content` é mapeada como `String` com `@JdbcTypeCode(SqlTypes.JSON)`.

Campos dos records (todos opcionais, `null` = usar padrão do frontend; listas fixas validadas com `@Size(min, max)`):
- `HeroContent(eyebrow, title, lead, primaryCta, secondaryCta, note, signTitle, signPrice, signNote, List<String> genres @Size(min=3,max=20), Photo photo)`
- `HowItWorksContent(eyebrow, title, description, posterTitle, posterSubtitle, posterFooter, List<Step> steps @Size(min=3,max=3))`, `Step(title, text, Photo photo)`
- `ProductsContent(eyebrow, title, description, List<Card> cards @Size(min=4,max=4))`, `Card(kicker, title, text, List<String> specs @Size(max=5), Photo photo)`
- `QuizCtaContent(eyebrow, title, description, Photo photo)`, `ReaderProfileContent(eyebrow, title, description, Photo photo)`
- `FaqContent(eyebrow, title, List<Item> items @Size(min=1,max=20))`, `Item(@NotBlank question, @NotBlank answer)`
- `ContactContent(eyebrow, title, description, @Pattern("\\d{10,15}") whatsappNumber, footerTagline)`

Conversão: `JsonMapper` com `FAIL_ON_UNKNOWN_PROPERTIES` ligado → record → `Validator`; violações viram `FieldViolation` com o caminho (`steps[1].title`). Campo desconhecido → 400 com `errors[0].field` = nome do campo e mensagem "campo desconhecido".

- [ ] **Step 1: Testes que falham** em `SiteContentApiTest`:
  - `getReturnsEmptyObjectWhenNothingSaved` — `GET /api/site-content` anônimo → 200, `$` é `{}`.
  - `adminSavesAndPublicReadsSection` — `PUT /api/admin/site-content/hero` com `{"title":"Novo título"}` → 200; `GET` → `$.hero.title == "Novo título"`.
  - `rejectsTitleOver120Chars` — título com 121 caracteres → 400, `$.errors[0].field == "title"`.
  - `rejectsUnknownField` — `{"titulo":"x"}` → 400.
  - `rejectsUnknownSection` — `PUT .../site-content/rodape` → 404.
  - `faqNeedsAtLeastOneItem` — `{"items":[]}` → 400, campo `items`.
  - `photoWithoutAltIsRejected` — `{"photo":{"url":"/media/site/a.jpg","alt":""}}` → 400, campo `photo.alt`.
  - `restoreRemovesSection` — salva e `DELETE` → 204; `GET` não tem `hero`.
  - `readerCannotEdit` — token de leitor → 403; anônimo → 401.
- [ ] **Step 2:** `./mvnw test -Dtest=SiteContentApiTest` → falha (rotas não existem).
- [ ] **Step 3:** Implementar migração, entidade, enum, records, serviço e controllers.
- [ ] **Step 4:** `./mvnw test -Dtest=SiteContentApiTest` → PASS; `./mvnw test` → tudo verde.
- [ ] **Step 5:** Commit `Adiciona o conteúdo editável por seção do site (backend)`.

### Task 2: Upload de fotos com armazenamento local

**Files:**
- Create: `media/MediaStorage.java`, `media/LocalMediaStorage.java`, `media/ImageType.java`, `media/MediaController.java`, `media/MediaProperties.java`, `media/MediaConfig.java`
- Modify: `config/SecurityConfig.java` (GET `/media/**` público; `/api/admin/media` já coberto por `/api/admin/**`), `common/error/ApiExceptionHandler.java` (`MaxUploadSizeExceededException` → 400 "A foto deve ter no máximo 5 MB."), `application.properties` (`spring.servlet.multipart.max-file-size=5MB`, `max-request-size=6MB`, `secretbook.media.local-dir=${MEDIA_LOCAL_DIR:uploads}`), `.gitignore` (`backend/uploads/`)
- Test: `backend/src/test/java/br/com/secretbook/media/MediaApiTest.java`, `media/ImageTypeTest.java`

**Interfaces:**
- Produces:
  ```java
  public interface MediaStorage {
      String store(byte[] bytes, ImageType type);   // devolve a URL pública
      void delete(String url);                       // ignora URL que não é sua
      boolean owns(String url);                      // a URL é deste armazenamento?
  }
  public enum ImageType { JPEG("jpg","image/jpeg"), PNG("png","image/png"), WEBP("webp","image/webp");
      public static Optional<ImageType> detect(byte[] bytes) }
  ```
- Produces: `POST /api/admin/media` (multipart `file`) → 201 `{"url": "..."}`. Local: URL `/media/site/<uuid>.<ext>`.

`detect` usa os números mágicos: JPEG `FF D8 FF`; PNG `89 50 4E 47 0D 0A 1A 0A`; WebP `RIFF????WEBP`. `MediaConfig` cria `LocalMediaStorage` quando não há `secretbook.media.supabase-url` (Task 3 acrescenta o outro ramo). Nos testes, `MEDIA_LOCAL_DIR` aponta para um diretório temporário (`@TempDir` via `@DynamicPropertySource`).

- [ ] **Step 1: Testes que falham:**
  - `ImageTypeTest`: bytes de JPEG/PNG/WebP reconhecidos; `"<svg"` e `"<html"` → `Optional.empty()`.
  - `MediaApiTest.adminUploadsJpegAndItIsServed` — upload de um JPEG mínimo → 201, `$.url` começa com `/media/site/` e termina em `.jpg`; `GET` nessa URL anônimo → 200 com `Content-Type: image/jpeg`.
  - `rejectsFileWhoseBytesAreNotAnImage` — arquivo `foto.jpg` com conteúdo `<svg>` → 400 "Envie uma foto JPG, PNG ou WebP."
  - `rejectsFileOverFiveMegabytes` — 5 MB + 1 byte → 400 com a mensagem dos 5 MB.
  - `readerCannotUpload` → 403.
- [ ] **Step 2:** `./mvnw test -Dtest='MediaApiTest,ImageTypeTest'` → falha.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Mesmo comando → PASS; `./mvnw test` → verde.
- [ ] **Step 5:** Commit `Adiciona o envio de fotos pelo painel com armazenamento local`.

### Task 3: Armazenamento no Supabase Storage

**Files:**
- Create: `media/SupabaseMediaStorage.java`
- Modify: `media/MediaConfig.java`, `media/MediaProperties.java`, `application.properties` (`secretbook.media.supabase-url=${SUPABASE_URL:}`, `secretbook.media.supabase-key=${SUPABASE_SERVICE_KEY:}`, `secretbook.media.bucket=secret-book-media`)
- Test: `backend/src/test/java/br/com/secretbook/media/SupabaseMediaStorageTest.java` (unitário, `MockRestServiceServer` sobre o `RestClient.Builder`)

**Interfaces:**
- Consumes: `MediaStorage`, `ImageType` (Task 2).
- Produces: `SupabaseMediaStorage(RestClient.Builder, String baseUrl, String serviceKey, String bucket)` + `ensureBucket()` chamado na inicialização.

Chamadas REST (cabeçalhos `Authorization: Bearer <key>` e `apikey: <key>`):
- `GET {base}/storage/v1/bucket/{bucket}`; se 404/400 → `POST {base}/storage/v1/bucket` com `{"id":bucket,"name":bucket,"public":true}`.
- `POST {base}/storage/v1/object/{bucket}/site/<uuid>.<ext>` com o `Content-Type` da imagem.
- URL pública: `{base}/storage/v1/object/public/{bucket}/site/<uuid>.<ext>`; `owns` = começa com `{base}/storage/v1/object/public/{bucket}/`.
- `delete`: `DELETE {base}/storage/v1/object/{bucket}/<caminho>`.
- Falha de rede ou 5xx no `store` → `ApiException(SERVICE_UNAVAILABLE, "Armazenamento indisponível", "Não foi possível enviar a foto agora. Tente de novo em instantes.")`.

- [ ] **Step 1: Testes que falham:** `storeUploadsAndReturnsPublicUrl` (confere método, caminho, cabeçalhos e URL devolvida); `ensureBucketCreatesWhenMissing`; `ensureBucketSkipsWhenPresent`; `deleteRemovesObject`; `deleteIgnoresForeignUrl` (nenhuma requisição); `storeFailureBecomes503`.
- [ ] **Step 2:** `./mvnw test -Dtest=SupabaseMediaStorageTest` → falha.
- [ ] **Step 3:** Implementar e ligar em `MediaConfig` (Supabase quando URL e chave estão preenchidas; senão local; log informando qual está ativo).
- [ ] **Step 4:** Mesmo comando → PASS; `./mvnw test` → verde.
- [ ] **Step 5:** Commit `Guarda as fotos no Supabase Storage quando configurado`.

### Task 4: Fotos nas seções e nos autores (backend)

**Files:**
- Modify: `content/SiteContentService.java`, `catalog/Author.java` (`photoUrl`), `catalog/dto/AuthorDetail.java` (+ `String photoUrl`), `catalog/CatalogService.java`, `admin/dto/AdminDtos.java` (`AuthorRequest` + `@Size(max=500) String photoUrl`; `AuthorRow` + `photoUrl`), `admin/AdminCatalogService.java`
- Test: `SiteContentApiTest.java`, `backend/src/test/java/br/com/secretbook/admin/AdminApiTest.java`

**Interfaces:**
- Consumes: `MediaStorage.owns/delete` (Task 2).
- Produces: `AuthorDetail(slug, name, bio, photoUrl, books)`; `AuthorRow(id, slug, name, bio, photoUrl, bookCount)`.

Regras: toda URL de foto recebida (seções e autor) precisa de `mediaStorage.owns(url)`, senão 400 no campo ("a foto precisa ser enviada pelo painel"). Ao salvar ou restaurar, as URLs que existiam antes e não existem mais são apagadas com `mediaStorage.delete` **depois** do commit (`TransactionSynchronization.afterCommit`); exceção ao apagar → `log.warn`, sem propagar. Ao excluir um autor, a foto dele também é apagada.

- [ ] **Step 1: Testes que falham:**
  - `rejectsPhotoFromOutsideStorage` — `{"photo":{"url":"https://exemplo.com/a.jpg","alt":"x"}}` → 400, campo `photo.url`.
  - `replacingPhotoDeletesOldOne` — com um `MediaStorage` espião (`@MockitoSpyBean`), salvar hero com foto A, depois com foto B → `delete(A)` chamado. Como a base de teste roda em transação desfeita e a limpeza acontece no `afterCommit`, depois do segundo `PUT` chame `TestTransaction.flagForCommit(); TestTransaction.end();`, verifique o `delete(A)` e, numa nova transação (`TestTransaction.start()`), apague a linha `hero` e o admin criado para não sujar os outros testes.
  - `restoreSucceedsWhenStorageDeleteFails` — `delete` lança `RuntimeException` → `DELETE` ainda devolve 204.
  - Em `AdminApiTest`: `authorPhotoIsSavedAndPublished` — `PUT /api/admin/authors/{id}` com `photoUrl` local → `GET /api/authors/{slug}` tem `$.photoUrl`.
- [ ] **Step 2:** `./mvnw test -Dtest='SiteContentApiTest,AdminApiTest'` → falha.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `./mvnw test` → verde.
- [ ] **Step 5:** Commit `Valida e limpa as fotos das seções e adiciona a foto do autor`.

### Task 5: Landing lendo o conteúdo editável

**Files:**
- Create: `content/siteContentTypes.ts`, `content/siteDefaults.ts`, `content/mergeSection.ts`, `content/SiteContentProvider.tsx`, `content/useSiteContent.ts`, `content/SitePhoto.tsx`
- Modify: todas as seções de `features/landing/sections/`, `data/faq.ts` (o `FAQ` atual passa a ser `SITE_DEFAULTS.faq.items`), `config/site.ts` (`whatsappNumber` padrão vai para `SITE_DEFAULTS.contact`; `buildWhatsAppUrl(number, message?)`), `components/layout/SiteFooter.tsx`, `components/layout/WhatsAppButton.tsx`, `main.tsx`
- Test: `content/mergeSection.test.ts`, `features/landing/LandingPage.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface SitePhotoValue { url: string; alt: string }
  export type SectionKey = 'hero' | 'how-it-works' | 'products' | 'quiz-cta' | 'reader-profile' | 'faq' | 'contact'
  export interface SiteContentMap { hero: HeroContent; 'how-it-works': HowItWorksContent; ... }  // campos da spec
  export const SITE_DEFAULTS: SiteContentMap
  export function mergeSection<K extends SectionKey>(key: K, saved: unknown): SiteContentMap[K]
  export function useSiteContent<K extends SectionKey>(key: K): SiteContentMap[K]
  export function SitePhoto(props: { photo?: SitePhotoValue | null; fallback: ReactNode; className?: string }): ReactNode
  ```

`SITE_DEFAULTS` recebe **exatamente** os textos que hoje estão nos componentes (copiar, não reescrever). `mergeSection`: para cada campo do padrão, usa o valor salvo se tiver o mesmo tipo (string não vazia, array, objeto foto com `url`); listas salvas substituem a lista inteira; campos salvos que não existem no padrão são ignorados. O provider faz um único `apiRequest('/api/site-content')` e, em erro, fica com `{}`. `SitePhoto` mostra `<img src alt loading="lazy">` quando há `url`, senão o `fallback` (a ilustração atual).

- [ ] **Step 1: Testes que falham:**
  - `mergeSection devolve o padrão quando nada foi salvo`.
  - `mergeSection usa o título salvo e mantém o resto do padrão`.
  - `mergeSection ignora campos desconhecidos e completa os ausentes` — salvo `{ titulo: 'x', title: 7 }` → igual ao padrão.
  - `mergeSection troca a lista inteira do FAQ`.
  - `LandingPage` com `GET /api/site-content` devolvendo `{ hero: { title: 'Título do admin', photo: { url: '/media/site/a.jpg', alt: 'Estande' } } }` → mostra "Título do admin" e `img` com nome "Estande".
  - `LandingPage` com `GET /api/site-content` em 500 → mostra o título padrão "Livros surpresa que combinam com você".
- [ ] **Step 2:** `npm --prefix frontend test -- content landing` → falha.
- [ ] **Step 3:** Implementar e trocar os textos fixos das seções por `useSiteContent`. Onde a seção tem ilustração, envolver com `SitePhoto` (hero: pacotes; produtos: `stage` de cada card; quiz: pacote; perfil: arte da seção; como funciona: foto opcional acima do título de cada passo).
- [ ] **Step 4:** `npm --prefix frontend test`, `npm --prefix frontend run lint`, `npm --prefix frontend run typecheck` → verdes. Conferir a landing no navegador (sem conteúdo salvo deve ficar idêntica à de hoje).
- [ ] **Step 5:** Commit `Faz a landing ler os textos e fotos editáveis`.

### Task 6: Aba "Conteúdo do site" no painel

**Files:**
- Create: `features/admin/content/AdminContentListPage.tsx`, `AdminContentSectionPage.tsx`, `sectionForms.tsx`, `fields/TextField.tsx`, `fields/ListEditor.tsx`, `fields/PhotoField.tsx`, `features/admin/content/Content.module.css`
- Modify: `api/client.ts` (+ `apiUpload`), `features/admin/AdminLayout.tsx` (item `{ to: '/admin/conteudo', label: 'Conteúdo do site' }` depois de "Visão geral"), `router.tsx` (`conteudo`, `conteudo/:section`), `test/mockApi.ts` (aceitar `FormData` no corpo)
- Test: `features/admin/content/AdminContent.test.tsx`

**Interfaces:**
- Consumes: `SITE_DEFAULTS`, `mergeSection`, tipos da Task 5; API das Tasks 1–2.
- Produces:
  ```ts
  export async function apiUpload<T>(path: string, file: File): Promise<T>   // multipart "file", mesmo tratamento de erro do apiRequest
  TextField(props: { label: string; value: string; max: number; multiline?: boolean; error?: string; onChange(v: string): void })
  ListEditor<T>(props: { items: T[]; fixedLength?: boolean; min?: number; max?: number; newItem?: () => T; render(item: T, index: number, set: (v: T) => void): ReactNode; onChange(items: T[]): void })
  PhotoField(props: { label: string; value: SitePhotoValue | null; error?: string; onChange(v: SitePhotoValue | null): void })
  ```

A página da seção carrega `GET /api/site-content`, monta o formulário a partir de `mergeSection` (o admin vê o texto que está no ar), envia a seção inteira no `PUT` e mostra erros por campo com `fieldErrorsOf`. "Restaurar padrão" usa `window.confirm` e `DELETE`. `PhotoField` envia com `apiUpload('/api/admin/media', file)`, mostra prévia e o erro da API; "Remover" limpa o valor. Limites e tamanhos de lista vêm da spec (Global Constraints).

- [ ] **Step 1: Testes que falham:**
  - lista mostra as 7 seções com links.
  - editar o título do hero e salvar envia `PUT /api/admin/site-content/hero` com `title` novo e mostra "Alterações salvas".
  - erro 400 com `errors: [{ field: 'title', message: 'deve ter no máximo 120 caracteres' }]` aparece junto do campo.
  - FAQ: "Adicionar pergunta" acrescenta item; remover não deixa ficar com 0.
  - `PhotoField`: escolher arquivo chama `POST /api/admin/media` e mostra a prévia; erro 400 mostra a mensagem.
  - "Restaurar padrão" confirmado envia `DELETE`.
- [ ] **Step 2:** `npm --prefix frontend test -- AdminContent` → falha.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** testes, lint e typecheck verdes.
- [ ] **Step 5:** Commit `Adiciona a aba Conteúdo do site ao painel`.

### Task 7: Foto dos autores no painel e na página do autor

**Files:**
- Modify: `features/admin/AdminAuthorsPage.tsx`, `features/admin/adminTypes.ts` (`AdminAuthor.photoUrl: string | null`), `features/catalog/AuthorPage.tsx`, `features/catalog/catalogTypes.ts` (`AuthorDetail.photoUrl: string | null`)
- Test: `features/admin/Admin.test.tsx`, `features/catalog/Catalog.test.tsx`

**Interfaces:**
- Consumes: `PhotoField` (Task 6; aqui o `alt` é o nome do autor, então usar o modo sem campo de texto alternativo: prop `hideAlt` que preenche `alt` com o nome), API da Task 4.

- [ ] **Step 1: Testes que falham:** salvar autor com foto envia `photoUrl`; página do autor com `photoUrl` mostra `img` com nome do autor; sem `photoUrl` não mostra `img`.
- [ ] **Step 2:** `npm --prefix frontend test -- Admin Catalog` → falha.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** testes, lint e typecheck verdes.
- [ ] **Step 5:** Commit `Adiciona a foto dos autores`.

### Task 8: Documentação e verificação final

**Files:**
- Modify: `README.md` (variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MEDIA_LOCAL_DIR`; rota `/admin/conteudo`; onde achar a chave secreta; `V7` na lista de migrações; seção da API com as rotas novas)

- [ ] **Step 1:** Atualizar o README.
- [ ] **Step 2:** `./mvnw test` e `npm --prefix frontend test && npm --prefix frontend run lint && npm --prefix frontend run build` → verdes.
- [ ] **Step 3:** Verificação manual com o backend apontando para o Supabase e `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` no `.env.local`: trocar título e foto do hero, um item do FAQ e a foto de um autor; conferir no site, no Table Editor (`site_content`) e no bucket `secret-book-media`; "Restaurar padrão" volta ao texto original e apaga a foto do bucket.
- [ ] **Step 4:** Commit `Documenta o editor do site`.
