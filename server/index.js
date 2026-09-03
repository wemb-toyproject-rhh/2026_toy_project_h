import "dotenv/config";
import express from "express";
import { query } from "./db.js";

const app = express();
const PORT = Number(process.env.API_PORT) || 3001;

app.use(express.json({ limit: "256kb" }));

// comment 컬럼은 varchar(1000) NOT NULL 입니다.
const COMMENT_MAX = 1000;

// 이력 상세/목록에서 공통으로 쓰는 스크립트 구획. group 이 1차 탭, label 이 2차 탭입니다.
const PAGE_SECTIONS = [
  { column: "css_code", group: "CSS", label: "CSS" },
  { column: "lc_before_load", group: "JAVASCRIPT", label: "beforeLoad" },
  { column: "lc_loaded", group: "JAVASCRIPT", label: "loaded" },
  { column: "lc_before_unload", group: "JAVASCRIPT", label: "beforeUnLoad" },
];

const INSTANCE_SECTIONS = [
  { column: "html_code", group: "HTML", label: "HTML" },
  { column: "css_code", group: "CSS", label: "CSS" },
  { column: "lc_register", group: "JAVASCRIPT", label: "register" },
  { column: "lc_completed", group: "JAVASCRIPT", label: "completed" },
  { column: "lc_before_destroy", group: "JAVASCRIPT", label: "beforeDestroy" },
  { column: "lc_destroy", group: "JAVASCRIPT", label: "destroy" },
  { column: "lc_preview", group: "JAVASCRIPT", label: "preview" },
];

/**
 * 사이드바 타겟 목록.
 * tb_page_hist 의 페이지와, page_id 로 연결된 tb_instance_hist 의 인스턴스를 함께 반환합니다.
 *
 * 두 테이블을 JOIN 한 뒤 집계하면 이력 행 수만큼 곱해져서 건수가 부풀려집니다.
 * 그래서 각각 따로 집계한 뒤 page_id 로 묶습니다.
 */
app.get("/api/targets", async (req, res) => {
  try {
    const [pages, instances] = await Promise.all([
      query(`
        SELECT page_id, name, page_type, COUNT(*)::int AS hist_count
        FROM tb_page_hist
        GROUP BY page_id, name, page_type
        ORDER BY name
      `),
      query(`
        SELECT i.page_id, i.name, i.category, i.comp_name,
               COUNT(*)::int AS hist_count
        FROM tb_instance_hist i
        WHERE EXISTS (
          SELECT 1 FROM tb_page_hist p WHERE p.page_id = i.page_id
        )
        GROUP BY i.page_id, i.name, i.category, i.comp_name
        ORDER BY i.name
      `),
    ]);

    const result = pages.rows.map((page) => ({
      pageId: page.page_id,
      name: page.name,
      pageType: page.page_type,
      histCount: page.hist_count,
      instances: instances.rows
        .filter((inst) => inst.page_id === page.page_id)
        .map((inst) => ({
          name: inst.name,
          category: inst.category,
          compName: inst.comp_name,
          histCount: inst.hist_count,
        })),
    }));

    const totalCount =
      pages.rows.reduce((sum, row) => sum + row.hist_count, 0) +
      instances.rows.reduce((sum, row) => sum + row.hist_count, 0);

    res.json({ totalCount, pages: result });
  } catch (err) {
    console.error("[/api/targets]", err.message);
    res.status(500).json({ error: "DB 조회 실패", detail: err.message });
  }
});

/**
 * 이력 목록. 페이지 이력과 인스턴스 이력을 한 번에 반환합니다.
 * 화면(우측 카드 목록)에서 선택된 타겟에 따라 걸러서 씁니다.
 */
// 컬럼이 채워져 있는지(빈 문자열 아님)를 뽑는 SELECT 조각.
// PAGE_SECTIONS / INSTANCE_SECTIONS 에서 만들어서, 컬럼 목록이 두 군데서
// 따로 관리되다 어긋나는(예: HTML 컬럼 누락) 일이 없게 합니다.
const presenceColumns = (sections) =>
  sections
    .map((s) => `(${s.column} IS NOT NULL AND ${s.column} <> '') AS ${s.column}`)
    .join(",\n               ");

const GROUP_TO_TYPE = { CSS: "CSS", HTML: "HTML", JAVASCRIPT: "JS" };

app.get("/api/history", async (req, res) => {
  try {
    const [pages, instances] = await Promise.all([
      query(`
        SELECT p.hist_id, p.page_id, p.name, p.page_type, p.version,
               COALESCE(u.name, p.last_user) AS author,
               to_char(p.update_dt, 'YYYY-MM-DD HH24:MI:SS') AS saved_at, p.comment,
               ${presenceColumns(PAGE_SECTIONS)}
        FROM tb_page_hist p
        LEFT JOIN tb_user u ON u.user_id = p.last_user
        ORDER BY p.hist_id DESC
      `),
      query(`
        SELECT hist_id, inst_id, page_id, name, category, comp_name, layer_name,
               to_char(reg_dt, 'YYYY-MM-DD HH24:MI:SS') AS saved_at, comment,
               ${presenceColumns(INSTANCE_SECTIONS)}
        FROM tb_instance_hist
        ORDER BY hist_id DESC
      `),
    ]);

    // 값이 채워져 있는 라이프사이클만 변경 목록으로 뽑습니다.
    // PAGE_SECTIONS / INSTANCE_SECTIONS 를 그대로 써서 컬럼명이 아니라
    // 상세 화면과 같은 라벨을 내려줍니다 (프론트 필터 조건과도 짝을 이룹니다).
    const lifecycles = (row, sections) =>
      sections
        .filter((s) => row[s.column])
        .map((s) => ({
          type: GROUP_TO_TYPE[s.group] ?? s.group,
          lifecycle: s.group === "JAVASCRIPT" ? s.label : null,
        }));

    const pageItems = pages.rows.map((row) => ({
      kind: "page",
      targetId: `page-${row.page_id}`,
      histId: Number(row.hist_id),
      pageId: row.page_id,
      name: row.name,
      label: "Page",
      author: row.author || "-",
      savedAt: row.saved_at,
      comment: row.comment || "",
      changes: lifecycles(row, PAGE_SECTIONS),
    }));

    const instanceItems = instances.rows.map((row) => ({
      kind: "instance",
      targetId: `inst-${row.page_id}-${row.name}`,
      histId: Number(row.hist_id),
      pageId: row.page_id,
      name: row.name,
      label: row.category,
      compName: row.comp_name,
      author: "-",
      savedAt: row.saved_at,
      comment: row.comment || "",
      changes: lifecycles(row, INSTANCE_SECTIONS),
    }));

    // saved_at 은 'YYYY-MM-DD HH24:MI:SS' 문자열이라 사전순 정렬이 곧 시간순입니다.
    const items = [...pageItems, ...instanceItems].sort((a, b) =>
      String(b.savedAt ?? "").localeCompare(String(a.savedAt ?? "")),
    );

    res.json({ items });
  } catch (err) {
    console.error("[/api/history]", err.message);
    res.status(500).json({ error: "DB 조회 실패", detail: err.message });
  }
});

/**
 * 이력 상세.
 * 선택한 hist_id 의 스크립트와, 같은 타겟의 가장 최신 이력의 스크립트를 함께 반환합니다.
 * 화면에서는 이 둘을 비교해 diff 를 그립니다.
 */
app.get("/api/history/:kind/:histId", async (req, res) => {
  const { kind, histId } = req.params;

  if (kind !== "page" && kind !== "instance") {
    return res.status(400).json({ error: "kind 는 page 또는 instance 여야 합니다" });
  }

  try {
    const isPage = kind === "page";
    const table = isPage ? "tb_page_hist" : "tb_instance_hist";
    const sections = isPage ? PAGE_SECTIONS : INSTANCE_SECTIONS;
    const groupKey = isPage ? "page_id" : "inst_id";
    // t 는 tb_page_hist/tb_instance_hist 자신을 가리키는 별칭입니다.
    // 페이지는 작성자 이름을 얻으려고 tb_user 를 조인하는데, tb_user 에도
    // name 컬럼이 있어 조인 후에는 t.name 처럼 구분해서 써야 합니다.
    const columns = sections.map((s) => `t.${s.column}`).join(", ");

    // timestamp 를 Date 로 받으면 JSON 변환 시 UTC 로 밀리므로, DB에서 문자열로 꺼냅니다.
    const savedAtExpr = `to_char(t.${isPage ? "update_dt" : "reg_dt"}, 'YYYY-MM-DD HH24:MI:SS')`;

    const meta = isPage
      ? `t.name, COALESCE(u.name, t.last_user) AS author, ${savedAtExpr} AS saved_at, t.comment`
      : `t.name, t.category, t.comp_name, NULL AS author, ${savedAtExpr} AS saved_at, t.comment`;

    const fromClause = isPage
      ? `${table} t LEFT JOIN tb_user u ON u.user_id = t.last_user`
      : `${table} t`;

    const currentResult = await query(
      `SELECT t.hist_id, t.${groupKey}, ${meta}, ${columns} FROM ${fromClause} WHERE t.hist_id = $1`,
      [histId],
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: `이력을 찾을 수 없습니다 (hist_id=${histId})` });
    }

    const current = currentResult.rows[0];

    // 같은 타겟의 가장 최신 이력
    const latestResult = await query(
      `SELECT hist_id, ${savedAtExpr} AS saved_at, ${columns}
       FROM ${table} t
       WHERE ${groupKey} = $1
       ORDER BY hist_id DESC LIMIT 1`,
      [current[groupKey]],
    );

    const latest = latestResult.rows[0] ?? current;

    res.json({
      kind,
      label: isPage ? "Page" : current.category,
      name: current.name,
      pageId: current.page_id,
      current: {
        histId: Number(current.hist_id),
        savedAt: current.saved_at,
        author: current.author,
        comment: current.comment || "",
      },
      latest: {
        histId: Number(latest.hist_id),
        savedAt: latest.saved_at,
      },
      isLatest: Number(current.hist_id) === Number(latest.hist_id),
      sections: sections.map((section) => ({
        id: section.column,
        group: section.group,
        label: section.label,
        current: current[section.column] ?? "",
        latest: latest[section.column] ?? "",
        modified: (current[section.column] ?? "") !== (latest[section.column] ?? ""),
      })),
    });
  } catch (err) {
    console.error("[/api/history/:kind/:histId]", err.message);
    res.status(500).json({ error: "DB 조회 실패", detail: err.message });
  }
});

/**
 * 비고(comment) 저장. hist_id 가 두 테이블 모두 기본키라 정확히 한 행만 수정됩니다.
 * 이 API 는 DB에 쓰기를 수행하는 유일한 지점입니다.
 */
app.patch("/api/history/:kind/:histId/comment", async (req, res) => {
  const { kind, histId } = req.params;
  const { comment } = req.body ?? {};

  if (kind !== "page" && kind !== "instance") {
    return res.status(400).json({ error: "kind 는 page 또는 instance 여야 합니다" });
  }
  if (typeof comment !== "string") {
    return res.status(400).json({ error: "comment 는 문자열이어야 합니다" });
  }
  if (comment.length > COMMENT_MAX) {
    return res
      .status(400)
      .json({ error: `비고는 ${COMMENT_MAX}자를 넘을 수 없습니다`, max: COMMENT_MAX });
  }
  if (!/^\d+$/.test(histId)) {
    return res.status(400).json({ error: "hist_id 는 숫자여야 합니다" });
  }

  // kind 를 위에서 검증했으므로 테이블명은 고정된 두 값 중 하나입니다.
  const table = kind === "page" ? "tb_page_hist" : "tb_instance_hist";

  try {
    const result = await query(
      `UPDATE ${table} SET comment = $1 WHERE hist_id = $2
       RETURNING hist_id, comment`,
      [comment, histId],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `이력을 찾을 수 없습니다 (hist_id=${histId})` });
    }

    console.log(`[comment] ${table} hist_id=${histId} 저장 (${comment.length}자)`);
    res.json({
      histId: Number(result.rows[0].hist_id),
      comment: result.rows[0].comment,
    });
  } catch (err) {
    console.error("[PATCH comment]", err.message);
    res.status(500).json({ error: "비고 저장 실패", detail: err.message });
  }
});

/**
 * 이력 삭제. hist_id 가 두 테이블 모두 기본키라 정확히 한 행만 삭제됩니다.
 * 프론트에서는 확인 모달에 "이력"을 입력해야 이 API 를 호출합니다.
 */
app.delete("/api/history/:kind/:histId", async (req, res) => {
  const { kind, histId } = req.params;

  if (kind !== "page" && kind !== "instance") {
    return res.status(400).json({ error: "kind 는 page 또는 instance 여야 합니다" });
  }
  if (!/^\d+$/.test(histId)) {
    return res.status(400).json({ error: "hist_id 는 숫자여야 합니다" });
  }

  // kind 를 위에서 검증했으므로 테이블명은 고정된 두 값 중 하나입니다.
  const table = kind === "page" ? "tb_page_hist" : "tb_instance_hist";

  try {
    const result = await query(
      `DELETE FROM ${table} WHERE hist_id = $1 RETURNING hist_id`,
      [histId],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `이력을 찾을 수 없습니다 (hist_id=${histId})` });
    }

    console.log(`[delete] ${table} hist_id=${histId} 삭제`);
    res.json({ histId: Number(result.rows[0].hist_id) });
  } catch (err) {
    console.error("[DELETE history]", err.message);
    res.status(500).json({ error: "이력 삭제 실패", detail: err.message });
  }
});

// DB 연결 확인용
app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API 서버 실행 중 → http://localhost:${PORT}`);
  console.log(`  DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
