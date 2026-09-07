# RHH 백엔드 API 문서

프론트엔드 개발용 참고 문서입니다. 실제 구현은 `src/server.js` 참고 — 이 문서는 요청/응답
모양과 화면별 사용처를 정리한 것이고, SQL 등 구현 detail은 코드 쪽 주석에 있습니다.

## 공통 사항

- **Base URL**: dev 환경에서는 Vite가 `/api` 경로를 백엔드(`localhost:4000`)로 프록시합니다.
- **인증**: 인증이 필요한 API는 요청 헤더에 로그인 시 받은 토큰을 실어 보내야 합니다.
  ```
  Authorization: Bearer <token>
  ```
- **에러 응답**: 전부 아래 모양입니다.
  ```json
  { "error": "사람이 읽을 수 있는 메시지" }
  ```
- 요청/응답 바디는 전부 JSON (`Content-Type: application/json`)

## 요약 표

| 화면 | Method | Endpoint | 인증 |
|---|---|---|---|
| 회원가입 | POST | `/api/rhh/users` | - |
| 로그인 | POST | `/api/rhh/login` | - |
| 계정정보 수정 *(화면 미구현)* | PUT | `/api/rhh/users/me/password` | ✅ |
| 계정정보 수정 *(화면 미구현)* | DELETE | `/api/rhh/users/me` | ✅ |
| 프로젝트 연결 | GET | `/api/rhh/projects` | ✅ |
| 프로젝트 연결 | POST | `/api/rhh/projects/test-connection` | ✅ |
| 프로젝트 연결 | POST | `/api/rhh/projects` | ✅ |
| 프로젝트 연결 | DELETE | `/api/rhh/projects/:projectId` | ✅ |
| 프로젝트 연결 | PUT | `/api/rhh/users/me/recent-project` | ✅ |
| 전체 이력 보기 | GET | `/api/history` | - |
| 전체 이력 보기 / 이력 상세 | PUT | `/api/history/:id/metadata` | - |

---

## 계정

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
  "projectRecent": "string | null"
}
```

**에러**: `400` 형식 오류 · `401` 아이디 또는 비밀번호 틀림(둘 중 뭐가 틀렸는지는 구분 안 줌, 의도된 동작) · `403` 정지된 계정(`"사용이 중지된 계정입니다"`)

---

### 비밀번호 변경 ⚠️ 화면 미구현
`PUT /api/rhh/users/me/password` — 인증 필요

계정정보 수정 화면 만들 때 사용할 API입니다.

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

### 회원 탈퇴 ⚠️ 화면 미구현
`DELETE /api/rhh/users/me` — 인증 필요

계정정보 수정 화면 만들 때 사용할 API입니다. **실제로 삭제하지 않고 비활성 처리**되며,
보유 중이던 활성 프로젝트도 같이 비활성 처리됩니다. 탈퇴 후 재로그인하면 로그인 API가
`403`(정지된 계정)으로 막습니다.

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
불가능한 정보로는 등록 자체가 거부됩니다.

**요청**
```json
{ "projectName": "string", "host": "string", "port": "string|number", "dbName": "string", "account": "string", "password": "string" }
```

**성공 (201)**: 목록 조회와 같은 모양의 항목 하나

**에러**: `400` 필드 누락/길이 초과/port 범위 오류 · `400` 연결 실패 시 `"대상 DB에 연결할 수 없습니다: (사유)"`

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

### 전체 목록 조회
`GET /api/history` — 인증 불필요

전체 이력 보기 화면이 열릴 때 한 번 호출합니다. 이력 상세/Diff(버전 비교) 화면은 이때
받은 목록을 그대로 재사용하고 별도로 호출하지 않습니다.

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

---

### 제목/비고/숨김 수정
`PUT /api/history/:id/metadata` — 인증 불필요

- 전체 이력 화면(카드 인라인 수정)은 `title`만 보냄
- 이력 상세 화면은 `title`/`comment`를 각각 따로 보냄
- "숨기기" 버튼은 `hidden`만 보냄 (실제 데이터는 삭제하지 않고 이 플래그만 바꿈)

**요청** (아래 중 하나 이상)
```json
{ "title": "string", "comment": "string", "hidden": true }
```

**성공 (200)**: 위 이력 항목과 같은 모양 (수정 반영된 상태)

**에러**: `400` id 형식 오류/셋 다 안 보냄/글자수 초과 · `404` 이력 없음

---

## 만들어만 두고 프론트가 호출하지 않는 API

| Endpoint | 원래 의도 | 왜 안 쓰는지 |
|---|---|---|
| `GET /api/history/:id` | 이력 상세 화면 | 상세 화면이 위 전체 목록에서 id로 직접 찾아 씀 |
| `GET /api/history/compare?v1=&v2=` | Diff(버전 비교) 화면 | 비교 화면도 전체 목록에서 두 항목을 직접 찾아 씀 |

여러 프로젝트의 대상 DB를 오가며 이력을 봐야 하는 상황이 다시 생기면(=전체 목록을 한
번에 다 들고 있기 어려워지면) 이 두 API가 실제로 필요해질 가능성이 높습니다.
