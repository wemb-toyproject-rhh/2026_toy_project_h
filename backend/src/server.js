// Entry point for the RHH backend API server.
// CLAUDE.md 의 "Backend Integration API Protocol" 계약을 그대로 구현합니다:
//   GET  /api/history
//   GET  /api/history/:id
//   PUT  /api/history/:id/metadata
//   GET  /api/history/compare?v1={id1}&v2={id2}
import "dotenv/config";
import express from "express";
import { query } from "./db.js";
import { getAllEntries, getEntryById } from "./entries.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json({ limit: "256kb" }));

// comment 컬럼은 두 테이블 다 varchar(1000) 입니다.
const TITLE_MAX = 1000;

// id 는 "page-39" / "inst-101" 형태입니다.
function parseId(id) {
  const at = id.indexOf("-");
  if (at === -1) return null;
  const prefix = id.slice(0, at);
  const histId = id.slice(at + 1);
  if (!/^\d+$/.test(histId)) return null;
  if (prefix === "page") return { table: "tb_page_hist", histId };
  if (prefix === "inst") return { table: "tb_instance_hist", histId };
  return null;
}

// 이력 목록. 페이지/컴포넌트 필터링은 프론트가 entry.targetId 기준으로 처리합니다.
app.get("/api/history", async (req, res) => {
  try {
    const entries = await getAllEntries();
    res.json(entries);
  } catch (err) {
    console.error("[GET /api/history]", err.message);
    res.status(500).json({ error: "이력 조회 실패", detail: err.message });
  }
});

// 버전 비교. "/api/history/:id" 보다 먼저 등록해야 "compare" 가 :id 로 잡히지 않습니다.
app.get("/api/history/compare", async (req, res) => {
  const { v1, v2 } = req.query;
  if (!v1 || !v2) {
    return res.status(400).json({ error: "v1, v2 쿼리 파라미터가 모두 필요합니다" });
  }

  try {
    const [entryV1, entryV2] = await Promise.all([getEntryById(v1), getEntryById(v2)]);
    if (!entryV1 || !entryV2) {
      return res.status(404).json({ error: "비교할 이력을 찾을 수 없습니다" });
    }
    res.json({ v1: entryV1, v2: entryV2 });
  } catch (err) {
    console.error("[GET /api/history/compare]", err.message);
    res.status(500).json({ error: "비교 조회 실패", detail: err.message });
  }
});

// 이력 단건 조회.
app.get("/api/history/:id", async (req, res) => {
  try {
    const entry = await getEntryById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: `이력을 찾을 수 없습니다 (id=${req.params.id})` });
    }
    res.json(entry);
  } catch (err) {
    console.error("[GET /api/history/:id]", err.message);
    res.status(500).json({ error: "이력 조회 실패", detail: err.message });
  }
});

// PR 제목(= 비고) 수정. hist_id 가 두 테이블 모두 기본키라 정확히 한 행만 바뀝니다.
app.put("/api/history/:id/metadata", async (req, res) => {
  const parsed = parseId(req.params.id);
  const { title } = req.body ?? {};

  if (!parsed) {
    return res.status(400).json({ error: "id 형식이 올바르지 않습니다 (예: page-39)" });
  }
  if (typeof title !== "string") {
    return res.status(400).json({ error: "title 은 문자열이어야 합니다" });
  }
  if (title.length > TITLE_MAX) {
    return res.status(400).json({ error: `title 은 ${TITLE_MAX}자를 넘을 수 없습니다`, max: TITLE_MAX });
  }

  try {
    const result = await query(
      `UPDATE ${parsed.table} SET comment = $1 WHERE hist_id = $2 RETURNING hist_id`,
      [title, parsed.histId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `이력을 찾을 수 없습니다 (id=${req.params.id})` });
    }

    const entry = await getEntryById(req.params.id);
    res.json(entry);
  } catch (err) {
    console.error("[PUT /api/history/:id/metadata]", err.message);
    res.status(500).json({ error: "제목 저장 실패", detail: err.message });
  }
});

// DB 연결 확인용.
app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`RHH backend API 실행 중 → http://localhost:${PORT}`);
  console.log(`  DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
