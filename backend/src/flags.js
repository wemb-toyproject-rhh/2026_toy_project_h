// 이력 중요 표시(⭐, 즐겨찾기 성격) 관련 조회/토글.
//
// tb_history_starred 는 tb_alarm_check 와 같은 이유로 같은 자리(tb_page_hist/
// tb_instance_hist 와 같은 대상 DB)에 있습니다 — 사용자별로 완전히 독립적인 값이라
// (내가 중요 표시해도 다른 사용자 화면엔 영향 없음), 크로스 DB 걱정 없이 그 DB 안에서
// 조인 한 번으로 끝납니다.
//
//   CREATE TABLE tb_history_starred (
//     user_id    VARCHAR(1000) NOT NULL,  -- tb_user_rhh.user_id 와 같은 문자열
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

// 이력이 영구 삭제될 때 그 이력을 가리키던 중요 표시를 같이 지웁니다. hist_id는
// 삭제되고 나면 다시는 안 쓰이는 번호라, user_id로 좁히지 않고 그 (hist_type, hist_id)를
// 가리키던 행 전부(=중요 표시해뒀던 모든 사용자 몫)를 지웁니다 — 안 그러면 이미 없는
// 이력을 가리키는 고아 row로 테이블에 계속 남습니다.
// tb_history_starred 가 없는 프로젝트에서도 삭제 자체(핵심 기능)는 계속 성공해야 하므로
// 여기서 실패를 삼킵니다.
export async function deleteStarredForHist({ histType, histId, query: runQuery = defaultQuery }) {
  try {
    await runQuery(`DELETE FROM tb_history_starred WHERE hist_type = $1 AND hist_id = $2`, [
      histType,
      histId,
    ]);
  } catch (err) {
    console.warn("[deleteStarredForHist] 정리 실패(무시하고 계속):", err.message);
  }
}

// 위와 같은 정리를, "휴지통 비우기"처럼 한 번에 여러 이력이 삭제될 때 쓰는 버전입니다.
// entries: [{ histType, histId }, ...]
export async function deleteStarredForHists({ entries, query: runQuery = defaultQuery }) {
  if (!entries || entries.length === 0) return;
  try {
    const pageIds = entries.filter((e) => e.histType === "page").map((e) => e.histId);
    const instIds = entries.filter((e) => e.histType === "inst").map((e) => e.histId);
    if (pageIds.length > 0) {
      await runQuery(
        `DELETE FROM tb_history_starred WHERE hist_type = 'page' AND hist_id = ANY($1::int[])`,
        [pageIds],
      );
    }
    if (instIds.length > 0) {
      await runQuery(
        `DELETE FROM tb_history_starred WHERE hist_type = 'inst' AND hist_id = ANY($1::int[])`,
        [instIds],
      );
    }
  } catch (err) {
    console.warn("[deleteStarredForHists] 정리 실패(무시하고 계속):", err.message);
  }
}
