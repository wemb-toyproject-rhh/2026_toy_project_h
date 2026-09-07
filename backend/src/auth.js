// RHH 자체 사용자 인증 유틸.
// 비밀번호는 bcrypt 단방향 해시로 저장하고(tb_user_rhh.password), 로그인 성공 시
// 사용자를 식별할 수 있는 JWT 토큰을 발급합니다. 이후 요청은 이 토큰으로 신원을
// 확인해서, 프론트가 보낸 user_id 를 그대로 믿지 않도록 합니다(프로젝트 API 에서 사용).
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// "로그인 상태를 유지한다" 요구사항 — 임시 계정 관리 단계라 넉넉히 7일로 둡니다.
const TOKEN_TTL = "7d";
const SALT_ROUNDS = 10;

if (!process.env.JWT_SECRET) {
  // 시크릿이 없으면 서버를 아예 못 켜게 막습니다 — 기본값으로 조용히 넘어가면
  // 토큰이 위조 가능한 상태로 운영될 수 있어서입니다.
  throw new Error("JWT_SECRET 이 .env 에 설정되어 있지 않습니다.");
}
const SECRET = process.env.JWT_SECRET;

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function issueToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: TOKEN_TTL });
}

// Authorization: Bearer <token> 헤더를 검증해서 req.userId 를 채웁니다.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다" });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "로그인이 만료되었거나 유효하지 않습니다" });
  }
}
