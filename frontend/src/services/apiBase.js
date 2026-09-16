// 개발 모드(npm run dev)에서는 vite.config.js의 /api 프록시가 localhost:4000
// 백엔드로 대신 전달해줘서 상대경로("/api/...")만으로 충분합니다. 하지만 GitHub
// Pages처럼 정적 파일만 서빙하는 곳에 빌드해서 올리면 그 프록시가 없어서, 상대경로
// 요청이 백엔드가 없는 그 정적 사이트 자신에게 가버립니다 — 빌드 시점에
// VITE_API_BASE_URL을 실제 백엔드 주소로 설정해두면(.env.production 또는 CI 환경
// 변수), 아래 상수가 그 주소를 그대로 API_ORIGIN으로 씁니다. 안 정해져 있으면 빈
// 문자열이라 지금까지와 동일하게 상대경로로 동작합니다(개발 모드는 항상 이 경우).
export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ?? "";
