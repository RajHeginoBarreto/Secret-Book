-- Área do leitor: biblioteca e favoritos, avaliação das recomendações e assinatura demonstrativa.

create table user_book (
    user_id    bigint      not null references app_user (id) on delete cascade,
    book_id    bigint      not null references book (id) on delete cascade,
    status     varchar(20) check (status in ('WANT_TO_READ', 'READING', 'READ')),
    favorite   boolean     not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, book_id),
    -- Uma linha só existe se o livro tiver status ou for favorito.
    check (status is not null or favorite)
);
create index user_book_book_idx on user_book (book_id);

-- "Esta recomendação combinou comigo?" Uma avaliação por leitor e livro (a mais recente vale).
create table recommendation_feedback (
    id         bigint generated always as identity primary key,
    user_id    bigint       not null references app_user (id) on delete cascade,
    book_id    bigint       not null references book (id) on delete cascade,
    attempt_id uuid         references quiz_attempt (id) on delete set null,
    useful     boolean      not null,
    comment    varchar(500),
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now(),
    unique (user_id, book_id)
);
create index recommendation_feedback_book_idx on recommendation_feedback (book_id);

-- Planos DEMONSTRATIVOS (valores fictícios; nenhum pagamento é processado).
create table plan (
    id                  bigint generated always as identity primary key,
    slug                varchar(60) not null unique,
    name                varchar(80) not null,
    monthly_price_cents integer     not null check (monthly_price_cents >= 0),
    books_per_month     integer     not null check (books_per_month > 0),
    active              boolean     not null default true
);

insert into plan (slug, name, monthly_price_cents, books_per_month) values
    ('leitor-casual', 'Leitor casual', 3800, 1),
    ('leitor-avido', 'Leitor ávido', 7000, 2),
    ('maratona-literaria', 'Maratona literária', 13000, 4);

create table subscription (
    id          bigint generated always as identity primary key,
    user_id     bigint      not null references app_user (id) on delete cascade,
    plan_id     bigint      not null references plan (id),
    status      varchar(20) not null check (status in ('ACTIVE', 'CANCELED')),
    started_at  timestamptz not null,
    canceled_at timestamptz
);
-- No máximo uma assinatura ativa por leitor.
create unique index subscription_one_active_per_user on subscription (user_id) where status = 'ACTIVE';
create index subscription_user_idx on subscription (user_id, started_at desc);
