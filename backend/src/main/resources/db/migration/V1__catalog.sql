-- Catálogo: gêneros, autores e livros.
-- Os livros e autores cadastrados aqui são FICTÍCIOS (dados demonstrativos do protótipo).

create table genre (
    id          bigint generated always as identity primary key,
    slug        varchar(60)  not null unique,
    name        varchar(80)  not null,
    description varchar(500) not null default ''
);

create table author (
    id   bigint generated always as identity primary key,
    slug varchar(120)  not null unique,
    name varchar(150)  not null,
    bio  varchar(2000) not null default ''
);

create table book (
    id               bigint generated always as identity primary key,
    slug             varchar(160)  not null unique,
    title            varchar(200)  not null,
    synopsis         varchar(4000) not null,
    publication_year integer check (publication_year between 1000 and 2100),
    pages            integer       not null check (pages > 0),
    pace             varchar(20)   not null check (pace in ('SLOW', 'MODERATE', 'FAST')),
    tone             varchar(20)   not null check (tone in ('LIGHT', 'EMOTIONAL', 'DARK', 'THOUGHTFUL')),
    cover_color      varchar(7)    not null default '#1f3f6b' check (cover_color ~ '^#[0-9a-fA-F]{6}$'),
    active           boolean       not null default true,
    created_at       timestamptz   not null default now(),
    updated_at       timestamptz   not null default now()
);

create table book_author (
    book_id   bigint  not null references book (id) on delete cascade,
    author_id bigint  not null references author (id),
    position  integer not null,
    primary key (book_id, author_id)
);
create index book_author_author_idx on book_author (author_id);

create table book_genre (
    book_id  bigint not null references book (id) on delete cascade,
    genre_id bigint not null references genre (id),
    primary key (book_id, genre_id)
);
create index book_genre_genre_idx on book_genre (genre_id);

-- Temas sensíveis: usados para respeitar os "temas a evitar" do quiz.
create table book_content_note (
    book_id bigint      not null references book (id) on delete cascade,
    note    varchar(30) not null check (note in ('VIOLENCE', 'GRIEF', 'STRONG_LANGUAGE', 'SEXUAL_CONTENT', 'HORROR')),
    primary key (book_id, note)
);

-- Pistas exibidas antes de o livro ser revelado (a experiência "às cegas").
create table book_clue (
    book_id  bigint       not null references book (id) on delete cascade,
    position integer      not null,
    text     varchar(200) not null,
    primary key (book_id, position)
);

-- ===== Dados demonstrativos =====

insert into genre (slug, name, description) values
    ('misterio', 'Mistério', 'Segredos, pistas e reviravoltas para quem gosta de descobrir tudo antes do final.'),
    ('romance', 'Romance', 'Personagens, sentimentos e histórias para se apaixonar.'),
    ('fantasia', 'Fantasia', 'Mundos mágicos, criaturas incríveis e jornadas épicas.'),
    ('ficcao-cientifica', 'Ficção científica', 'O futuro, a tecnologia e as grandes perguntas sobre o que ainda pode existir.');

insert into author (slug, name, bio) values
    ('helena-vasconcelos', 'Helena Vasconcelos', 'Autora fictícia de mistérios de cidade pequena, onde todo mundo se conhece e ninguém diz tudo.'),
    ('otavio-brandao', 'Otávio Brandão', 'Autor fictício de thrillers rápidos, conhecido pelos capítulos curtos e finais de tirar o fôlego.'),
    ('joaquim-pires', 'Joaquim Pires', 'Autor fictício de mistérios históricos ambientados no Brasil do começo do século XX.'),
    ('lia-monteverde', 'Lia Monteverde', 'Autora fictícia de romances delicados sobre recomeços, cartas e cidades litorâneas.'),
    ('rafael-toledo', 'Rafael Toledo', 'Autor fictício de comédias românticas com cheiro de café e conversas que viram madrugada.'),
    ('iara-quintela', 'Iara Quintela', 'Autora fictícia de fantasia épica inspirada em mares, marés e reinos insulares.'),
    ('benedito-saraiva', 'Benedito Saraiva', 'Autor fictício de fantasia com folclore, bruxas de beira de rio e portais escondidos.'),
    ('clara-nogueira', 'Clara Nogueira', 'Autora fictícia de ficção científica sobre exploração espacial e inteligência artificial.'),
    ('tomas-arantes', 'Tomás Arantes', 'Autor fictício de ficção científica ambiciosa, de colônias distantes a conspirações em órbita.'),
    ('marina-duarte', 'Marina Duarte', 'Autora fictícia de romantasia: magia, pactos antigos e amores improváveis.'),
    ('sofia-albuquerque', 'Sofia Albuquerque', 'Autora fictícia de histórias de amor que atravessam o tempo e o espaço.'),
    ('caetano-ribeiro', 'Caetano Ribeiro', 'Autor fictício de fantasia sombria, casas assombradas e enigmas que não querem ser resolvidos.');

insert into book (slug, title, synopsis, publication_year, pages, pace, tone, cover_color) values
    ('o-relogio-da-rua-aurora', 'O Relógio da Rua Aurora',
     'Quando o dono de uma relojoaria aparece morto, a sobrinha descobre que todos os relógios da loja pararam na mesma hora. Um mistério de cidade pequena, cheio de suspeitos educados demais.',
     2019, 312, 'MODERATE', 'DARK', '#3b2f4a'),
    ('a-ultima-hospede', 'A Última Hóspede',
     'Uma pousada na serra, uma tempestade que isola todos e uma hóspede que ninguém lembra de ter visto chegar. Até o amanhecer, alguém vai precisar contar a verdade.',
     2021, 248, 'FAST', 'DARK', '#22303f'),
    ('silencio-na-ilha-das-garcas', 'Silêncio na Ilha das Garças',
     'Uma jornalista volta à ilha onde cresceu para investigar o desaparecimento de um pescador e encontra uma comunidade inteira disposta a esquecer o passado.',
     2020, 356, 'FAST', 'DARK', '#1d4a52'),
    ('o-caso-do-bonde-17', 'O Caso do Bonde 17',
     'Rio de Janeiro, 1924. Um passageiro some entre duas paradas de bonde e um revisor de jornal decide investigar por conta própria, armado só de paciência e curiosidade.',
     2016, 420, 'SLOW', 'THOUGHTFUL', '#6b4a2b'),
    ('cartas-para-depois-da-chuva', 'Cartas para Depois da Chuva',
     'Depois de perder a avó, Bia encontra uma caixa de cartas nunca enviadas e decide entregá-las uma a uma, descobrindo um amor que atravessou cinquenta anos.',
     2018, 284, 'SLOW', 'EMOTIONAL', '#5b7fa6'),
    ('um-verao-em-paraty', 'Um Verão em Paraty',
     'Ela foi a Paraty para esquecer um noivado desfeito. Ele aluga caiaques e não acredita em amor de temporada. Um verão inteiro para os dois mudarem de ideia.',
     2022, 212, 'FAST', 'LIGHT', '#e08a5b'),
    ('o-sabor-das-segundas-chances', 'O Sabor das Segundas Chances',
     'Dois ex-namorados da faculdade descobrem que vão disputar o mesmo ponto para abrir uma cafeteria. A rivalidade vira parceria, e a parceria vira outra coisa.',
     2020, 268, 'MODERATE', 'LIGHT', '#8a5a3c'),
    ('noites-de-lisboa', 'Noites de Lisboa',
     'Uma tradutora brasileira aceita um trabalho de seis meses em Lisboa e se envolve com o autor do livro que está traduzindo, um homem tão reservado quanto os personagens dele.',
     2023, 330, 'MODERATE', 'EMOTIONAL', '#a33b4f'),
    ('a-coroa-de-sal', 'A Coroa de Sal',
     'Em um arquipélago governado pelas marés, a herdeira de um reino em ruínas precisa reunir clãs rivais antes que o mar engula a última ilha.',
     2017, 540, 'SLOW', 'EMOTIONAL', '#2b5d7a'),
    ('o-mapa-das-mares-esquecidas', 'O Mapa das Marés Esquecidas',
     'Uma aprendiz de cartógrafa encontra um mapa que muda de forma a cada lua e embarca, com uma tripulação improvável, atrás da ilha que ele promete mostrar.',
     2021, 390, 'MODERATE', 'LIGHT', '#3f8a8c'),
    ('os-sete-portoes-de-ebano', 'Os Sete Portões de Ébano',
     'Sete portões mantêm as criaturas da floresta longe da cidade. Quando o primeiro cai, um ferreiro e uma caçadora têm sete noites para descobrir quem os está abrindo.',
     2019, 470, 'FAST', 'EMOTIONAL', '#2f2a24'),
    ('a-bruxa-do-brejo-verde', 'A Bruxa do Brejo Verde',
     'Uma bruxa aposentada só quer cuidar da horta, mas a vila insiste em bater à porta dela com problemas mágicos cada vez mais absurdos.',
     2023, 230, 'MODERATE', 'LIGHT', '#4f7a3a'),
    ('sinal-de-vida-em-europa', 'Sinal de Vida em Europa',
     'Uma bióloga a bordo de uma estação em órbita de Europa, lua de Júpiter, capta um padrão sob o gelo que pode ser a primeira prova de vida fora da Terra, ou um erro que custará a missão.',
     2018, 344, 'MODERATE', 'THOUGHTFUL', '#2a4d7a'),
    ('memoria-de-silicio', 'Memória de Silício',
     'Em uma São Paulo de 2071, uma investigadora precisa descobrir quem apagou as memórias de uma inteligência artificial testemunha de um assassinato.',
     2022, 298, 'FAST', 'DARK', '#1b1f3a'),
    ('a-colonia-de-vidro', 'A Colônia de Vidro',
     'Gerações depois da partida da Terra, os habitantes de uma colônia sob uma cúpula de vidro começam a questionar se o planeta lá fora é mesmo inabitável.',
     2016, 512, 'SLOW', 'THOUGHTFUL', '#6a8fa3'),
    ('protocolo-aurora', 'Protocolo Aurora',
     'Um técnico de manutenção descobre que a estação espacial onde trabalha esconde um experimento proibido, e tem dezoito horas até a próxima nave chegar.',
     2024, 376, 'FAST', 'EMOTIONAL', '#b4462e'),
    ('o-pacto-das-rosas-de-cinza', 'O Pacto das Rosas de Cinza',
     'Para salvar a irmã, uma jardineira faz um pacto com o príncipe exilado de uma corte feérica. O preço é um ano de serviço, e o coração dela não estava no contrato.',
     2021, 448, 'MODERATE', 'EMOTIONAL', '#5a2a3a'),
    ('a-feiticeira-e-o-cartografo', 'A Feiticeira e o Cartógrafo',
     'Uma feiticeira que odeia viajar e um cartógrafo que não sabe ficar parado precisam atravessar o reino juntos para entregar um mapa encantado antes do solstício.',
     2023, 320, 'FAST', 'LIGHT', '#7a5ca8'),
    ('amor-em-orbita-baixa', 'Amor em Órbita Baixa',
     'Dois astronautas que se detestam são escalados para a mesma missão de seis meses. Na estação, não há para onde fugir, nem das brigas, nem do que vem depois delas.',
     2021, 276, 'MODERATE', 'LIGHT', '#3a6ea5'),
    ('quando-o-tempo-dobrou', 'Quando o Tempo Dobrou',
     'Uma física recebe mensagens de alguém que diz amá-la, enviadas de vinte anos no futuro. Para encontrá-lo, talvez precise mudar o que ainda nem aconteceu.',
     2019, 362, 'SLOW', 'EMOTIONAL', '#4a3f7a'),
    ('a-casa-dos-espelhos-quebrados', 'A Casa dos Espelhos Quebrados',
     'Herdeira de uma casa onde todos os espelhos foram quebrados, Lúcia descobre que os reflexos da família nunca foram embora e que um deles guarda um crime.',
     2020, 402, 'MODERATE', 'DARK', '#2d2d38'),
    ('lanternas-no-nevoeiro', 'Lanternas no Nevoeiro',
     'Em uma vila onde o nevoeiro nunca se levanta, as lanternas acesas nas janelas marcam quem ainda está vivo. Uma noite, uma delas se acende numa casa vazia há trinta anos.',
     2022, 318, 'SLOW', 'DARK', '#3c4a4f'),
    ('segredos-de-seda', 'Segredos de Seda',
     'Uma costureira e um herdeiro falido investigam juntos o roubo de um vestido de noiva na alta sociedade de Petrópolis, e acabam costurando mais que pistas.',
     2021, 352, 'MODERATE', 'EMOTIONAL', '#9a6b8a'),
    ('o-detetive-de-marte', 'O Detetive de Marte',
     'O único detetive da primeira cidade de Marte tem um caso fácil: descobrir quem roubou a última barra de chocolate do planeta. Fácil, até as pistas apontarem para todos.',
     2024, 224, 'FAST', 'LIGHT', '#c0582f');

insert into book_author (book_id, author_id, position)
select b.id, a.id, v.position
from (values
    ('o-relogio-da-rua-aurora', 'helena-vasconcelos', 0),
    ('a-ultima-hospede', 'helena-vasconcelos', 0),
    ('silencio-na-ilha-das-garcas', 'otavio-brandao', 0),
    ('o-caso-do-bonde-17', 'joaquim-pires', 0),
    ('cartas-para-depois-da-chuva', 'lia-monteverde', 0),
    ('um-verao-em-paraty', 'lia-monteverde', 0),
    ('o-sabor-das-segundas-chances', 'rafael-toledo', 0),
    ('noites-de-lisboa', 'rafael-toledo', 0),
    ('a-coroa-de-sal', 'iara-quintela', 0),
    ('o-mapa-das-mares-esquecidas', 'iara-quintela', 0),
    ('os-sete-portoes-de-ebano', 'benedito-saraiva', 0),
    ('a-bruxa-do-brejo-verde', 'benedito-saraiva', 0),
    ('sinal-de-vida-em-europa', 'clara-nogueira', 0),
    ('memoria-de-silicio', 'clara-nogueira', 0),
    ('a-colonia-de-vidro', 'tomas-arantes', 0),
    ('protocolo-aurora', 'tomas-arantes', 0),
    ('o-pacto-das-rosas-de-cinza', 'marina-duarte', 0),
    ('a-feiticeira-e-o-cartografo', 'marina-duarte', 0),
    ('amor-em-orbita-baixa', 'sofia-albuquerque', 0),
    ('quando-o-tempo-dobrou', 'sofia-albuquerque', 0),
    ('a-casa-dos-espelhos-quebrados', 'caetano-ribeiro', 0),
    ('lanternas-no-nevoeiro', 'caetano-ribeiro', 0),
    ('segredos-de-seda', 'joaquim-pires', 0),
    ('segredos-de-seda', 'lia-monteverde', 1),
    ('o-detetive-de-marte', 'otavio-brandao', 0)
) as v (book_slug, author_slug, position)
join book b on b.slug = v.book_slug
join author a on a.slug = v.author_slug;

insert into book_genre (book_id, genre_id)
select b.id, g.id
from (values
    ('o-relogio-da-rua-aurora', 'misterio'),
    ('a-ultima-hospede', 'misterio'),
    ('silencio-na-ilha-das-garcas', 'misterio'),
    ('o-caso-do-bonde-17', 'misterio'),
    ('cartas-para-depois-da-chuva', 'romance'),
    ('um-verao-em-paraty', 'romance'),
    ('o-sabor-das-segundas-chances', 'romance'),
    ('noites-de-lisboa', 'romance'),
    ('a-coroa-de-sal', 'fantasia'),
    ('o-mapa-das-mares-esquecidas', 'fantasia'),
    ('os-sete-portoes-de-ebano', 'fantasia'),
    ('a-bruxa-do-brejo-verde', 'fantasia'),
    ('sinal-de-vida-em-europa', 'ficcao-cientifica'),
    ('memoria-de-silicio', 'ficcao-cientifica'),
    ('memoria-de-silicio', 'misterio'),
    ('a-colonia-de-vidro', 'ficcao-cientifica'),
    ('protocolo-aurora', 'ficcao-cientifica'),
    ('o-pacto-das-rosas-de-cinza', 'fantasia'),
    ('o-pacto-das-rosas-de-cinza', 'romance'),
    ('a-feiticeira-e-o-cartografo', 'fantasia'),
    ('a-feiticeira-e-o-cartografo', 'romance'),
    ('amor-em-orbita-baixa', 'ficcao-cientifica'),
    ('amor-em-orbita-baixa', 'romance'),
    ('quando-o-tempo-dobrou', 'ficcao-cientifica'),
    ('quando-o-tempo-dobrou', 'romance'),
    ('a-casa-dos-espelhos-quebrados', 'fantasia'),
    ('a-casa-dos-espelhos-quebrados', 'misterio'),
    ('lanternas-no-nevoeiro', 'fantasia'),
    ('lanternas-no-nevoeiro', 'misterio'),
    ('segredos-de-seda', 'misterio'),
    ('segredos-de-seda', 'romance'),
    ('o-detetive-de-marte', 'ficcao-cientifica'),
    ('o-detetive-de-marte', 'misterio')
) as v (book_slug, genre_slug)
join book b on b.slug = v.book_slug
join genre g on g.slug = v.genre_slug;

insert into book_content_note (book_id, note)
select b.id, v.note
from (values
    ('o-relogio-da-rua-aurora', 'VIOLENCE'),
    ('a-ultima-hospede', 'VIOLENCE'),
    ('a-ultima-hospede', 'STRONG_LANGUAGE'),
    ('silencio-na-ilha-das-garcas', 'VIOLENCE'),
    ('silencio-na-ilha-das-garcas', 'GRIEF'),
    ('cartas-para-depois-da-chuva', 'GRIEF'),
    ('noites-de-lisboa', 'SEXUAL_CONTENT'),
    ('a-coroa-de-sal', 'VIOLENCE'),
    ('os-sete-portoes-de-ebano', 'VIOLENCE'),
    ('memoria-de-silicio', 'VIOLENCE'),
    ('a-colonia-de-vidro', 'GRIEF'),
    ('protocolo-aurora', 'VIOLENCE'),
    ('protocolo-aurora', 'STRONG_LANGUAGE'),
    ('o-pacto-das-rosas-de-cinza', 'VIOLENCE'),
    ('o-pacto-das-rosas-de-cinza', 'SEXUAL_CONTENT'),
    ('quando-o-tempo-dobrou', 'GRIEF'),
    ('a-casa-dos-espelhos-quebrados', 'VIOLENCE'),
    ('a-casa-dos-espelhos-quebrados', 'HORROR'),
    ('lanternas-no-nevoeiro', 'HORROR'),
    ('lanternas-no-nevoeiro', 'GRIEF'),
    ('segredos-de-seda', 'VIOLENCE')
) as v (book_slug, note)
join book b on b.slug = v.book_slug;

insert into book_clue (book_id, position, text)
select b.id, v.position, v.text
from (values
    ('o-relogio-da-rua-aurora', 0, 'Todos os ponteiros param na mesma hora'),
    ('o-relogio-da-rua-aurora', 1, 'Uma herança que ninguém queria receber'),
    ('o-relogio-da-rua-aurora', 2, 'Vizinhos gentis demais para serem inocentes'),
    ('a-ultima-hospede', 0, 'Uma tempestade que fecha a única estrada'),
    ('a-ultima-hospede', 1, 'Um livro de registros com uma página arrancada'),
    ('a-ultima-hospede', 2, 'Tudo acontece em uma única noite'),
    ('silencio-na-ilha-das-garcas', 0, 'Um barco que voltou vazio'),
    ('silencio-na-ilha-das-garcas', 1, 'Uma ilha onde todos guardam o mesmo segredo'),
    ('silencio-na-ilha-das-garcas', 2, 'Uma volta para casa que ninguém pediu'),
    ('o-caso-do-bonde-17', 0, 'Um desaparecimento entre duas paradas'),
    ('o-caso-do-bonde-17', 1, 'Redações de jornal e cafés dos anos 1920'),
    ('o-caso-do-bonde-17', 2, 'Um investigador que não é detetive'),
    ('cartas-para-depois-da-chuva', 0, 'Uma caixa de cartas que nunca foram enviadas'),
    ('cartas-para-depois-da-chuva', 1, 'Um amor guardado por cinquenta anos'),
    ('cartas-para-depois-da-chuva', 2, 'Despedidas que viram começos'),
    ('um-verao-em-paraty', 0, 'Um noivado desfeito e uma mala feita às pressas'),
    ('um-verao-em-paraty', 1, 'Ruas de pedra e passeios de caiaque'),
    ('um-verao-em-paraty', 2, 'Um amor que deveria durar só uma estação'),
    ('o-sabor-das-segundas-chances', 0, 'Dois rivais disputando o mesmo endereço'),
    ('o-sabor-das-segundas-chances', 1, 'Cheiro de café recém-passado'),
    ('o-sabor-das-segundas-chances', 2, 'Um reencontro dez anos depois'),
    ('noites-de-lisboa', 0, 'Uma tradução que vira conversa'),
    ('noites-de-lisboa', 1, 'Seis meses do outro lado do oceano'),
    ('noites-de-lisboa', 2, 'Um autor tão misterioso quanto os personagens'),
    ('a-coroa-de-sal', 0, 'Um reino que o mar está engolindo'),
    ('a-coroa-de-sal', 1, 'Clãs rivais que precisam se unir'),
    ('a-coroa-de-sal', 2, 'Uma herdeira que nunca quis o trono'),
    ('o-mapa-das-mares-esquecidas', 0, 'Um mapa que muda a cada lua'),
    ('o-mapa-das-mares-esquecidas', 1, 'Uma tripulação que não se dá bem'),
    ('o-mapa-das-mares-esquecidas', 2, 'Uma ilha que talvez nem exista'),
    ('os-sete-portoes-de-ebano', 0, 'Sete portões e sete noites'),
    ('os-sete-portoes-de-ebano', 1, 'Criaturas que esperam do lado de fora'),
    ('os-sete-portoes-de-ebano', 2, 'Um ferreiro e uma caçadora'),
    ('a-bruxa-do-brejo-verde', 0, 'Uma bruxa que só quer sossego'),
    ('a-bruxa-do-brejo-verde', 1, 'Problemas mágicos cada vez mais absurdos'),
    ('a-bruxa-do-brejo-verde', 2, 'Uma horta muito especial'),
    ('sinal-de-vida-em-europa', 0, 'Um padrão estranho sob o gelo'),
    ('sinal-de-vida-em-europa', 1, 'Uma estação em órbita de Júpiter'),
    ('sinal-de-vida-em-europa', 2, 'Uma descoberta que pode ser um erro'),
    ('memoria-de-silicio', 0, 'Uma testemunha que não é humana'),
    ('memoria-de-silicio', 1, 'Memórias apagadas de propósito'),
    ('memoria-de-silicio', 2, 'Uma metrópole brasileira do futuro'),
    ('a-colonia-de-vidro', 0, 'Uma cúpula que protege, ou aprisiona'),
    ('a-colonia-de-vidro', 1, 'Gerações que nunca viram o céu aberto'),
    ('a-colonia-de-vidro', 2, 'Perguntas que ninguém deveria fazer'),
    ('protocolo-aurora', 0, 'Dezoito horas de contagem regressiva'),
    ('protocolo-aurora', 1, 'Um experimento que não deveria existir'),
    ('protocolo-aurora', 2, 'Um herói que só consertava dutos'),
    ('o-pacto-das-rosas-de-cinza', 0, 'Um pacto com prazo de um ano'),
    ('o-pacto-das-rosas-de-cinza', 1, 'Uma corte feérica e um príncipe exilado'),
    ('o-pacto-das-rosas-de-cinza', 2, 'Rosas que florescem em cinzas'),
    ('a-feiticeira-e-o-cartografo', 0, 'Uma viagem que nenhum dos dois queria'),
    ('a-feiticeira-e-o-cartografo', 1, 'Um mapa encantado com prazo de entrega'),
    ('a-feiticeira-e-o-cartografo', 2, 'Discussões que viram outra coisa'),
    ('amor-em-orbita-baixa', 0, 'Seis meses sem ter para onde fugir'),
    ('amor-em-orbita-baixa', 1, 'Dois rivais na mesma missão'),
    ('amor-em-orbita-baixa', 2, 'A Terra vista da janela'),
    ('quando-o-tempo-dobrou', 0, 'Mensagens enviadas do futuro'),
    ('quando-o-tempo-dobrou', 1, 'Um amor que ainda não aconteceu'),
    ('quando-o-tempo-dobrou', 2, 'Uma cientista diante de um paradoxo'),
    ('a-casa-dos-espelhos-quebrados', 0, 'Uma herança com todos os espelhos quebrados'),
    ('a-casa-dos-espelhos-quebrados', 1, 'Reflexos que não foram embora'),
    ('a-casa-dos-espelhos-quebrados', 2, 'Um crime antigo na família'),
    ('lanternas-no-nevoeiro', 0, 'Um nevoeiro que nunca se levanta'),
    ('lanternas-no-nevoeiro', 1, 'Uma luz acesa numa casa vazia'),
    ('lanternas-no-nevoeiro', 2, 'Uma vila que conta seus vivos'),
    ('segredos-de-seda', 0, 'Um vestido de noiva roubado'),
    ('segredos-de-seda', 1, 'A alta sociedade da serra'),
    ('segredos-de-seda', 2, 'Uma dupla improvável de investigadores'),
    ('o-detetive-de-marte', 0, 'O único detetive de um planeta inteiro'),
    ('o-detetive-de-marte', 1, 'Um crime que parece pequeno demais'),
    ('o-detetive-de-marte', 2, 'Suspeitos por toda parte')
) as v (book_slug, position, text)
join book b on b.slug = v.book_slug;
