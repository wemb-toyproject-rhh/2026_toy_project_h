# API_sub.md — 이번에 전달할 내용만 발췌

`API.md`(전체 API 문서)에서, 지금 요청하신 부분만 뽑아둔 파일입니다. 매번 전체 문서를
주기 애매할 때 이 파일 내용만 갈아끼워서 전달하는 용도라, **여기 내용은 다음 요청이
오면 다른 내용으로 덮어써집니다** — 계속 남겨둘 내용이면 `API.md` 쪽을 보세요.

---

## 프로젝트 연결 화면 — RENOBIT/이력기능 설치 여부 확인 + 자동 설치

`main` 반영 완료. **API 호출 횟수는 지금과 동일**합니다 — 새 호출이 추가되는 게 아니라,
기존 `연결 테스트` API 응답에 정보가 더 들어있는 것 + 자동 설치용 API 1개가 추가된 것.

### 1. 기존 `POST /api/rhh/projects/test-connection` 응답에 `schema` 필드 추가

**요청**: 기존과 동일(변경 없음)

**성공 응답 (200)**
```json
{
  "ok": true,
  "schema": {
    "base":       { "tb_page": true, "tb_instance": true },
    "required":   { "tb_page_hist": true, "tb_instance_hist": true, "trg_tb_page_hist": true, "trg_tb_instance_hist": true },
    "optional":   { "tb_history_starred": false, "tb_alarm_check": false, "tb_history_comment": false },
    "management": { "tb_user_rhh": false, "tb_project_list": false }
  }
}
```
- `schema`가 `null`일 수도 있음 = "확인 자체에 실패"(예: 권한 문제) → **"없음"과 다르게 취급**, 아래 화면 표시 규칙 참고
- `management`(`tb_user_rhh`/`tb_project_list`)는 화면에 굳이 안 보여줘도 됨 — 자동 설치 대상에는 포함되지만 사용자에게 중요한 정보는 아님

### 2. 새 API — 자동 설치

```
POST /api/rhh/projects/install-schema
body: { host, port, dbName, account, password, dryRun }
```
- `dryRun: true` → 아무것도 설치 안 하고 **"뭘 설치할지" 계획만** 반환 (설치 확인창에 보여줄 용도)
- `dryRun: false`(또는 생략) → 실제로 설치 실행

**dryRun 응답 (200)**
```json
{ "ok": true, "dryRun": true, "plan": [{ "key": "tb_page_hist", "label": "테이블 tb_page_hist", "sql": "CREATE TABLE ..." }, ...], "schema": { ... } }
```

**실제 설치 응답 (200)**
```json
{ "ok": true, "dryRun": false, "installed": ["테이블 tb_page_hist", "함수·트리거 trg_tb_page_hist", ...], "schema": { ...설치 후 최신 상태... } }
```

**실패 (400)** — 아래 두 경우 다 `{ "ok": false, "error": "..." }` 모양
- `tb_page`/`tb_instance` 자체가 없음: `"RENOBIT이 설치되지 않은 DB입니다 (tb_page/tb_instance 없음) — 자동 설치할 수 없습니다"`
- DDL 권한 없는 계정으로 시도: `"테이블/트리거를 생성할 권한이 없는 계정입니다 (DDL 권한이 있는 계정으로 다시 시도해 주세요)"`

---

## 경우의 수별 화면 표시 규칙

| # | `tb_page`/`tb_instance` | `tb_page_hist`/트리거 | 화면에 보여줄 것 | `[프로젝트 연결]` 버튼 |
|---|---|---|---|---|
| 1 | **없음** | (확인 안 해도 됨) | ⚠️ "RENOBIT이 설치되지 않은 DB입니다" | **비활성화** |
| 2 | 있음 | **없음** | ⚠️ "이력 저장 기능이 아직 설치되지 않았습니다" + `[자동 설치]` 버튼 (또는 도움말 보기) | 활성화 (경고만, 안 막음) |
| 3 | 있음 | 있음 | ✅ 정상(경고 없음, 또는 "이력 저장 기능 정상") | 활성화 |
| — | `schema === null` (확인 실패) | — | 경고 없이 그냥 통과 — "확인 못 함"을 "없음"으로 취급하면 안 됨 | 활성화 (막지 않음) |

**부가 기능(`optional`: `tb_history_starred`/`tb_alarm_check`/`tb_history_comment`)**은 위 표와 무관하게 항상 정보성으로만("부가 기능 1/3 설치됨") 보여주면 되고, 없어도 경고·차단 없음.

## 화면 흐름 (자동 설치까지 포함)

```
[연결 테스트] 클릭
  └─ schema.base 확인
       ├─ tb_page/tb_instance 없음 → 위 표의 #1 표시, 버튼 비활성화, 끝
       └─ 있음 → schema.required 확인
            ├─ 다 있음 → 표의 #3 표시, 버튼 활성화
            └─ 없는 게 있음 → 표의 #2 표시, 버튼 활성화 + [자동 설치] 버튼 노출
                 └─ [자동 설치] 클릭
                      └─ install-schema (dryRun:true) 호출 → 받은 plan의 SQL을 확인창에 보여줌
                           └─ 사용자가 "실행" 확인
                                └─ install-schema (dryRun:false) 호출 → 성공 시 화면 상태를 응답의 schema로 갱신(표의 #3로 전환)
```

`[자동 설치]`는 **연결 테스트와 별개의, 사용자가 한 번 더 눌러야 하는 액션**입니다 — 연결 테스트 버튼 하나로 설치까지 자동으로 넘어가면 안 됩니다(안전장치).
