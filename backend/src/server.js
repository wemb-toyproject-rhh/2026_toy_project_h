// Entry point for the RHH backend API server.
// CLAUDE.md 의 "Backend Integration API Protocol" 계약을 그대로 구현합니다:
//   GET  /api/history?projectId=
//   GET  /api/history/:id?projectId=
//   PUT  /api/history/:id/metadata?projectId=
//   GET  /api/history/compare?v1={id1}&v2={id2}&projectId=
// RHH 자체 사용자/프로젝트 관리는 같은 규칙으로 /api/rhh/... 아래에 둡니다.
//
// /api/history* 는 로그인(Authorization: Bearer) + 내 프로젝트인지 확인된 projectId 가
// 있어야만 호출할 수 있고, tb_page_hist/tb_instance_hist 조회는 그 프로젝트가 가리키는
// 대상 DB(projectPool.js 가 관리하는 풀)로 라우팅됩니다 — RHH 자체 DB(db.js)와는 별개입니다.
// (전체 이력 보기 화면에서 프로젝트를 바꾸면 그 DB의 이력이 보이도록 하기 위함입니다.)
import "dotenv/config";
import express from "express";
import { query } from "./db.js";
import { getAllEntries, getEntryById } from "./entries.js";
import { hashPassword, verifyPassword, issueToken, requireAuth } from "./auth.js";
import { getProjectPool, testConnection } from "./projectPool.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json({ limit: "256kb" }));

// title, comment 컬럼 모두 두 테이블 다 varchar(1000) 입니다.
const METADATA_FIELD_MAX = 1000;

// tb_user_rhh.user_id/password 컬럼도 varchar(1000) 입니다.
const USER_ID_MAX = 1000;
const PASSWORD_MIN = 4;

// tb_project_list 의 문자열 컬럼도 전부 varchar(1000) 입니다.
const PROJECT_FIELD_MAX = 1000;

// DB row(snake_case) → 응답 모양(camelCase). password 는 절대 포함하지 않습니다.
function toProjectDto(row) {
  return {
    projectId: row.project_id,
    projectName: row.project_name,
    host: row.host,
    port: row.port,
    dbName: row.db_name,
    account: row.account,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// /api/history* 는 "어느 프로젝트(대상 DB)" 이력인지 알아야 하므로 ?projectId= 를
// 필수로 받습니다. 내(req.userId) 프로젝트가 맞는지 여기서 먼저 확인하고, 맞으면 그
// 프로젝트 row(host/port/db_name/account/password)를 그대로 돌려줍니다 — 라우트는 이
// row 를 getProjectPool 에 넘겨서 대상 DB 커넥션 풀을 얻습니다.
// 실패 시 이 함수가 직접 응답을 보내고 null 을 돌려주므로, 호출부는 null 이면 바로 return 합니다.
async function resolveOwnedProject(req, res) {
  const { projectId } = req.query;
  if (typeof projectId !== "string" || !projectId.trim()) {
    res.status(400).json({ error: "projectId 쿼리 파라미터가 필요합니다" });
    return null;
  }

  const result = await query(
    `SELECT * FROM tb_project_list WHERE project_id = $1 AND user_id = $2 AND use = true`,
    [projectId, req.userId],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
    return null;
  }
  return result.rows[0];
}

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
// [전체 이력 보기 화면]이 처음 열릴 때(그리고 프로젝트를 바꿀 때마다) 호출합니다.
// ?projectId= 로 지정한 프로젝트(=대상 RENOBIT DB)에서 조회합니다. 이력 상세/Diff
// 화면은 이때 받은 목록을 그대로 재사용해서 별도로 다시 호출하지 않습니다.
app.get("/api/history", requireAuth, async (req, res) => {
  const project = await resolveOwnedProject(req, res);
  if (!project) return;

  try {
    const pool = getProjectPool(project);
    const entries = await getAllEntries({ query: (text, params) => pool.query(text, params) });
    res.json(entries);
  } catch (err) {
    console.error("[GET /api/history]", err.message);
    res.status(500).json({ error: "이력 조회 실패", detail: err.message });
  }
});

// 버전 비교. "/api/history/:id" 보다 먼저 등록해야 "compare" 가 :id 로 잡히지 않습니다.
// [Diff(버전 비교) 화면]용으로 만들어뒀지만, 그 화면은 실제로는 위 GET /api/history 로
// 이미 받아온 목록에서 클라이언트가 두 항목을 골라 비교하는 방식이라 지금은 호출되지
// 않는 API입니다(미사용).
app.get("/api/history/compare", requireAuth, async (req, res) => {
  const { v1, v2 } = req.query;
  if (!v1 || !v2) {
    return res.status(400).json({ error: "v1, v2 쿼리 파라미터가 모두 필요합니다" });
  }

  const project = await resolveOwnedProject(req, res);
  if (!project) return;

  try {
    const pool = getProjectPool(project);
    const runQuery = (text, params) => pool.query(text, params);
    const [entryV1, entryV2] = await Promise.all([
      getEntryById(v1, { query: runQuery }),
      getEntryById(v2, { query: runQuery }),
    ]);
    if (!entryV1 || !entryV2) {
      return res.status(404).json({ error: "비교할 이력을 찾을 수 없습니다" });
    }
    res.json({ v1: entryV1, v2: entryV2 });
  } catch (err) {
    console.error("[GET /api/history/compare]", err.message);
    res.status(500).json({ error: "비교 조회 실패", detail: err.message });
  }
});

// 이력 단건 조회. [이력 상세 화면]용으로 만들어뒀지만, 그 화면도 위 GET /api/history
// 로 이미 받아온 목록에서 id로 찾아 쓰는 방식이라 지금은 호출되지 않는 API입니다(미사용).
app.get("/api/history/:id", requireAuth, async (req, res) => {
  const project = await resolveOwnedProject(req, res);
  if (!project) return;

  try {
    const pool = getProjectPool(project);
    const entry = await getEntryById(req.params.id, { query: (text, params) => pool.query(text, params) });
    if (!entry) {
      return res.status(404).json({ error: `이력을 찾을 수 없습니다 (id=${req.params.id})` });
    }
    res.json(entry);
  } catch (err) {
    console.error("[GET /api/history/:id]", err.message);
    res.status(500).json({ error: "이력 조회 실패", detail: err.message });
  }
});

// 제목(title)/비고(comment)/숨김(hidden) 수정. 셋 다 선택 항목이라 넘긴 값만 저장합니다.
//   - 전체 이력 화면(카드 인라인 수정)은 title만 보냄
//   - 이력 상세 화면은 title / comment 를 각각 따로 보냄
//   - "숨기기" 버튼은 hidden 만 보냄 (실제 데이터는 삭제하지 않고 이 플래그만 바꿈)
// hist_id 가 두 테이블 모두 기본키라 정확히 한 행만 바뀝니다.
app.put("/api/history/:id/metadata", requireAuth, async (req, res) => {
  const parsed = parseId(req.params.id);
  const { title, comment, hidden } = req.body ?? {};

  if (!parsed) {
    return res.status(400).json({ error: "id 형식이 올바르지 않습니다 (예: page-39)" });
  }

  const project = await resolveOwnedProject(req, res);
  if (!project) return;
  if (title === undefined && comment === undefined && hidden === undefined) {
    return res.status(400).json({ error: "title, comment, hidden 중 하나는 있어야 합니다" });
  }

  const assignments = [];
  const values = [];
  for (const [field, rawValue] of [
    ["title", title],
    ["comment", comment],
  ]) {
    if (rawValue === undefined) continue;
    if (typeof rawValue !== "string") {
      return res.status(400).json({ error: `${field} 은 문자열이어야 합니다` });
    }
    // 화면은 title을 "#3 제목"처럼 순번을 붙여서 보여주는데(entries.js 참고), 그
    // 상태 그대로 이어서 수정하는 경우가 있어서 "#숫자" 표시용 접두사가 실제
    // 저장값에 섞여 들어올 수 있습니다. 저장 전에 그 접두사만 떼어내고 실제로
    // 입력한 제목만 남깁니다. (comment는 이 접두사가 안 붙으므로 그대로 둡니다.)
    const value = field === "title" ? rawValue.replace(/^#\d+\s*/, "") : rawValue;
    if (value.length > METADATA_FIELD_MAX) {
      return res
        .status(400)
        .json({ error: `${field} 은 ${METADATA_FIELD_MAX}자를 넘을 수 없습니다`, max: METADATA_FIELD_MAX });
    }
    values.push(value);
    assignments.push(`${field} = $${values.length}`);
  }
  if (hidden !== undefined) {
    if (typeof hidden !== "boolean") {
      return res.status(400).json({ error: "hidden 은 boolean 이어야 합니다" });
    }
    values.push(hidden);
    assignments.push(`hidden = $${values.length}`);
  }
  values.push(parsed.histId);

  try {
    const pool = getProjectPool(project);
    const runQuery = (text, params) => pool.query(text, params);
    const result = await runQuery(
      `UPDATE ${parsed.table} SET ${assignments.join(", ")} WHERE hist_id = $${values.length} RETURNING hist_id`,
      values,
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `이력을 찾을 수 없습니다 (id=${req.params.id})` });
    }

    const entry = await getEntryById(req.params.id, { query: runQuery });
    res.json(entry);
  } catch (err) {
    console.error("[PUT /api/history/:id/metadata]", err.message);
    res.status(500).json({ error: "저장 실패", detail: err.message });
  }
});

// RHH 사용자 등록. 아이디/비밀번호만 받습니다 (임시 계정 관리).
// [회원가입 화면]에서 호출합니다. 성공하면 화면이 바로 아래 로그인 API도 이어서
// 호출해서 자동 로그인시킵니다.
app.post("/api/rhh/users", async (req, res) => {
  const { userId, password } = req.body ?? {};

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "아이디를 입력해 주세요" });
  }
  if (userId.length > USER_ID_MAX) {
    return res.status(400).json({ error: `아이디는 ${USER_ID_MAX}자를 넘을 수 없습니다` });
  }
  if (typeof password !== "string" || password.length < PASSWORD_MIN) {
    return res.status(400).json({ error: `비밀번호는 최소 ${PASSWORD_MIN}자 이상이어야 합니다` });
  }

  try {
    const hashed = await hashPassword(password);
    // user_id 가 PK 라 중복이면 그냥 행이 안 생깁니다 — 별도 SELECT 로 먼저
    // 존재 여부를 확인하지 않고 ON CONFLICT 로 한 번에 처리합니다.
    const result = await query(
      `INSERT INTO tb_user_rhh (user_id, password) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING RETURNING user_id`,
      [userId, hashed],
    );
    if (result.rowCount === 0) {
      return res.status(409).json({ error: "이미 존재하는 아이디입니다" });
    }
    res.status(201).json({ userId: result.rows[0].user_id });
  } catch (err) {
    console.error("[POST /api/rhh/users]", err.message);
    res.status(500).json({ error: "사용자 등록 실패", detail: err.message });
  }
});

// RHH 로그인. 성공하면 이후 요청에 쓸 토큰을 내려줍니다.
// [로그인 화면]에서 호출합니다(회원가입 화면도 가입 직후 자동 로그인을 위해 호출).
app.post("/api/rhh/login", async (req, res) => {
  const { userId, password } = req.body ?? {};

  if (typeof userId !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "아이디와 비밀번호를 입력해 주세요" });
  }

  try {
    const result = await query(
      `SELECT user_id, password, project_recent, use FROM tb_user_rhh WHERE user_id = $1`,
      [userId],
    );
    const row = result.rows[0];

    // 아이디가 없는 경우와 비밀번호가 틀린 경우를 같은 메시지로 안내합니다
    // (계정 존재 여부가 이 메시지만으로 드러나지 않도록).
    if (!row) {
      return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });
    }
    if (!row.use) {
      return res.status(403).json({ error: "사용이 중지된 계정입니다" });
    }

    const passwordOk = await verifyPassword(password, row.password);
    if (!passwordOk) {
      return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });
    }

    const token = issueToken(row.user_id);
    res.json({ token, userId: row.user_id, projectRecent: row.project_recent });
  } catch (err) {
    console.error("[POST /api/rhh/login]", err.message);
    res.status(500).json({ error: "로그인 실패", detail: err.message });
  }
});

// [계정정보 수정 화면] 비밀번호 변경. 현재 비밀번호를 확인한 뒤에만 바꿉니다
// (로그인과 같은 방식으로 bcrypt 비교).
app.put("/api/rhh/users/me/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return res.status(400).json({ error: "현재 비밀번호와 새 비밀번호를 입력해 주세요" });
  }
  if (newPassword.length < PASSWORD_MIN) {
    return res.status(400).json({ error: `새 비밀번호는 최소 ${PASSWORD_MIN}자 이상이어야 합니다` });
  }

  try {
    const result = await query(`SELECT password FROM tb_user_rhh WHERE user_id = $1`, [req.userId]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "계정을 찾을 수 없습니다" });
    }

    const currentOk = await verifyPassword(currentPassword, row.password);
    if (!currentOk) {
      return res.status(401).json({ error: "현재 비밀번호가 올바르지 않습니다" });
    }

    const hashed = await hashPassword(newPassword);
    await query(`UPDATE tb_user_rhh SET password = $1 WHERE user_id = $2`, [hashed, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/rhh/users/me/password]", err.message);
    res.status(500).json({ error: "비밀번호 변경 실패", detail: err.message });
  }
});

// [계정정보 수정 화면] 회원 탈퇴. 실제로 지우지 않고 use=false 로만 바꿉니다 —
// 프로젝트 삭제(DELETE /api/rhh/projects/:id)와 같은 소프트 삭제 방식입니다.
// 탈퇴 확인 차원에서 비밀번호를 다시 받고, 갖고 있던 활성 프로젝트도 같이 정리합니다.
//
// 주의: requireAuth 는 JWT 서명/만료만 확인하고 매 요청마다 use 를 다시 조회하진
// 않아서, 탈퇴 직후에도 이미 발급된 토큰은 만료 전까지(최대 7일) 다른 API 호출엔
// 계속 쓰일 수 있습니다 — "계정 정지"(use=false)도 원래 같은 특성이라 이번에 새로
// 생긴 문제는 아니지만, 신경 쓰인다면 나중에 requireAuth 에서도 use 를 같이 확인하도록
// 바꿔야 합니다.
app.delete("/api/rhh/users/me", requireAuth, async (req, res) => {
  const { password } = req.body ?? {};

  if (typeof password !== "string") {
    return res.status(400).json({ error: "비밀번호를 입력해 주세요" });
  }

  try {
    const result = await query(`SELECT password FROM tb_user_rhh WHERE user_id = $1 AND use = true`, [
      req.userId,
    ]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "계정을 찾을 수 없습니다" });
    }

    const passwordOk = await verifyPassword(password, row.password);
    if (!passwordOk) {
      return res.status(401).json({ error: "비밀번호가 올바르지 않습니다" });
    }

    await query(`UPDATE tb_user_rhh SET use = false WHERE user_id = $1`, [req.userId]);
    await query(`UPDATE tb_project_list SET use = false, updated_at = now() WHERE user_id = $1 AND use = true`, [
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/rhh/users/me]", err.message);
    res.status(500).json({ error: "회원 탈퇴 실패", detail: err.message });
  }
});

// 최근 접속 프로젝트 저장. project_recent 는 FK 없이 값만 들고 있는 soft
// reference라서, 실제로 내(req.userId) 프로젝트가 맞는지 여기서 직접 확인하고 저장합니다.
// [프로젝트 연결 화면]에서 프로젝트 목록의 [접속] 버튼을 누를 때, 그리고 새 프로젝트를
// 등록해서 바로 선택될 때도 같이 호출됩니다.
app.put("/api/rhh/users/me/recent-project", requireAuth, async (req, res) => {
  const { projectId } = req.body ?? {};

  if (typeof projectId !== "string" || !projectId.trim()) {
    return res.status(400).json({ error: "projectId 를 입력해 주세요" });
  }

  try {
    const owned = await query(
      `SELECT project_id FROM tb_project_list WHERE project_id = $1 AND user_id = $2 AND use = true`,
      [projectId, req.userId],
    );
    if (owned.rowCount === 0) {
      return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
    }

    await query(`UPDATE tb_user_rhh SET project_recent = $1 WHERE user_id = $2`, [projectId, req.userId]);
    res.json({ projectRecent: projectId });
  } catch (err) {
    console.error("[PUT /api/rhh/users/me/recent-project]", err.message);
    res.status(500).json({ error: "최근 접속 프로젝트 저장 실패", detail: err.message });
  }
});

// 내 프로젝트 목록. requireAuth 가 채워준 req.userId 기준으로만 조회합니다 —
// 클라이언트가 어떤 user_id 를 보내든(애초에 안 받음) 무시하고 토큰 주인만 봅니다.
// [프로젝트 연결 화면]의 "등록된 프로젝트 목록"에서 호출합니다. [로그인 화면]도
// 로그인 직후 "프로젝트가 있으면 이력 화면, 없으면 연결 화면"을 판단하려고 한 번
// 호출합니다.
app.get("/api/rhh/projects", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM tb_project_list WHERE user_id = $1 AND use = true ORDER BY created_at DESC`,
      [req.userId],
    );
    res.json(result.rows.map(toProjectDto));
  } catch (err) {
    console.error("[GET /api/rhh/projects]", err.message);
    res.status(500).json({ error: "프로젝트 조회 실패", detail: err.message });
  }
});

// 접속 정보만 미리 검증하고 등록은 하지 않습니다. "새 프로젝트 연결" 폼에서
// [연결 테스트] 버튼이 이 API를 호출해서, 등록 전에 바로 성공/실패를 보여줍니다.
// (등록 API 자체도 아래에서 같은 검증을 다시 하므로, 이 호출을 건너뛰어도 잘못된
// 접속 정보로는 등록되지 않습니다.)
app.post("/api/rhh/projects/test-connection", requireAuth, async (req, res) => {
  const { host, port, dbName, account, password } = req.body ?? {};

  for (const [key, value] of Object.entries({ host, dbName, account, password })) {
    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({ error: `${key} 을(를) 입력해 주세요` });
    }
  }
  const portNum = Number(port);
  if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) {
    return res.status(400).json({ error: "port 는 1~65535 사이의 숫자여야 합니다" });
  }

  const result = await testConnection({ host, port: portNum, database: dbName, user: account, password });
  res.json(result);
});

// 프로젝트 등록. user_id 는 요청 본문이 아니라 토큰에서만 가져옵니다.
// 실제로 접속 가능한 정보인지 먼저 확인하고, 안 되면 등록 자체를 거부합니다 —
// 잘못된 접속 정보가 목록에 들어가면 나중에 이력 조회가 매번 500으로 실패하기 때문입니다.
// [프로젝트 연결 화면]에서 [연결 테스트] 통과 후 [프로젝트 연결] 버튼을 누르면 호출됩니다.
app.post("/api/rhh/projects", requireAuth, async (req, res) => {
  const { projectName, host, port, dbName, account, password } = req.body ?? {};

  const fields = { projectName, host, dbName, account, password };
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({ error: `${key} 을(를) 입력해 주세요` });
    }
    if (value.length > PROJECT_FIELD_MAX) {
      return res.status(400).json({ error: `${key} 은(는) ${PROJECT_FIELD_MAX}자를 넘을 수 없습니다` });
    }
  }
  const portNum = Number(port);
  if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) {
    return res.status(400).json({ error: "port 는 1~65535 사이의 숫자여야 합니다" });
  }

  const test = await testConnection({ host, port: portNum, database: dbName, user: account, password });
  if (!test.ok) {
    return res.status(400).json({ error: `대상 DB에 연결할 수 없습니다: ${test.error}` });
  }

  try {
    const result = await query(
      `INSERT INTO tb_project_list (project_name, host, port, db_name, account, password, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectName, host, portNum, dbName, account, password, req.userId],
    );
    res.status(201).json(toProjectDto(result.rows[0]));
  } catch (err) {
    console.error("[POST /api/rhh/projects]", err.message);
    res.status(500).json({ error: "프로젝트 등록 실패", detail: err.message });
  }
});

// 프로젝트 삭제. 실제로 지우지 않고 use=false 로만 바꿉니다(요구사항).
// 여기도 "내 프로젝트"일 때만 지워지도록 user_id 를 조건에 같이 겁니다.
// [프로젝트 연결 화면]의 프로젝트별 삭제(휴지통 아이콘) 버튼에서 호출합니다.
app.delete("/api/rhh/projects/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await query(
      `UPDATE tb_project_list SET use = false, updated_at = now()
       WHERE project_id = $1 AND user_id = $2 AND use = true
       RETURNING project_id`,
      [projectId, req.userId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
    }
    res.json({ projectId: result.rows[0].project_id });
  } catch (err) {
    console.error("[DELETE /api/rhh/projects/:projectId]", err.message);
    res.status(500).json({ error: "프로젝트 삭제 실패", detail: err.message });
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
