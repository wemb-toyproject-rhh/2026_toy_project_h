import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProjects } from "../../context/ProjectContext.jsx";
import { fetchComments, createComment, updateComment, deleteComment } from "../../services/commentApi.js";
import Button from "../common/Button.jsx";
import Icon from "../common/Icon.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";
import styles from "./CommentThread.module.css";

const COMMENT_MAX = 1000;

function formatTimestamp(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CommentThread({ entryId, onCountChange }) {
  const { token, userId, userName } = useAuth();
  const { currentProject } = useProjects();
  const projectId = currentProject?.id ?? null;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 대댓글 — 백엔드에 아직 부모 댓글 관계가 없어서, 실제로 저장되진 않고 이
  // 화면을 보는 동안만 유지되는 로컬 미리보기입니다(새로고침하면 사라짐).
  // parentCommentId -> 답글 배열.
  const [localReplies, setLocalReplies] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    setLocalReplies({});
    setReplyingToId(null);
    setReplyDraft("");
  }, [entryId]);

  const load = useCallback(() => {
    if (!token || !projectId || !entryId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetchComments(token, projectId, entryId)
      .then(setComments)
      .catch((err) => setError(err.message || "댓글을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [token, projectId, entryId]);

  useEffect(() => {
    load();
  }, [load]);

  // 위쪽 점프 링크에 보여줄 개수를, 목록이 바뀔 때마다(로드/작성/삭제) 그대로 반영합니다.
  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

  const handlePost = async () => {
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    setPostError("");
    try {
      const created = await createComment(token, projectId, entryId, content);
      setComments((prev) => [...prev, created]);
      setDraft("");
    } catch (err) {
      setPostError(err.message || "댓글 작성에 실패했습니다");
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.commentId);
    setEditDraft(comment.content);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const commitEdit = async (commentId) => {
    const content = editDraft.trim();
    if (!content) return;
    setEditSaving(true);
    setEditError("");
    try {
      const updated = await updateComment(token, projectId, commentId, content);
      setComments((prev) => prev.map((c) => (c.commentId === commentId ? updated : c)));
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || "댓글 수정에 실패했습니다");
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    const commentId = deleteTargetId;
    setDeleteTargetId(null);
    setDeleting(true);
    try {
      await deleteComment(token, projectId, commentId);
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    } catch (err) {
      setError(err.message || "댓글 삭제에 실패했습니다");
    } finally {
      setDeleting(false);
    }
  };

  const startReply = (commentId) => {
    setReplyingToId(commentId);
    setReplyDraft("");
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyDraft("");
  };

  const submitReply = (parentCommentId) => {
    const content = replyDraft.trim();
    if (!content) return;
    const reply = {
      localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      userName,
      content,
      createdAt: new Date().toISOString(),
    };
    setLocalReplies((prev) => ({
      ...prev,
      [parentCommentId]: [...(prev[parentCommentId] ?? []), reply],
    }));
    setReplyingToId(null);
    setReplyDraft("");
  };

  const deleteLocalReply = (parentCommentId, localId) => {
    setLocalReplies((prev) => ({
      ...prev,
      [parentCommentId]: (prev[parentCommentId] ?? []).filter((reply) => reply.localId !== localId),
    }));
  };

  return (
    <div id="comment-thread" className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>댓글{comments.length > 0 ? ` ${comments.length}` : ""}</span>
      </div>

      {loading && <p className={styles.stateMessage}>불러오는 중...</p>}

      {!loading && error && (
        <div className={styles.stateMessage}>
          <span>{error}</span>
          <button type="button" className={styles.retryBtn} onClick={load}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <ul className={styles.list}>
            {comments.length === 0 && <li className={styles.empty}>아직 댓글이 없습니다.</li>}
            {comments.map((comment) => {
              const isMine = comment.userId === userId;
              const isEditing = editingId === comment.commentId;
              return (
                <li key={comment.commentId} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={styles.author}>{comment.userName || comment.userId}</span>
                    <span className={styles.time}>
                      {formatTimestamp(comment.createdAt)}
                      {comment.updatedAt !== comment.createdAt ? " (수정됨)" : ""}
                    </span>
                    {!isEditing && (
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.replyBtn}
                          onClick={() =>
                            replyingToId === comment.commentId ? cancelReply() : startReply(comment.commentId)
                          }
                        >
                          답글
                        </button>
                        {isMine && (
                          <>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              aria-label="댓글 수정"
                              title="댓글 수정"
                              onClick={() => startEdit(comment)}
                            >
                              <Icon name="pencil" size={12} />
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              aria-label="댓글 삭제"
                              title="댓글 삭제"
                              disabled={deleting}
                              onClick={() => setDeleteTargetId(comment.commentId)}
                            >
                              <Icon name="trash" size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <p className={styles.content}>{comment.content}</p>
                  ) : (
                    <div className={styles.editRow}>
                      <textarea
                        className={styles.editTextarea}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        maxLength={COMMENT_MAX}
                        readOnly={editSaving}
                      />
                      <div className={styles.editFooter}>
                        {editError && <span className={styles.error}>{editError}</span>}
                        <span className={styles.charCount}>
                          {editDraft.length}/{COMMENT_MAX}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={editSaving || !editDraft.trim()}
                          onClick={() => commitEdit(comment.commentId)}
                        >
                          {editSaving ? "저장 중..." : "저장"}
                        </Button>
                        <Button variant="ghost" size="sm" disabled={editSaving} onClick={cancelEdit}>
                          취소
                        </Button>
                      </div>
                    </div>
                  )}

                  {((localReplies[comment.commentId]?.length ?? 0) > 0 ||
                    replyingToId === comment.commentId) && (
                    <ul className={styles.replyList}>
                      {(localReplies[comment.commentId] ?? []).map((reply) => (
                        <li key={reply.localId} className={styles.replyItem}>
                          <span className={styles.replyBranch} aria-hidden="true" />
                          <div className={styles.replyBody}>
                            <div className={styles.itemHeader}>
                              <span className={styles.author}>{reply.userName || reply.userId}</span>
                              <span className={styles.time}>{formatTimestamp(reply.createdAt)}</span>
                              <div className={styles.itemActions}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  aria-label="답글 삭제"
                                  title="답글 삭제"
                                  onClick={() => deleteLocalReply(comment.commentId, reply.localId)}
                                >
                                  <Icon name="trash" size={12} />
                                </button>
                              </div>
                            </div>
                            <p className={styles.content}>{reply.content}</p>
                          </div>
                        </li>
                      ))}

                      {replyingToId === comment.commentId && (
                        <li className={styles.replyItem}>
                          <span className={styles.replyBranch} aria-hidden="true" />
                          <div className={styles.editRow}>
                            <textarea
                              className={styles.editTextarea}
                              value={replyDraft}
                              onChange={(e) => setReplyDraft(e.target.value)}
                              maxLength={COMMENT_MAX}
                              placeholder="답글을 입력하세요"
                              autoFocus
                            />
                            <div className={styles.editFooter}>
                              <span className={styles.previewNote}>
                                미리보기 — 새로고침하면 사라집니다
                              </span>
                              <span className={styles.charCount}>
                                {replyDraft.length}/{COMMENT_MAX}
                              </span>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={!replyDraft.trim()}
                                onClick={() => submitReply(comment.commentId)}
                              >
                                작성
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelReply}>
                                취소
                              </Button>
                            </div>
                          </div>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <div className={styles.composer}>
            <textarea
              className={styles.composerTextarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={COMMENT_MAX}
              placeholder="댓글을 입력하세요"
              readOnly={posting}
            />
            <div className={styles.composerFooter}>
              {postError && <span className={styles.error}>{postError}</span>}
              <span className={styles.charCount}>
                {draft.length}/{COMMENT_MAX}
              </span>
              <Button variant="primary" size="sm" disabled={posting || !draft.trim()} onClick={handlePost}>
                {posting ? "작성 중..." : "작성"}
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="댓글 삭제"
        message="이 댓글을 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
