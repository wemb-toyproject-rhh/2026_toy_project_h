import VersionSelectBar from "../components/compare/VersionSelectBar.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import SideBySideDiff from "../components/compare/SideBySideDiff.jsx";
import styles from "./CompareHistoryPage.module.css";

const LIFECYCLES = [
  { id: "beforeLoad", label: "beforeLoad", modified: true },
  { id: "loaded", label: "loaded", modified: false },
  { id: "beforeUnLoad", label: "beforeUnLoad", modified: false },
];

const LEFT = {
  label: "버전 A · PR #10",
  lines: [
    { no: 19, type: null, code: "var INTRO_PATHS = [" },
    { no: 20, type: "del", code: "  'old/path.gltf'" },
    { no: 21, type: null, code: "];" },
  ],
};

const RIGHT = {
  label: "버전 B · PR #12",
  lines: [
    { no: 19, type: null, code: "var INTRO_PATHS = [" },
    { no: 20, type: "add", code: "  '/new/statcom_BD.gltf'" },
    { no: 21, type: null, code: "];" },
  ],
};

export default function CompareHistoryPage() {
  return (
    <div className={styles.page}>
      <VersionSelectBar />
      <SubTabGroup lifecycles={LIFECYCLES} />
      <SideBySideDiff left={LEFT} right={RIGHT} />
    </div>
  );
}
