-- RHH 자체 사용자/프로젝트 관리 테이블.
-- tb_page_hist / tb_instance_hist 등 RENOBIT 시뮬레이션 테이블과 같은 DB(postgres@10.23.131.39:5434)에
-- 만들지만, RHH 애플리케이션 자체 데이터라는 점에서 구분됩니다 (RENOBIT 쪽 테이블이 아님).

-- RHH 사용자 (임시 계정 관리). user_id 를 그대로 PK 로 씁니다 — 관리자가 직접 정하는
-- 로그인 아이디라서, tb_page_hist.page_id 처럼 시스템이 UUID 를 생성해줄 필요가 없습니다.
CREATE TABLE IF NOT EXISTS tb_user_rhh (
  user_id        VARCHAR(1000) PRIMARY KEY,
  password       VARCHAR(1000) NOT NULL,      -- bcrypt 해시. 평문 저장 금지.
  project_recent VARCHAR(1000),                -- 가장 최근 접속한 tb_project_list.project_id (soft reference, FK 없음)
  use            BOOLEAN NOT NULL DEFAULT true, -- false 면 로그인 차단
  user_name      VARCHAR(100)                  -- 닉네임. 기존 계정엔 값이 없을 수 있어 NULL 허용
);

-- RHH 사용자가 등록한 프로젝트(= 연결한 RENOBIT DB 접속 정보) 목록.
-- project_id 는 사용자가 정하는 값이 아니라 등록 시 시스템이 생성하므로,
-- tb_page_hist.page_id 처럼 DB가 UUID 문자열을 만들어주는 방식을 그대로 씁니다.
CREATE TABLE IF NOT EXISTS tb_project_list (
  project_id   VARCHAR(1000) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_name VARCHAR(1000) NOT NULL,
  host         VARCHAR(1000) NOT NULL,
  port         INTEGER NOT NULL,
  db_name      VARCHAR(1000) NOT NULL,
  account      VARCHAR(1000) NOT NULL,
  password     VARCHAR(1000) NOT NULL,  -- 대상 DB 접속 비밀번호. ⚠ 아래 참고 사항 확인
  user_id      VARCHAR(1000) NOT NULL REFERENCES tb_user_rhh(user_id),
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  updated_at   TIMESTAMP NOT NULL DEFAULT now(),
  use          BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_tb_project_list_user_id ON tb_project_list(user_id);
