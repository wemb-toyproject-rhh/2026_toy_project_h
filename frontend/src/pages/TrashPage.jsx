import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
import {
  fetchTrashEntries,
  updateHistoryMetadata,
  deleteEntryPermanently,
  emptyTrash,
} from "../services/historyApi.js";
import BackLink from "../components/common/BackLink.jsx";
import Button from "../components/common/Button.jsx";
import Icon from "../components/common/Icon.jsx";
import Badge from "../components/common/Badge.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import styles from "./TrashPage.module.css";

export default function TrashPage() {
  const { token } = useAuth();
  const { currentProject } = useProjects();
  const projectId = currentProject?.id ?? null;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [emptying, setEmptying] = useState(false);
  // window.alert 대신 화면 하단에 잠깐 떴다 사라지는 토스트로 실패를 알려줍니다.
  const [toastMessage, setToastMessage] = useState("");
  useEffect(() => {
    if (!toastMessage) return undefined;
    const timerId = setTimeout(() => setToastMessage(""), 3500);
    return () => clearTimeout(timerId);
  }, [toastMessage]);

  const load = useCallback(() => {
    if (!token || !projectId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetchTrashEntries(token, projectId)
      .then(setEntries)
      .catch((err) => setError(err.message || "휴지통을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [token, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRestore = async (id) => {
    setBusyId(id);
    try {
      await updateHistoryMetadata(token, projectId, id, { hidden: false });
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setToastMessage(err.message || "복원에 실패했습니다");
    } finally {
      setBusyId(null);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeletePermanently = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDeletePermanently = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setBusyId(id);
    try {
      await deleteEntryPermanently(token, projectId, id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setToastMessage(err.message || "영구 삭제에 실패했습니다");
    } finally {
      setBusyId(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (entries.length === 0) return;
    if (
      !window.confirm(
        `휴지통을 비우면 ${entries.length}개 이력이 전부 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 계속할까요?`,
      )
    )
      return;
    setEmptying(true);
    try {
      await emptyTrash(token, projectId);
      setEntries([]);
    } catch (err) {
      setToastMessage(err.message || "휴지통 비우기에 실패했습니다");
    } finally {
      setEmptying(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackLink />
        <Button
          variant="ghostDanger"
          size="sm"
          disabled={entries.length === 0 || emptying}
          onClick={handleEmptyTrash}
        >
          {emptying ? "비우는 중..." : "휴지통 비우기"}
        </Button>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>휴지통</h1>
        <p className={styles.subtitle}>
          삭제한 이력을 복원하거나 완전히 지울 수 있습니다. 영구 삭제는 되돌릴 수 없습니다.
        </p>
      </div>

      {!projectId && <p className={styles.stateMessage}>연결된 프로젝트가 없습니다.</p>}

      {projectId && loading && <p className={styles.stateMessage}>불러오는 중...</p>}

      {projectId && !loading && error && (
        <div className={styles.stateMessage}>
          <span>{error}</span>
          <button type="button" className={styles.stateRetry} onClick={load}>
            다시 시도
          </button>
        </div>
      )}

      {projectId && !loading && !error && entries.length === 0 && (
        <p className={styles.stateMessage}>휴지통이 비어 있습니다.</p>
      )}

      {projectId && !loading && !error && entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.row}>
              <div className={styles.rowBody}>
                <div className={styles.rowTitleRow}>
                  <Badge tone="neutral">{entry.targetLabel}</Badge>
                  <span className={styles.rowTitle}>{entry.title}</span>
                </div>
                <span className={styles.rowMeta}>
                  {entry.author ? `${entry.author} · ` : ""}
                  {entry.savedAt}
                  {entry.version ? ` · v${entry.version}` : ""}
                </span>
              </div>
              <div className={styles.rowActions}>
                <Button
                  variant="default"
                  size="sm"
                  disabled={busyId === entry.id}
                  onClick={() => handleRestore(entry.id)}
                >
                  복원
                </Button>
                <Button
                  variant="ghostDanger"
                  size="icon"
                  aria-label="영구 삭제"
                  title="영구 삭제 (되돌릴 수 없습니다)"
                  disabled={busyId === entry.id}
                  onClick={() => handleDeletePermanently(entry.id)}
                >
                  <Icon name="trash" size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toastMessage && (
        <div className={styles.toastWrap}>
          <div className={styles.toast}>{toastMessage}</div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="영구 삭제"
        message="이 이력을 완전히 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="영구 삭제"
        danger
        onConfirm={confirmDeletePermanently}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
