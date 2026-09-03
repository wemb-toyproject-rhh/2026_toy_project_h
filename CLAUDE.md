# RENOBIT History Hub (RHH) - Project Guidelines

## Project Overview

- **Description:** RENOBIT 전용 외부 버전 관리(사이드카) SPA 웹 서비스.
- **Key Flow:** RENOBIT DB 트리거 기반의 변경 이력(`tb_page_hist`, `tb_instance_hist`)을 연동하여 Git PR 형태의 UI로 이력 조회, Diff 비교, 마크다운 비고 작성 및 원클릭 스크립트 복사 기능 제공.
- **Tech Stack:** React, Vite, JavaScript/TypeScript, Monaco Editor (Diff Viewer), CSS / Styled Systems.
- **Target Resolution:** Responsive Desktop Layout

## Project Directory Structure

npm workspaces monorepo — root `package.json` lists `frontend` and `backend` as workspaces; `npm install` at the repo root installs both.

```text
frontend/            # React/Vite SPA (this is the only workspace implemented so far)
├── index.html
├── vite.config.js   # dev proxy: /api -> http://localhost:4000 (backend)
└── src/
    ├── assets/          # Static files (images, icons)
    ├── components/      # Reusable UI components
    │   ├── common/      # Generic UI (Buttons, Modals, Tabs, Badges)
    │   ├── history/     # View 1: HistoryList, PRCard, SidebarFilter
    │   ├── detail/      # View 2: HistoryDetail, ConversationPanel, SubTabGroup
    │   └── compare/     # View 3: VersionCompare, SideBySideDiff
    ├── services/        # API call functions & Axios setup
    ├── mocks/           # Mock data JSONs (mockHistory.json, etc.)
    ├── hooks/           # Custom React Hooks
    ├── pages/           # Main Page layouts (HistoryPage)
    ├── styles/          # Global styles & CSS variables
    ├── App.jsx          # Root component & Route handling
    └── main.jsx         # Entry point

backend/             # Node API server — owned by a separate teammate; internal
├── .env.example     # structure is theirs to design, not dictated here
└── src/
    └── server.js
```

## Architecture & Data Context

- **DB Trigger Integration (⚠️ Local Simulation Only, Not Native RENOBIT):** `tb_page_hist` / `tb_instance_hist`는 RENOBIT 제품 자체에 존재하는 테이블이 아님. 실제 RENOBIT은 `TB_PAGE` / `TB_INSTANCE`에 상태를 저장하며 히스토리 테이블이 없음 (CSS/JS/HTML 스크립트도 개별 컬럼이 아니라 `PROPS` JSON 컬럼 안에 들어있음). 현재 두 테이블은 별도 로컬 개발 DB에 수동 설치한 트리거로 시뮬레이션한 것이며, 실제 상용 연동 시에는 이 가정을 재검토해야 함.
- **Local Simulation Setup:** Target RENOBIT DB triggers auto-save page history on local environment for demo.
- **Target Hierarchies & Lifecycle:**
  - Page: `CSS` / `JS` (`beforeLoad`, `loaded`, `beforeUnLoad`)
  - 2D Component: `HTML` / `CSS` / `JS` (`register`, `completed`, `beforeDestroy`, `destroy`, `preview`)
  - 3D Component: `JS` (`register`, `beforeDestroy`, `destroy`)

## Essential Commands

Run from the repo root (workspaces-aware):

- `npm run dev`: Start Vite development server (frontend workspace)
- `npm run dev:api`: Start the backend API server (backend workspace — not yet implemented)
- `npm run build`: Build production SPA bundle (frontend workspace)
- `npm run lint`: Run ESLint checks (frontend workspace)

## Code & Conventions Guidelines

- **UI/UX Rules:**
  - Sub-tab interface matching RENOBIT native UI: Primary tabs (`CSS`, `JS`) and secondary lifecycle sub-tabs (`beforeLoad`, `loaded`, etc.).
  - Visually highlight modified sub-tabs using a red dot (`•`) indicator instead of opening full tree views.
  - History detail view (View 2) MUST feature Markdown note with toggleable view/edit modes (`[비고 수정]` -> `[저장]`/`[취소]`).
  - History list view (View 1) uses checkboxes to select exactly 2 PRs, enabling the `[선택한 2개 이력 Diff 비교 (2/2)]` button to switch to View 3.
- **Formatting:** Keep components modularized under `/src/components` (e.g., `HistoryList`, `HistoryDetail`, `DiffViewer`, `ConversationPanel`).
- **Token Efficiency:** When modifying code, focus strictly on requested UI component files or API services. Do NOT scan irrelevant files unnecessarily.

## Backend Integration API Protocol (Draft / Mock Data Compatible)

Owned by the backend teammate; contract below is what the frontend expects.

- `GET /api/history`: Fetch PR history list (supports target filtering by page/component)
- `GET /api/history/:id`: Fetch specific PR snapshot & script diffs
- `PUT /api/history/:id/metadata`: Update PR Title & Markdown Conversation note
- `GET /api/history/compare?v1={id1}&v2={id2}`: Fetch scripts for side-by-side comparison

```

```
