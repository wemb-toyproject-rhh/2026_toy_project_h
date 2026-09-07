// 프로젝트(= 사용자가 등록한 대상 RENOBIT DB)별 커넥션 풀을 캐싱합니다.
// tb_user_rhh / tb_project_list 는 항상 고정된 RHH 관리용 DB(db.js 의 pool)에 있지만,
// tb_page_hist / tb_instance_hist 는 사용자가 선택한 프로젝트가 가리키는 DB에 있어서
// db.js 와 같은 방식(pg.Pool)으로 프로젝트별로 별도 풀을 만들어 재사용합니다.
import pg from "pg";

const { Pool, Client } = pg;

// project_id -> Pool. 매 요청마다 새로 연결하지 않고 재사용합니다.
const pools = new Map();

export function getProjectPool(project) {
  let pool = pools.get(project.project_id);
  if (!pool) {
    pool = new Pool({
      host: project.host,
      port: project.port,
      database: project.db_name,
      user: project.account,
      password: project.password,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    pool.on("error", (err) => {
      console.error(`[projectPool:${project.project_id}] 유휴 커넥션 오류:`, err.message);
    });
    pools.set(project.project_id, pool);
  }
  return pool;
}

// PostgreSQL 서버가 보내는 에러 메시지는 서버의 lc_messages 로케일(주로 한글 Windows
// 환경에서 EUC-KR/CP949)로 인코딩돼 있는데, node-postgres 는 이걸 UTF-8로 그대로
// 디코딩해버립니다. 그 시점에 한글 바이트가 U+FFFD(깨진 문자)로 이미 되돌릴 수 없이
// 손상되기 때문에("wemb" 사이사이 ▤▤▤ 같은 것들), 원문을 되살리는 대신 자주 나오는
// 에러 코드(SQLSTATE)/Node 에러 코드만 알아보고 우리가 직접 깨끗한 한글 메시지로
// 바꿔줍니다. 모르는 에러인데 순수 ASCII면(예: pg 자체 타임아웃 메시지) 안전하니
// 그대로 보여주고, 그것도 아니면(=원문이 깨졌을 가능성) 안전한 일반 메시지로 대체합니다.
function describeConnectionError(err) {
  switch (err.code) {
    case "28P01": // invalid_password
    case "28000": // invalid_authorization_specification
      return "계정 또는 비밀번호가 올바르지 않습니다";
    case "3D000": // invalid_catalog_name
      return "존재하지 않는 데이터베이스입니다";
    case "ENOTFOUND":
      return "호스트를 찾을 수 없습니다";
    case "ECONNREFUSED":
      return "연결이 거부되었습니다 (host/port를 확인해 주세요)";
    case "ETIMEDOUT":
      return "연결 시간이 초과되었습니다";
    default:
      return /^[\x00-\x7F]*$/.test(err.message ?? "")
        ? err.message
        : "연결에 실패했습니다 (서버가 알 수 없는 오류를 반환했습니다)";
  }
}

async function testConnectionInner({ host, port, database, user, password }) {
  const client = new Client({ host, port, database, user, password, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: describeConnectionError(err) };
  } finally {
    // client.end() 를 기다리지 않습니다 — 연결에 실패한 클라이언트는 end() 자체가
    // 응답 없이 멈추는 경우가 있어서, 여기서 await 하면 connectionTimeoutMillis 를
    // 지키고도 함수 전체가 계속 걸려있게 됩니다. 정리는 백그라운드로 흘려보냅니다.
    client.end().catch(() => {});
  }
}

// 프로젝트 등록/수정 시점에 실제로 접속 가능한 정보인지 확인합니다. 캐시에 남기지
// 않는 일회성 커넥션이라 Pool 대신 Client 를 바로 맺었다 끊습니다.
// 같은 사내망의 RENOBIT DB라 정상 접속은 보통 100ms 안쪽이라(직접 측정함), 잘못된
// host/port 는 굳이 오래 기다리지 않고 실패로 판단합니다.
//
// connectionTimeoutMillis 는 pg 내부 동작이라 100% 보장되지 않는 경우가 있어(예:
// 응답 없이 패킷만 버리는 호스트는 OS 차원의 TCP 재시도로 더 오래 걸릴 수 있음),
// 여기서 별도의 하드 타임아웃을 걸어 이 함수가 절대 3초 넘게 안 걸리게 만듭니다.
export async function testConnection(config) {
  return Promise.race([
    testConnectionInner(config),
    new Promise((resolve) => {
      setTimeout(() => resolve({ ok: false, error: "연결 시간이 초과되었습니다" }), 3000);
    }),
  ]);
}
