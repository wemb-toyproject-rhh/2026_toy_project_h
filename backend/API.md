# RHH 백엔드 API 문서

프론트엔드 개발용 참고 문서입니다. 실제 구현은 `src/server.js` 참고 — 이 문서는 요청/응답
모양과 화면별 사용처를 정리한 것이고, SQL 등 구현 detail은 코드 쪽 주석에 있습니다.

## 공통 사항

- **Base URL**: dev 환경에서는 Vite가 `/api` 경로를 백엔드(`localhost:4000`)로 프록시합니다.
- **인증**: "필요"인 API는 요청 헤더에 로그인 시 받은 토큰을 실어 보내야 합니다. 없거나
  틀리면 `401`이 납니다.
  ```
  Authorization: Bearer <token>
  ```
- **에러 응답**: 전부 아래 모양입니다.
  ```json
  { "error": "사람이 읽을 수 있는 메시지" }
  ```
- 요청/응답 바디는 전부 JSON (`Content-Type: application/json`)
- `/api/history*`, `/api/alarms*` 는 인증 외에 **`?projectId=` 쿼리 파라미터도 필수**입니다 —
  어느 프로젝트(=대상 RENOBIT DB)의 이력/알람인지를 이걸로 정하고, 내(토큰 주인) 프로젝트가
  맞는지 확인한 뒤에만 응답합니다. 프로젝트를 하나도 안 골랐으면 애초에 호출할 수 없습니다.

## REST API 요약표

| 도메인 | Method | Path | 인증 | 프론트 호출 위치 |
|---|---|---|---|---|
| 인증/계정 | POST | `/api/rhh/users` | 불필요 | SignupPage.jsx |
| 인증/계정 | POST | `/api/rhh/login` | 불필요 | LoginPage.jsx, SignupPage.jsx(가입 후 자동 로그인) |
| 인증/계정 | PUT | `/api/rhh/users/me/nickname` | 필요 | AccountSettingsPage.jsx |
| 인증/계정 | PUT | `/api/rhh/users/me/password` | 필요 | AccountSettingsPage.jsx |
| 인증/계정 | DELETE | `/api/rhh/users/me` | 필요 | AccountSettingsPage.jsx |
| 프로젝트 | GET | `/api/rhh/projects` | 필요 | LoginPage.jsx, ProjectContext.jsx(전역 목록) |
| 프로젝트 | POST | `/api/rhh/projects/test-connection` | 필요 | ProjectConnectPage.jsx |
| 프로젝트 | POST | `/api/rhh/projects` | 필요 | ProjectConnectPage.jsx (ProjectContext.jsx 경유) |
| 프로젝트 | PUT | `/api/rhh/projects/:projectId/name` | 필요 | ProjectConnectPage.jsx (ProjectContext.jsx 경유) |
| 프로젝트 | DELETE | `/api/rhh/projects/:projectId` | 필요 | ProjectConnectPage.jsx, ProjectSwitcher.jsx (ProjectContext.jsx 경유) |
| 프로젝트 | PUT | `/api/rhh/users/me/recent-project` | 필요 | ProjectConnectPage.jsx, ProjectSwitcher.jsx (프로젝트 선택 시 자동 호출) |
| 이력 | GET | `/api/history` | 필요 | HistoryListPage.jsx (HistoryContext.jsx 경유) |
| 이력 | GET | `/api/history/:id` | 필요 | *(미사용 — 목록에서 id로 직접 찾아 씀)* |
| 이력 | GET | `/api/history/compare` | 필요 | *(미사용 — 목록에서 두 항목 직접 찾아 씀)* |
| 이력 | PUT | `/api/history/:id/metadata` | 필요 | HistoryListPage.jsx, HistoryDetailPage.jsx (HistoryContext.jsx 경유) |
| 알람 | GET | `/api/alarms` | 필요 | *(미사용 — 아직 화면 없음)* |
| 알람 | POST | `/api/alarms/check-all` | 필요 | *(미사용 — 아직 화면 없음)* |
| 알람 | POST | `/api/alarms/:id/check` | 필요 | *(미사용 — 아직 화면 없음)* |
| (헬스체크) | GET | `/api/health` | 불필요 | *(프론트 미호출 — 서버/DB 살아있는지 확인용)* |

> **인증 열 설명**: "필요"는 `Authorization: Bearer <token>` 헤더가 없으면 `401`, "불필요"는
> 헤더 없이 그냥 호출 가능(로그인 전에도 써야 하는 API들). `/api/history*`, `/api/alarms*`는
> 토큰 검사와 별개로 `?projectId=`도 항상 같이 보내야 합니다(위 공통 사항 참고).

---

## 인증/계정

### 회원가입
`POST /api/rhh/users` — 인증 불필요

**요청**
```json
{ "userId": "string", "password": "string (4자 이상)" }
```

**성공 (201)**
```json
{ "userId": "string" }
```

**에러**: `400` 형식 오류 · `409` 이미 존재하는 아이디

---

### 로그인
`POST /api/rhh/login` — 인증 불필요

**요청**
```json
{ "userId": "string", "password": "string" }
```

**성공 (200)**
```json
{
  "token": "JWT 문자열 — 이후 요청에 계속 사용",
  "userId": "string",
  "projectRecent": "string | null",
  "userName": "string | null (닉네임, 안 정했으면 null)"
}
```

**에러**: `400` 형식 오류 · `401` 아이디 또는 비밀번호 틀림(둘 중 뭐가 틀렸는지는 구분 안 줌, 의도된 동작) · `403` 정지된 계정(`"사용이 중지된 계정입니다"`)

---

### 닉네임 변경
`PUT /api/rhh/users/me/nickname` — 인증 필요

계정정보 수정 화면에서 사용합니다. 빈 문자열을 보내면 닉네임을 지웁니다(DB엔 `null`로 저장).

**요청**
```json
{ "userName": "string (최대 100자, 빈 문자열이면 삭제)" }
```

**성공 (200)**
```json
{ "userName": "string | null" }
```

**에러**: `400` 형식/길이 오류 · `404` 계정 없음

---

### 비밀번호 변경
`PUT /api/rhh/users/me/password` — 인증 필요

**요청**
```json
{ "currentPassword": "string", "newPassword": "string (4자 이상)" }
```

**성공 (200)**
```json
{ "ok": true }
```

**에러**: `400` 형식/길이 오류 · `401` 현재 비밀번호 틀림 · `404` 계정 없음

---

### 회원 탈퇴
`DELETE /api/rhh/users/me` — 인증 필요

**실제로 삭제하지 않고 비활성 처리**되며, 보유 중이던 활성 프로젝트도 같이 비활성
처리됩니다. 탈퇴 후 재로그인하면 로그인 API가 `403`(정지된 계정)으로 막습니다.

**요청**
```json
{ "password": "string (탈퇴 확인용)" }
```

**성공 (200)**
```json
{ "ok": true }
```

**에러**: `400` 비밀번호 미입력 · `401` 비밀번호 틀림 · `404` 계정 없음

---

## 프로젝트

### 목록 조회
`GET /api/rhh/projects` — 인증 필요

로그인 화면도 로그인 직후 "프로젝트 있으면 이력 화면, 없으면 연결 화면"을 판단하려고
한 번 호출합니다.

**요청**: 없음

**성공 (200)**
```json
[
  {
    "projectId": "string",
    "projectName": "string",
    "host": "string",
    "port": 5434,
    "dbName": "string",
    "account": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```
> `password` 필드는 응답에 절대 포함되지 않습니다.

---

### 연결 테스트
`POST /api/rhh/projects/test-connection` — 인증 필요

프로젝트 등록 폼의 [연결 테스트] 버튼에서 호출합니다. 등록 API도 같은 검증을 다시 하므로,
이 호출을 건너뛰어도 잘못된 접속 정보로는 등록되지 않습니다.

**요청**
```json
{ "host": "string", "port": "string|number (1~65535)", "dbName": "string", "account": "string", "password": "string" }
```

**응답 (성공/실패 모두 200)**
```json
{ "ok": true }
```
```json
{ "ok": false, "error": "실패 사유" }
```

**에러(요청 자체가 잘못된 경우만)**: `400` 필수 필드 누락, port 범위 오류

---

### 등록
`POST /api/rhh/projects` — 인증 필요

[프로젝트 연결] 버튼에서 호출합니다. **연결 테스트를 통과해야만 등록됩니다** — 접속
불가능한 정보로는 등록 자체가 거부됩니다. 내가 이미 같은 host+port+dbName 조합을
등록해뒀으면 중복 등록도 막습니다(다른 사용자가 같은 대상 DB를 등록하는 건 허용).

**요청**
```json
{ "projectName": "string", "host": "string", "port": "string|number", "dbName": "string", "account": "string", "password": "string" }
```

**성공 (201)**: 목록 조회와 같은 모양의 항목 하나

**에러**: `400` 필드 누락/길이 초과/port 범위 오류 · `409` 이미 등록한 프로젝트(같은 host/port/DB 이름 조합) · `400` 연결 실패 시 `"대상 DB에 연결할 수 없습니다: (사유)"`

---

### 이름 변경
`PUT /api/rhh/projects/:projectId/name` — 인증 필요

프로젝트 이름만 바꿉니다 — host/port/계정/비밀번호 등 접속 정보는 이 API로 못 바꿉니다
(접속 정보를 바꾸려면 삭제 후 재등록).

**요청**
```json
{ "projectName": "string" }
```

**성공 (200)**: 목록 조회와 같은 모양의 항목 하나 (수정 반영된 상태)

**에러**: `400` 형식/길이 오류 · `404` 해당 프로젝트 없음 또는 내 프로젝트가 아님

---

### 삭제
`DELETE /api/rhh/projects/:projectId` — 인증 필요

프로젝트별 삭제(휴지통) 버튼에서 호출합니다. **실제로 삭제하지 않고 비활성 처리**되어
목록 조회 시 더 이상 보이지 않게 됩니다.

**요청**: 없음 (`projectId`는 URL 경로에)

**성공 (200)**
```json
{ "projectId": "string" }
```

**에러**: `404` 해당 프로젝트 없음 또는 내 프로젝트가 아님

---

### 최근 접속 프로젝트 기록
`PUT /api/rhh/users/me/recent-project` — 인증 필요

프로젝트 목록의 [접속] 버튼을 누를 때, 그리고 새 프로젝트를 등록해서 바로 선택될 때도
같이 호출됩니다.

**요청**
```json
{ "projectId": "string" }
```

**성공 (200)**
```json
{ "projectRecent": "string" }
```

**에러**: `400` projectId 누락 · `404` 내 프로젝트가 아님

---

## 이력

이 섹션의 API는 전부 `?projectId=<내 프로젝트 id>` 를 같이 보내야 합니다 (공통 사항 참고).

### 전체 목록 조회
`GET /api/history?projectId=` — 인증 필요

전체 이력 보기 화면이 열릴 때(그리고 프로젝트를 바꿀 때마다) 한 번 호출합니다. 이력
상세/Diff(버전 비교) 화면은 이때 받은 목록을 그대로 재사용하고 별도로 호출하지 않습니다.

**요청**: 없음

**성공 (200)**: 이력 항목 배열. 항목 하나의 주요 필드:
```json
{
  "id": "page-39 | inst-101",
  "kind": "page | 2D | 3D",
  "targetId": "페이지/컴포넌트 id",
  "targetLabel": "[Page] 이름 형태의 표시용 라벨",
  "targetName": "이름",
  "title": "#번호 제목 (제목 없으면 #번호만)",
  "hidden": false,
  "author": "작성자 (page만 있음, 2D/3D는 null)",
  "version": "버전 (page만 있음, 2D/3D는 null)",
  "savedAt": "저장 시각",
  "comment": "비고(마크다운)",
  "primaryTabs": "탭 정보 배열",
  "lifecycles": "생명주기별 코드 배열",
  "cssCode": "...",
  "htmlCode": "...",
  "additions": 0,
  "deletions": 0
}
```
실제 필드는 이보다 많습니다 — 정확한 모양은 `src/entries.js`의 `buildPageEntry`/`buildInstanceEntry` 참고.

**에러**: `400` projectId 누락 · `404` 내 프로젝트가 아님

---

### 제목/비고/숨김 수정
`PUT /api/history/:id/metadata?projectId=` — 인증 필요

- 전체 이력 화면(카드 인라인 수정)은 `title`만 보냄
- 이력 상세 화면은 `title`/`comment`를 각각 따로 보냄
- "숨기기" 버튼은 `hidden`만 보냄 (실제 데이터는 삭제하지 않고 이 플래그만 바꿈)
- `title`은 화면에 `#번호 제목` 형태로 보이는데, 그 `#번호` 접두사가 섞여 들어와도
  백엔드가 저장 전에 떼어내므로 프론트는 신경 쓸 필요 없음

**요청** (아래 중 하나 이상)
```json
{ "title": "string", "comment": "string", "hidden": true }
```

**성공 (200)**: 위 이력 항목과 같은 모양 (수정 반영된 상태)

**에러**: `400` id 형식 오류/셋 다 안 보냄/글자수 초과 · `404` 프로젝트 또는 이력 없음

---

## 알람 ⚠️ 화면 미구현

미확인 알람 관련 API 3개입니다. 아직 이걸 호출하는 화면이 없습니다.

**DB 준비 필요**: 이 API들은 프로젝트가 가리키는 대상 DB에 `tb_alarm_check` 테이블이
있어야 동작합니다(없는 프로젝트에서 호출하면 `500`). 테이블 정의:
```sql
CREATE TABLE tb_alarm_check (
  user_id    INTEGER NOT NULL,
  hist_type  VARCHAR(10) NOT NULL,   -- 'page' | 'inst' (아래 id 접두사와 동일)
  hist_id    INTEGER NOT NULL,
  checked_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, hist_type, hist_id)
);
```

### 미확인 목록 조회
`GET /api/alarms?projectId=` — 인증 필요

로그인한 사용자가 이 프로젝트에서 아직 "확인" 처리하지 않은 이력만 돌려줍니다. 응답
항목 모양은 `GET /api/history`와 완전히 동일합니다(그중 미확인인 것만 걸러진 부분집합).

**요청**: 없음

**성공 (200)**: `GET /api/history`와 같은 모양의 이력 항목 배열

**에러**: `400` projectId 누락 · `404` 내 프로젝트가 아님

---

### 개별 확인
`POST /api/alarms/:id/check?projectId=` — 인증 필요

이력 하나를 "확인함"으로 표시합니다. `id`는 `GET /api/history`가 주는 것과 같은
`page-39`/`inst-101` 형식입니다. 이미 확인한 것을 또 호출해도 에러 없이 그냥 무시됩니다.

**요청**: 없음

**성공 (200)**
```json
{ "ok": true }
```

**에러**: `400` id 형식 오류 · `404` 내 프로젝트가 아님

---

### 전체 확인
`POST /api/alarms/check-all?projectId=` — 인증 필요

"전체알림확인" 버튼용 — 지금 시점 기준 미확인 전체를 한 번에 확인 처리합니다.

**요청**: 없음

**성공 (200)**
```json
{ "checked": 3 }
```
`checked`는 이번 호출로 새로 확인 처리된 건수입니다(이미 다 확인한 상태면 `0`).

**에러**: `404` 내 프로젝트가 아님
