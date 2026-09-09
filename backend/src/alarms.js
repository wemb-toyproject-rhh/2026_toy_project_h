// 미확인 알람(변경 이력 중 아직 안 본 것) 관련 조회/처리.
//
// tb_alarm_check 는 tb_page_hist/tb_instance_hist 와 같은 대상 DB(프로젝트가
// 가리키는 RENOBIT DB)에 있습니다 — RHH 관리 DB(db.js)와는 별개이고, 어느 사용자가
// 어느 이력을 "확인"했는지는 (user_id, hist_type, hist_id) 조합으로 기록됩니다.
// 트리거로 미리 만들어두지 않고, entries.js 가 이미 갖고 있는 전체 이력 목록에서
// tb_alarm_check 에 없는 것만 골라내는 방식이라 새 테이블 하나 말고는 아무것도
// 추가로 필요하지 않습니다.
//
//   CREATE TABLE tb_alarm_check (
//     user_id    INTEGER NOT NULL,
//     hist_type  VARCHAR(10) NOT NULL,   -- 'page' | 'inst' (entries.js 의 id 접두사와 동일)
//     hist_id    INTEGER NOT NULL,
//     checked_at TIMESTAMP NOT NULL DEFAULT now(),
//     PRIMARY KEY (user_id, hist_type, hist_id)
//   );
import { query as defaultQuery } from "./db.js";
import { getAllEntries } from "./entries.js";

// entries.js 가 만드는 id 는 "page-39" / "inst-101" 형식입니다. tb_alarm_check 의
// hist_type/hist_id 컬럼은 그 접두사/숫자를 그대로 나눠 담습니다.
function splitEntryId(id) {
  const at = id.indexOf("-");
  if (at === -1) return null;
  const histType = id.slice(0, at);
  const histId = id.slice(at + 1);
  if (!/^\d+$/.test(histId)) return null;
  if (histType !== "page" && histType !== "inst") return null;
  return { histType, histId };
}

async function fetchCheckedIds(runQuery, userId) {
  const { rows } = await runQuery(`SELECT hist_type, hist_id FROM tb_alarm_check WHERE user_id = $1`, [
    userId,
  ]);
  return new Set(rows.map((row) => `${row.hist_type}-${row.hist_id}`));
}

// 로그인한 사용자가 이 프로젝트에서 아직 확인하지 않은 이력만 돌려줍니다.
// (숨김 처리된 이력은 getAllEntries 가 기본으로 이미 빼줍니다.)
export async function getUnreadEntries({ userId, query: runQuery = defaultQuery }) {
  const [entries, checkedIds] = await Promise.all([
    getAllEntries({ query: runQuery }),
    fetchCheckedIds(runQuery, userId),
  ]);
  return entries.filter((entry) => !checkedIds.has(entry.id));
}

// 이력 하나를 "확인함"으로 기록합니다. 이미 확인한 것이면 조용히 무시합니다.
// id 형식이 잘못됐으면 false 를 돌려주고(호출부가 400 처리), 정상이면 true.
export async function checkEntry({ userId, id, query: runQuery = defaultQuery }) {
  const parsed = splitEntryId(id);
  if (!parsed) return false;

  await runQuery(
    `INSERT INTO tb_alarm_check (user_id, hist_type, hist_id) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [userId, parsed.histType, parsed.histId],
  );
  return true;
}

// 지금 시점 기준 미확인 전체를 한 번에 확인 처리합니다("전체알림확인" 버튼용).
// 몇 건을 처리했는지 돌려줍니다.
export async function checkAllEntries({ userId, query: runQuery = defaultQuery }) {
  const unread = await getUnreadEntries({ userId, query: runQuery });
  if (unread.length === 0) return 0;

  const values = [];
  const placeholders = unread.map((entry, index) => {
    const parsed = splitEntryId(entry.id);
    values.push(userId, parsed.histType, parsed.histId);
    const base = index * 3;
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });

  await runQuery(
    `INSERT INTO tb_alarm_check (user_id, hist_type, hist_id) VALUES ${placeholders.join(", ")}
     ON CONFLICT DO NOTHING`,
    values,
  );
  return unread.length;
}
