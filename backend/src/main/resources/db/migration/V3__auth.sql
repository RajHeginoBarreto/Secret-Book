-- Autenticação: usuários, sessões (revogáveis) e recuperação de senha.

create table app_user (
    id            bigint generated always as identity primary key,
    name          varchar(120) not null,
    -- Sempre gravado em minúsculas pela aplicação; o índice abaixo garante a unicidade mesmo assim.
    email         varchar(254) not null,
    password_hash varchar(100) not null,
    role          varchar(20)  not null check (role in ('READER', 'ADMIN')),
    enabled       boolean      not null default true,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now()
);
create unique index app_user_email_uidx on app_user (lower(email));

-- Cada login cria uma sessão. O token (JWT) carrega o id da sessão, então "Sair" e a troca de senha
-- invalidam o acesso na hora, sem esperar o token expirar.
create table user_session (
    id         uuid        primary key,
    user_id    bigint      not null references app_user (id) on delete cascade,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    revoked_at timestamptz
);
create index user_session_user_idx on user_session (user_id);

-- Só o hash (SHA-256) do token é guardado: quem ler o banco não consegue usar o link.
create table password_reset_token (
    id         bigint generated always as identity primary key,
    user_id    bigint      not null references app_user (id) on delete cascade,
    token_hash varchar(64) not null unique,
    expires_at timestamptz not null,
    used_at    timestamptz,
    created_at timestamptz not null default now()
);
create index password_reset_token_user_idx on password_reset_token (user_id);

-- Tentativas do quiz feitas por usuários logados entram no histórico da conta.
alter table quiz_attempt add column user_id bigint references app_user (id) on delete set null;
create index quiz_attempt_user_idx on quiz_attempt (user_id, created_at desc);
