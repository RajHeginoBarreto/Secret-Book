-- Quiz v2: perguntas servidas pela API, efeitos configuráveis por opção, perfis e histórico de tentativas.

create table quiz_question (
    id        bigint generated always as identity primary key,
    slug      varchar(60)  not null unique,
    position  integer      not null,
    text      varchar(300) not null,
    help_text varchar(300),
    multiple  boolean      not null default false,
    required  boolean      not null default true
);

create table quiz_option (
    id          bigint generated always as identity primary key,
    question_id bigint       not null references quiz_question (id) on delete cascade,
    slug        varchar(60)  not null,
    position    integer      not null,
    text        varchar(200) not null,
    -- Opção que não pode ser combinada com outras (ex.: "Nenhum" em uma pergunta de múltipla escolha).
    exclusive   boolean      not null default false,
    unique (question_id, slug)
);

-- Pergunta condicional: só aparece se esta opção (de uma pergunta anterior) foi escolhida.
alter table quiz_question add column condition_option_id bigint references quiz_option (id);

-- O que cada opção soma ao perfil do leitor. Os pesos podem ser ajustados sem mudar código.
create table quiz_option_effect (
    option_id bigint       not null references quiz_option (id) on delete cascade,
    dimension varchar(20)  not null check (dimension in ('GENRE', 'PACE', 'TONE', 'LENGTH', 'AVOID')),
    value     varchar(60)  not null,
    weight    numeric(4, 2) not null default 1 check (weight > 0),
    primary key (option_id, dimension, value)
);

-- Nome e descrição de cada perfil: um gênero ou a combinação de dois (slugs em ordem alfabética, unidos por "+").
create table quiz_profile (
    key         varchar(100) primary key,
    name        varchar(100) not null,
    description varchar(500) not null
);

-- Pesos do motor de recomendação (linha única, editável no painel administrativo).
create table recommendation_settings (
    id            integer      primary key check (id = 1),
    genre_weight  numeric(4, 2) not null check (genre_weight >= 0),
    pace_weight   numeric(4, 2) not null check (pace_weight >= 0),
    tone_weight   numeric(4, 2) not null check (tone_weight >= 0),
    length_weight numeric(4, 2) not null check (length_weight >= 0),
    max_results   integer      not null check (max_results between 1 and 12),
    mix_threshold numeric(4, 2) not null check (mix_threshold > 0),
    updated_at    timestamptz  not null default now(),
    check (genre_weight + pace_weight + tone_weight + length_weight > 0)
);

create table quiz_attempt (
    id             uuid         primary key,
    profile_key    varchar(100) not null,
    profile_name   varchar(100) not null,
    excluded_count integer      not null default 0,
    created_at     timestamptz  not null default now()
);
create index quiz_attempt_created_at_idx on quiz_attempt (created_at);

create table quiz_attempt_answer (
    attempt_id uuid   not null references quiz_attempt (id) on delete cascade,
    option_id  bigint not null references quiz_option (id),
    primary key (attempt_id, option_id)
);

create table quiz_attempt_recommendation (
    attempt_id uuid          not null references quiz_attempt (id) on delete cascade,
    position   integer       not null,
    book_id    bigint        not null references book (id),
    score      integer       not null check (score between 0 and 100),
    -- Nota (0 a 100) de cada critério, antes dos pesos.
    genre_match  integer     not null,
    pace_match   integer     not null,
    tone_match   integer     not null,
    length_match integer     not null,
    -- Justificativas exibidas ao leitor, uma por linha.
    reasons    varchar(2000) not null,
    primary key (attempt_id, position)
);
create index quiz_attempt_recommendation_book_idx on quiz_attempt_recommendation (book_id);

-- ===== Dados iniciais =====

insert into recommendation_settings (id, genre_weight, pace_weight, tone_weight, length_weight, max_results, mix_threshold)
values (1, 0.50, 0.15, 0.20, 0.15, 5, 2.00);

insert into quiz_question (slug, position, text, help_text, multiple, required) values
    ('noite-livre', 1, 'Em uma noite livre, o que você prefere fazer?', null, false, true),
    ('historia-que-prende', 2, 'Que tipo de história te prende mais?', null, false, true),
    ('tipo-de-magia', 3, 'Já que você gosta de magia: qual delas te encanta?', 'Esta pergunta aparece porque você escolheu mundos mágicos.', false, true),
    ('lugar', 4, 'Qual destes lugares você gostaria de visitar?', null, false, true),
    ('final', 5, 'Como você gosta que um livro termine?', null, false, true),
    ('ritmo', 6, 'Qual ritmo de leitura combina com você?', null, false, true),
    ('clima', 7, 'Que clima você quer sentir durante a leitura?', null, false, true),
    ('tamanho', 8, 'Quanto tempo você quer passar com o livro?', null, false, true),
    ('evitar', 9, 'Algum tema que você prefere evitar?', 'Pode marcar mais de um. Livros com esses temas não serão recomendados.', true, true);

insert into quiz_option (question_id, slug, position, text, exclusive)
select q.id, v.slug, v.position, v.text, v.exclusive
from (values
    ('noite-livre', 'investigacao', 1, 'Assistir a uma série de investigação', false),
    ('noite-livre', 'comedia-romantica', 2, 'Ver uma comédia romântica', false),
    ('noite-livre', 'aventura', 3, 'Jogar um RPG ou ver um filme de aventura', false),
    ('noite-livre', 'espaco', 4, 'Ver um documentário sobre o espaço', false),
    ('historia-que-prende', 'segredos', 1, 'Cheia de segredos e reviravoltas', false),
    ('historia-que-prende', 'emocoes', 2, 'Com personagens e emoções intensas', false),
    ('historia-que-prende', 'magia', 3, 'Em mundos mágicos e criaturas incríveis', false),
    ('historia-que-prende', 'futuro', 4, 'Sobre o futuro e a tecnologia', false),
    ('tipo-de-magia', 'epica', 1, 'Épica, com reinos, batalhas e grandes jornadas', false),
    ('tipo-de-magia', 'sombria', 2, 'Sombria, cheia de enigmas e segredos', false),
    ('tipo-de-magia', 'romantica', 3, 'Delicada, com um romance no caminho', false),
    ('tipo-de-magia', 'aconchegante', 4, 'Aconchegante e divertida', false),
    ('lugar', 'ilha', 1, 'Uma ilha isolada e misteriosa', false),
    ('lugar', 'europa', 2, 'Uma cidade charmosa na Europa', false),
    ('lugar', 'reino', 3, 'Um reino encantado', false),
    ('lugar', 'estacao-espacial', 4, 'Uma estação espacial', false),
    ('final', 'revelacao', 1, 'Com uma revelação que muda tudo', false),
    ('final', 'final-emocionante', 2, 'Com um final emocionante', false),
    ('final', 'batalha', 3, 'Com uma grande batalha vencida', false),
    ('final', 'ideia', 4, 'Com uma ideia que me faça pensar', false),
    ('ritmo', 'devagar', 1, 'Devagar, saboreando cada página', false),
    ('ritmo', 'equilibrado', 2, 'No meu tempo: um pouco de calma, um pouco de ação', false),
    ('ritmo', 'rapido', 3, 'Rápido: quero virar as páginas sem parar', false),
    ('clima', 'leve', 1, 'Leve e divertido', false),
    ('clima', 'emocionante', 2, 'Emoção à flor da pele', false),
    ('clima', 'sombrio', 3, 'Sombrio e cheio de tensão', false),
    ('clima', 'reflexivo', 4, 'Algo que me faça pensar', false),
    ('tamanho', 'curto', 1, 'Curtinho: menos de 250 páginas', false),
    ('tamanho', 'medio', 2, 'Médio: de 250 a 400 páginas', false),
    ('tamanho', 'longo', 3, 'Longo: quanto mais páginas, melhor', false),
    ('tamanho', 'tanto-faz', 4, 'Tanto faz', false),
    ('evitar', 'nenhum', 1, 'Nenhum, pode vir tudo', true),
    ('evitar', 'violencia', 2, 'Violência', false),
    ('evitar', 'luto', 3, 'Luto e perda', false),
    ('evitar', 'linguagem-forte', 4, 'Linguagem forte', false),
    ('evitar', 'sexo', 5, 'Cenas de sexo', false),
    ('evitar', 'terror', 6, 'Terror', false)
) as v (question_slug, slug, position, text, exclusive)
join quiz_question q on q.slug = v.question_slug;

update quiz_question
set condition_option_id = (
    select o.id from quiz_option o join quiz_question q on q.id = o.question_id
    where q.slug = 'historia-que-prende' and o.slug = 'magia')
where slug = 'tipo-de-magia';

insert into quiz_option_effect (option_id, dimension, value, weight)
select o.id, v.dimension, v.value, v.weight
from (values
    ('noite-livre', 'investigacao', 'GENRE', 'misterio', 1.00),
    ('noite-livre', 'comedia-romantica', 'GENRE', 'romance', 1.00),
    ('noite-livre', 'aventura', 'GENRE', 'fantasia', 1.00),
    ('noite-livre', 'espaco', 'GENRE', 'ficcao-cientifica', 1.00),
    ('historia-que-prende', 'segredos', 'GENRE', 'misterio', 1.00),
    ('historia-que-prende', 'emocoes', 'GENRE', 'romance', 1.00),
    ('historia-que-prende', 'magia', 'GENRE', 'fantasia', 1.00),
    ('historia-que-prende', 'futuro', 'GENRE', 'ficcao-cientifica', 1.00),
    ('tipo-de-magia', 'epica', 'GENRE', 'fantasia', 1.00),
    ('tipo-de-magia', 'epica', 'TONE', 'EMOTIONAL', 0.50),
    ('tipo-de-magia', 'sombria', 'GENRE', 'fantasia', 0.50),
    ('tipo-de-magia', 'sombria', 'GENRE', 'misterio', 1.00),
    ('tipo-de-magia', 'sombria', 'TONE', 'DARK', 0.50),
    ('tipo-de-magia', 'romantica', 'GENRE', 'fantasia', 0.50),
    ('tipo-de-magia', 'romantica', 'GENRE', 'romance', 1.00),
    ('tipo-de-magia', 'aconchegante', 'GENRE', 'fantasia', 1.00),
    ('tipo-de-magia', 'aconchegante', 'TONE', 'LIGHT', 0.50),
    ('lugar', 'ilha', 'GENRE', 'misterio', 1.00),
    ('lugar', 'europa', 'GENRE', 'romance', 1.00),
    ('lugar', 'reino', 'GENRE', 'fantasia', 1.00),
    ('lugar', 'estacao-espacial', 'GENRE', 'ficcao-cientifica', 1.00),
    ('final', 'revelacao', 'GENRE', 'misterio', 1.00),
    ('final', 'final-emocionante', 'GENRE', 'romance', 1.00),
    ('final', 'batalha', 'GENRE', 'fantasia', 1.00),
    ('final', 'ideia', 'GENRE', 'ficcao-cientifica', 1.00),
    ('ritmo', 'devagar', 'PACE', 'SLOW', 1.00),
    ('ritmo', 'equilibrado', 'PACE', 'MODERATE', 1.00),
    ('ritmo', 'rapido', 'PACE', 'FAST', 1.00),
    ('clima', 'leve', 'TONE', 'LIGHT', 1.00),
    ('clima', 'emocionante', 'TONE', 'EMOTIONAL', 1.00),
    ('clima', 'sombrio', 'TONE', 'DARK', 1.00),
    ('clima', 'reflexivo', 'TONE', 'THOUGHTFUL', 1.00),
    ('tamanho', 'curto', 'LENGTH', 'SHORT', 1.00),
    ('tamanho', 'medio', 'LENGTH', 'MEDIUM', 1.00),
    ('tamanho', 'longo', 'LENGTH', 'LONG', 1.00),
    ('evitar', 'violencia', 'AVOID', 'VIOLENCE', 1.00),
    ('evitar', 'luto', 'AVOID', 'GRIEF', 1.00),
    ('evitar', 'linguagem-forte', 'AVOID', 'STRONG_LANGUAGE', 1.00),
    ('evitar', 'sexo', 'AVOID', 'SEXUAL_CONTENT', 1.00),
    ('evitar', 'terror', 'AVOID', 'HORROR', 1.00)
) as v (question_slug, option_slug, dimension, value, weight)
join quiz_question q on q.slug = v.question_slug
join quiz_option o on o.question_id = q.id and o.slug = v.option_slug;

insert into quiz_profile (key, name, description) values
    ('misterio', 'Mistério clássico', 'Você gosta de segredos, pistas e reviravoltas. Combina com histórias que desafiam você a descobrir tudo antes do final.'),
    ('romance', 'Romance de tirar o fôlego', 'Você se conecta com personagens e sentimentos. Combina com histórias para se apaixonar e, talvez, chorar um pouquinho.'),
    ('fantasia', 'Fantasia épica', 'Você quer sair da realidade e explorar mundos novos. Combina com viagens cheias de magia e coragem.'),
    ('ficcao-cientifica', 'Ficção científica', 'Você tem curiosidade sobre o futuro e as possibilidades. Combina com histórias que levam a imaginação longe.'),
    ('misterio+romance', 'Suspense romântico', 'Você quer sentir o coração acelerar, de medo e de amor. Combina com segredos perigosos e paixões inesperadas.'),
    ('fantasia+misterio', 'Fantasia sombria', 'Magia e enigmas na mesma medida. Combina com mundos encantados onde nada é o que parece.'),
    ('ficcao-cientifica+misterio', 'Thriller futurista', 'Você gosta de pensar e de desconfiar de tudo. Combina com mistérios tecnológicos cheios de reviravoltas.'),
    ('fantasia+romance', 'Romantasia', 'Você quer magia e um romance de arrancar suspiros. Combina com reinos, segredos e amores que mudam destinos.'),
    ('ficcao-cientifica+romance', 'Amor além do tempo', 'Você gosta de grandes ideias, mas quer sentir. Combina com histórias de amor que desafiam o tempo e o espaço.'),
    ('fantasia+ficcao-cientifica', 'Mundos impossíveis', 'Para você, quanto mais longe da realidade, melhor. Combina com aventuras épicas em mundos que ainda vão existir.');
