// 이력 중요 표시(⭐, 즐겨찾기 성격) 관련 조회/토글.
//
// tb_history_starred 는 tb_alarm_check 와 같은 이유로 같은 자리(tb_page_hist/
// tb_instance_hist 와 같은 대상 DB)에 있습니다 — 사용자별로 완전히 독립적인 값이라
// (내가 중요 표시해도 다른 사용자 화면엔 영향 없음), 크로스 DB 걱정 없이 그 DB 안에서
// 조인 한 번으로 끝납니다.
//
//   CREATE TABLE tb_history_starred (
//     user_id    INTEGER NOT NULL,
//     hist_type  VARCHAR(10) NOT NULL,   -- 'page' | 'inst' (entries.js 의 id 접두사와 동일)
//     hist_id    INTEGER NOT NULL,
//     PRIMARY KEY (user_id, hist_type, hist_id)
//   );
import { query as defaultQuery } from "./db.js";

// entries.js 가 만드는 id 는 "page-39" / "inst-101" 형식입니다.
function splitEntryId(id) {
  const at = id.indexOf("-");
  if (at === -1) return null;
  const histType = id.slice(0, at);
  const histId = id.slice(at + 1);
  if (!/^\d+$/.test(histId)) return null;
  if (histType !== "page" && histType !== "inst") return null;
  return { histType, histId };
}

// 로그인한 사용자가 이 프로젝트에서 중요 표시해둔 이력 id 집합입니다("page-39" 형식).
// GET /api/history 가 각 항목에 important 필드를 얹을 때 이 집합과 대조합니다.
export async function getStarredIds({ userId, query: runQuery = defaultQuery }) {
  const { rows } = await runQuery(
    `SELECT hist_type, hist_id FROM tb_history_starred WHERE user_id = $1`,
    [userId],
  );
  return new Set(rows.map((row) => `${row.hist_type}-${row.hist_id}`));
}

// 중요 표시를 켜거나 끕니다. id 형식이 잘못됐으면 false(호출부가 400 처리),
// 정상 처리됐으면 true 를 돌려줍니다.
export async function setStarred({ userId, id, starred, query: runQuery = defaultQuery }) {
  const parsed = splitEntryId(id);
  if (!parsed) return false;

  if (starred) {
    await runQuery(
      `INSERT INTO tb_history_starred (user_id, hist_type, hist_id) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [userId, parsed.histType, parsed.histId],
    );
  } else {
    await runQuery(
      `DELETE FROM tb_history_starred WHERE user_id = $1 AND hist_type = $2 AND hist_id = $3`,
      [userId, parsed.histType, parsed.histId],
    );
  }
  return true;
}
