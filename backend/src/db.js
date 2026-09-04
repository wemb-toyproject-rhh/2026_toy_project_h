import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

// PostgreSQL 커넥션 풀. 접속 정보는 .env 에서만 읽습니다.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[db] 유휴 커넥션 오류:", err.message);
});

export function query(text, params) {
  return pool.query(text, params);
}
