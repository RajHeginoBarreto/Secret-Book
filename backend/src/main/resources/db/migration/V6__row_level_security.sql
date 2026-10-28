-- Liga o Row Level Security em todas as tabelas do esquema public, sem nenhuma política.
-- No Supabase, isso fecha a API pública (PostgREST, chaves anon/authenticated) para os dados do Secret Book.
-- O backend não é afetado: ele se conecta como dono das tabelas, e o dono ignora o RLS (não usamos FORCE).
-- Tabelas criadas em migrações futuras precisam de "alter table ... enable row level security" próprio.
-- A flyway_schema_history fica de fora: o Flyway a mantém bloqueada durante a migração (alterá-la aqui trava).
do $$
declare
    t record;
begin
    for t in select tablename from pg_tables where schemaname = 'public' and tablename <> 'flyway_schema_history' loop
        execute format('alter table public.%I enable row level security', t.tablename);
    end loop;
end
$$;
