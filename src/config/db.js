const { Pool } = require("pg");

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port:     Number(process.env.DB_PORT),
});

// Detecta erros de conexão ociosa (ex: PostgreSQL reiniciado)
pool.on("error", (err) => {
  console.error("[DB] Erro inesperado no cliente:", err.message);
  process.exit(1);
});

// Valida a ligação ao arrancar
pool.connect()
  .then((client) => {
    console.log("[DB] PostgreSQL ligado com sucesso");
    client.release();
  })
  .catch((err) => {
    console.error("[DB] Falha ao ligar ao PostgreSQL:", err.message);
    process.exit(1);
  });

module.exports = pool;