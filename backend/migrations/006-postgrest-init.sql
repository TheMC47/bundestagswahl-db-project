CREATE ROLE web_anon NOLOGIN;
GRANT USAGE ON SCHEMA PUBLIC TO web_anon;

CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'mysecretpassword';
GRANT web_anon TO authenticator;
