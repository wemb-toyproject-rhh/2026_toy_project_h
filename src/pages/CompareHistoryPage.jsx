import { useLocation } from "react-router-dom";
import mockHistory from "../mocks/mockHistory.json";
import BackLink from "../components/common/BackLink.jsx";
import VersionSelectBar from "../components/compare/VersionSelectBar.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import SideBySideDiff from "../components/compare/SideBySideDiff.jsx";
import styles from "./CompareHistoryPage.module.css";

const DEFAULT_IDS = [10, 12];

const LIFECYCLES = [
  { id: "beforeLoad", label: "beforeLoad", modified: true },
  { id: "loaded", label: "loaded", modified: false },
  { id: "beforeUnLoad", label: "beforeUnLoad", modified: false },
];

const DIFF_A = [
  { no: 19, type: null, code: "var INTRO_PATHS = [" },
  { no: 20, type: "del", code: "  'old/path.gltf'" },
  { no: 21, type: null, code: "];" },
];

const DIFF_B = [
  { no: 19, type: null, code: "var INTRO_PATHS = [" },
  { no: 20, type: "add", code: "  '/new/statcom_BD.gltf'" },
  { no: 21, type: null, code: "];" },
];

export default function CompareHistoryPage() {
  const { state } = useLocation();
  const [idA, idB] = state?.ids ?? DEFAULT_IDS;
  const versionA = mockHistory.history.find((h) => h.id === idA);
  const versionB = mockHistory.history.find((h) => h.id === idB);

  return (
    <div className={styles.page}>
      <BackLink />

      <VersionSelectBar versionA={versionA} versionB={versionB} />
      <SubTabGroup lifecycles={LIFECYCLES} />
      <SideBySideDiff
        left={{ label: `버전 A · PR #${versionA?.id}`, lines: DIFF_A }}
        right={{ label: `버전 B · PR #${versionB?.id}`, lines: DIFF_B }}
      />
    </div>
  );
}
