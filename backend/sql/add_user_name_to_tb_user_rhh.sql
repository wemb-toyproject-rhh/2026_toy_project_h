-- tb_user_rhh 에 닉네임 컬럼 추가. 기존 계정엔 값이 없으니 NULL 허용
-- (로그인 자체엔 영향 없음 — user_id/password 만 있으면 로그인 가능).
ALTER TABLE tb_user_rhh
  ADD COLUMN IF NOT EXISTS user_name VARCHAR(100);
