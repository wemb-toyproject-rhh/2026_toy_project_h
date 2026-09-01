import { useParams } from "react-router-dom";
import mockHistory from "../mocks/mockHistory.json";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import ConversationPanel from "../components/detail/ConversationPanel.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import DiffBlock from "../components/common/DiffBlock.jsx";
import styles from "./HistoryDetailPage.module.css";

const NOTE = {
  summary:
    "beforeLoad 라이프사이클 내 HDRI 로딩 지연 현상을 처리하고 Promise 캐시를 적용해 화면 전환 시 중복 로딩을 방지했습니다.",
  raw: "- beforeLoad 라이프사이클 내 HDRI 로딩 지연 현상 처리.\n- Promise 캐시 구조 적용하여 화면 전환 시 중복 로딩 방지.",
};

const PRIMARY_TABS = [
  { id: "css", label: "CSS", modified: false },
  { id: "js", label: "JAVASCRIPT", modified: true },
];

const LIFECYCLES = [
  { id: "beforeLoad", label: "beforeLoad", modified: true },
  { id: "loaded", label: "loaded", modified: false },
  { id: "beforeUnLoad", label: "beforeUnLoad", modified: false },
];

const DIFF_LINES = [
  { no: 18, type: null, code: "var HDRI_PATH = '/renobit/output/resource/hdr/...';" },
  { no: 19, type: "del", code: "var INTRO_GLTF_PRELOAD_PATHS = [ 'old/path.gltf' ];" },
  { no: 19, type: "add", code: "var INTRO_GLTF_PRELOAD_PATHS = [" },
  { no: 20, type: "add", code: "  '/output/resource/gltf/d3487c89.../statcom_BD.gltf'" },
  { no: 21, type: "add", code: "];" },
  { no: 22, type: null, code: "var INTRO_GLTF_LOADER_RETRY_MS = 100;" },
];

export default function HistoryDetailPage() {
  const { id } = useParams();
  const item =
    mockHistory.history.find((h) => String(h.id) === id) ?? mockHistory.history[0];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Badge tone="accent">PR #{item.id}</Badge>
          <strong className={styles.title}>{item.title}</strong>
        </div>
        <Button variant="primary">전체 스크립트 복사</Button>
      </div>

      <ConversationPanel note={NOTE} />

      <SubTabGroup
        targetLabel="[Page: main]"
        primaryTabs={PRIMARY_TABS}
        lifecycles={LIFECYCLES}
      />

      <DiffBlock lines={DIFF_LINES} />
    </div>
  );
}
