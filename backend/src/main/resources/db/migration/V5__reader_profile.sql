-- Perfil do leitor e minimização de dados (LGPD): login por nome de usuário, e-mail opcional,
-- preferências literárias, autores favoritos e comentários sobre livros lidos.

-- ===== Nome de usuário =====
alter table app_user add column username varchar(40);

-- Contas antigas recebem um nome derivado da parte local do e-mail (só os caracteres permitidos,
-- começando e terminando em letra ou número). Se sobrar pouco, vira "leitor_<id>".
update app_user
set username = left(regexp_replace(regexp_replace(split_part(email, '@', 1), '[^[:alnum:]._-]', '', 'g'),
                                   '^[^[:alnum:]]+|[^[:alnum:]]+$', '', 'g'), 30);
update app_user set username = 'leitor_' || id where username is null or length(username) < 3;

-- Nomes repetidos (ignorando maiúsculas) ganham o sufixo "_<id>"; o primeiro cadastro fica com o nome original.
update app_user u
set username = u.username || '_' || u.id
from (select id, row_number() over (partition by lower(username) order by id) as n from app_user) ranked
where ranked.id = u.id and ranked.n > 1;

alter table app_user alter column username set not null;
create unique index app_user_username_uidx on app_user (lower(username));

-- E-mail passa a ser opcional (o índice único em lower(email) continua valendo para quem tiver).
alter table app_user alter column email drop not null;

-- Quando o leitor aceitou a política de privacidade (nulo para contas criadas antes desta versão).
alter table app_user add column privacy_accepted_at timestamptz;

-- ===== Comentários sobre livros lidos =====
alter table user_book add column rating smallint check (rating between 1 and 5);
alter table user_book add column comment varchar(1000);
alter table user_book add column reviewed_at timestamptz;
create index user_book_comment_idx on user_book (book_id, reviewed_at desc) where comment is not null;

-- ===== Preferências do leitor =====
-- Tipos literários de que o leitor gosta (liked = true) ou não gosta (liked = false). Texto livre.
create table reader_genre_preference (
    user_id bigint      not null references app_user (id) on delete cascade,
    label   varchar(60) not null,
    liked   boolean     not null,
    primary key (user_id, label)
);

-- Autores favoritos, na ordem escolhida pelo leitor. Texto livre (não precisa existir no catálogo).
create table reader_favorite_author (
    user_id  bigint       not null references app_user (id) on delete cascade,
    name     varchar(120) not null,
    position integer      not null,
    primary key (user_id, name)
);
