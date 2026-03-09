"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Button, Avatar } from "@/components/ui";
import FileIcon from "@/components/shared/FileIcon";
import { formatFileSize } from "@/lib/files";
import { createClient } from "@/lib/supabase/client";
import {
  getLibraryFileSignedUrl,
  getFileVersions,
  uploadNewVersion,
  fetchFileComments,
  addFileComment,
  deleteFileComment,
  deleteLibraryFile,
  type LibraryFileWithProfile,
  type LibraryCommentWithProfile,
} from "@/lib/library";

interface FileDetailModalProps {
  file: LibraryFileWithProfile | null;
  onClose: () => void;
  onDeleted?: () => void;
}

type Tab = "comments" | "versions";

export default function FileDetailModal({ file, onClose, onDeleted }: FileDetailModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<LibraryCommentWithProfile[]>([]);
  const [versions, setVersions] = useState<LibraryFileWithProfile[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setCurrentUserId(data.user.id);
      });
  }, []);

  // Load signed URL
  useEffect(() => {
    if (!file) return;
    setSignedUrl(null);
    setLoadingUrl(true);
    getLibraryFileSignedUrl(file.storage_path)
      .then(setSignedUrl)
      .catch(() => setSignedUrl(null))
      .finally(() => setLoadingUrl(false));
  }, [file]);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!file) return;
    setLoadingComments(true);
    try {
      const data = await fetchFileComments(file.id);
      setComments(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingComments(false);
    }
  }, [file]);

  // Load versions
  const loadVersions = useCallback(async () => {
    if (!file) return;
    setLoadingVersions(true);
    try {
      const data = await getFileVersions(file.id);
      setVersions(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingVersions(false);
    }
  }, [file]);

  useEffect(() => {
    if (!file) return;
    loadComments();
    loadVersions();
  }, [file, loadComments, loadVersions]);

  // Reset state on close
  useEffect(() => {
    if (!file) {
      setActiveTab("comments");
      setNewComment("");
      setConfirmDelete(false);
      setComments([]);
      setVersions([]);
    }
  }, [file]);

  const handleAddComment = async () => {
    if (!file || !currentUserId || !newComment.trim()) return;
    setSendingComment(true);
    try {
      await addFileComment(file.id, currentUserId, newComment.trim());
      setNewComment("");
      await loadComments();
    } catch {
      /* ignore */
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteFileComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!file) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteLibraryFile(file.id);
      onClose();
      onDeleted?.();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !file || !currentUserId) return;
    setUploadingVersion(true);
    try {
      await uploadNewVersion(file.id, selectedFile, currentUserId);
      await loadVersions();
    } catch {
      /* ignore */
    } finally {
      setUploadingVersion(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isImage = file?.file_type.startsWith("image/");
  const isPdf = file?.file_type === "application/pdf";
  const isVideo = file?.file_type.startsWith("video/");

  return (
    <Modal open={!!file} onClose={onClose} title={file?.file_name ?? ""} className="max-w-2xl">
      {file && (
        <div className="space-y-4">
          {/* File Preview */}
          <div className="rounded-xl bg-card/50 border border-border p-4 flex items-center justify-center min-h-[200px]">
            {loadingUrl ? (
              <div className="text-muted text-sm animate-pulse">読み込み中...</div>
            ) : isImage && signedUrl ? (
              <img
                src={signedUrl}
                alt={file.file_name}
                className="max-h-[300px] max-w-full rounded-lg object-contain"
              />
            ) : isPdf && signedUrl ? (
              <iframe
                src={signedUrl}
                title={file.file_name}
                className="w-full h-[300px] rounded-lg border-0"
              />
            ) : isVideo && signedUrl ? (
              <video
                src={signedUrl}
                controls
                className="max-h-[300px] max-w-full rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <FileIcon fileType={file.file_type} className="w-16 h-16" />
                <p className="text-sm text-muted">{file.file_name}</p>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="rounded-xl bg-card/50 border border-border p-4 space-y-2">
            <div className="flex items-center gap-3">
              {file.uploader && (
                <Avatar
                  src={file.uploader.avatar_url}
                  name={file.uploader.display_name}
                  size="sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted">
                  {formatFileSize(file.file_size)} ・ {formatDate(file.created_at)}
                  {file.uploader && ` ・ ${file.uploader.display_name}`}
                </p>
              </div>
            </div>
            {file.description && (
              <p className="text-sm text-muted mt-2">{file.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                if (signedUrl) window.open(signedUrl, "_blank");
              }}
              disabled={!signedUrl}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              ダウンロード
            </Button>
            <Button
              variant={confirmDelete ? "primary" : "ghost"}
              size="sm"
              className={confirmDelete ? "flex-1 !bg-red-600 hover:!bg-red-700" : "flex-1 text-red-400 hover:text-red-300"}
              onClick={handleDelete}
              disabled={deleting}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {confirmDelete ? "本当に削除する" : "削除"}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "comments"
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab("comments")}
            >
              コメント
              {activeTab === "comments" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "versions"
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab("versions")}
            >
              バージョン
              {activeTab === "versions" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          </div>

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <div className="space-y-3">
              {loadingComments ? (
                <p className="text-sm text-muted text-center py-4 animate-pulse">読み込み中...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">コメントはまだありません</p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5 group">
                      <Avatar
                        src={comment.profile?.avatar_url ?? null}
                        name={comment.profile?.display_name ?? "?"}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {comment.profile?.display_name ?? "不明"}
                          </span>
                          <span className="text-xs text-muted shrink-0">
                            {formatDate(comment.created_at)}
                          </span>
                          {currentUserId === comment.user_id && (
                            <button
                              className="ml-auto text-xs text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              削除
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-muted mt-0.5 break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  className="flex-1 bg-card/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="コメントを入力..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  disabled={sendingComment}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || sendingComment}
                >
                  {sendingComment ? "..." : "送信"}
                </Button>
              </div>
            </div>
          )}

          {/* Versions Tab */}
          {activeTab === "versions" && (
            <div className="space-y-3">
              {loadingVersions ? (
                <p className="text-sm text-muted text-center py-4 animate-pulse">読み込み中...</p>
              ) : versions.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">バージョン履歴はありません</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg bg-card/50 border border-border p-3"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent text-xs font-bold shrink-0">
                        v{v.version}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.file_name}</p>
                        <p className="text-xs text-muted">
                          {formatFileSize(v.file_size)} ・ {formatDate(v.created_at)}
                          {v.uploader && ` ・ ${v.uploader.display_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload New Version */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUploadVersion}
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingVersion}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {uploadingVersion ? "アップロード中..." : "新しいバージョンをアップロード"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
