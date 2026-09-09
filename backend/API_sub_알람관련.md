# API_sub.md — 이번에 전달할 내용만 발췌

`API.md`(전체 API 문서)에서, 지금 요청하신 부분만 뽑아둔 파일입니다. 매번 전체 문서를
주기 애매할 때 이 파일 내용만 갈아끼워서 전달하는 용도라, **여기 내용은 다음 요청이
오면 다른 내용으로 덮어써집니다** — 계속 남겨둘 내용이면 `API.md` 쪽을 보세요.

* DB 준비물 — tb_alarm_check DDL (본인 프로젝트 DB에 직접 만들어야 함)
* API 3개 — 요청/응답/에러코드까지 각각
* 주의사항 — 과거 이력도 테이블 만들자마자 전부 미확인으로 잡히는 것

---

## 알람(미확인 이력) API

`main` 반영 완료 (PR #12). 아직 이걸 호출하는 화면은 없습니다 — 화면 설계는 프론트 자유.

**공통**: 셋 다 인증 필요(`Authorization: Bearer <token>`) + `?projectId=<내 프로젝트 id>` 필수.

### ⚠️ 먼저 확인할 것 — DB 준비물

이 API들은 프로젝트가 가리키는 대상 DB에 `tb_alarm_check` 테이블이 있어야 동작합니다.
**본인이 연결한 프로젝트 DB에 직접 생성**해야 하고, 없는 채로 호출하면 `500`이 납니다.

```sql
CREATE TABLE tb_alarm_check (
  user_id    INTEGER NOT NULL,
  hist_type  VARCHAR(10) NOT NULL,   -- 'page' | 'inst' (아래 id 접두사와 동일)
  hist_id    INTEGER NOT NULL,
  checked_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, hist_type, hist_id)
);
```

> 참고: 이미 쌓여있던 과거 이력도 이 테이블을 만든 직후엔 전부 "미확인"으로 잡힙니다
> (시점 컷오프가 없음) — 처음 켤 때 미확인 개수가 갑자기 많이 나올 수 있습니다.

---

### 1. 미확인 목록 조회
`GET /api/alarms?projectId=`

로그인한 사용자가 이 프로젝트에서 아직 "확인" 처리하지 않은 이력만 돌려줍니다.

**요청**: 없음

**성공 (200)**: `GET /api/history`와 **완전히 같은 모양**의 이력 항목 배열 (그중 미확인인
것만 걸러진 부분집합) — 그래서 이미 있는 이력 카드/리스트 컴포넌트를 그대로 재사용할 수
있을 겁니다.
```json
[
  {
    "id": "page-39 | inst-101",
    "kind": "page | 2D | 3D",
    "targetLabel": "[Page] 이름",
    "targetName": "이름",
    "title": "#번호 제목",
    "savedAt": "저장 시각",
    "...": "그 외 GET /api/history와 동일 필드"
  }
]
```

**에러**: `400` projectId 누락 · `404` 내 프로젝트가 아님

---

### 2. 개별 확인
`POST /api/alarms/:id/check?projectId=`

이력 하나를 "확인함"으로 표시합니다. `id`는 `GET /api/history`가 주는 것과 같은
`page-39`/`inst-101` 형식입니다. 이미 확인한 걸 또 호출해도 에러 없이 무시됩니다.

**요청**: 없음

**성공 (200)**
```json
{ "ok": true }
```

**에러**: `400` id 형식 오류 · `404` 내 프로젝트가 아님

---

### 3. 전체 확인
`POST /api/alarms/check-all?projectId=`

"전체알림확인" 버튼용 — 지금 시점 기준 미확인 전체를 한 번에 확인 처리합니다.

**요청**: 없음

**성공 (200)**
```json
{ "checked": 3 }
```
`checked`는 이번 호출로 새로 확인 처리된 건수입니다(이미 다 확인한 상태면 `0`).

**에러**: `404` 내 프로젝트가 아님
