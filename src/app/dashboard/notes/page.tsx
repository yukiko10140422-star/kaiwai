"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import PageTransition from "@/components/ui/PageTransition";
import { Avatar, Button, Modal } from "@/components/ui";
import {
  fetchMeetingNotes,
  createMeetingNote,
  updateMeetingNote,
  deleteMeetingNote,
  uploadNoteAttachments,
  listNoteAttachments,
  deleteNoteAttachment,
  type MeetingNoteWithAuthor,
  type NoteAttachment,
} from "@/lib/meeting-notes";
import { fetchProjectsWithStats } from "@/lib/projects";
import { formatFileSize } from "@/lib/files";
import { showToast } from "@/lib/toast";
import { FileText, Plus, Calendar, FolderOpen, Trash2, Edit3, ChevronLeft, Paperclip, X, Download, File as FileIcon } from "lucide-react";

type ViewMode = "list" | "create" | "view" | "edit";

export default function NotesPage() {
  const [notes, setNotes] = useState<MeetingNoteWithAuthor[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedNote, setSelectedNote] = useState<MeetingNoteWithAuthor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Attachment state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [savedAttachments, setSavedAttachments] = useState<NoteAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetchMeetingNotes(),
      fetchProjectsWithStats(),
    ])
      .then(([notes, projects]) => {
        setNotes(notes);
        setProjects(projects.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMeetingDate(new Date().toISOString().slice(0, 10));
    setProjectId("");
    setPendingFiles([]);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const loadAttachments = useCallback(async (noteId: string) => {
    setLoadingAttachments(true);
    try {
      const attachments = await listNoteAttachments(noteId);
      setSavedAttachments(attachments);
    } catch {
      setSavedAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, []);

  const handleDeleteAttachment = useCallback(async (att: NoteAttachment) => {
    try {
      await deleteNoteAttachment(att.storage_path);
      setSavedAttachments((prev) => prev.filter((a) => a.storage_path !== att.storage_path));
      showToast("ファイルを削除しました", "success");
    } catch {
      showToast("ファイルの削除に失敗しました", "error");
    }
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const note = await createMeetingNote({
        title: title.trim(),
        content,
        meeting_date: meetingDate,
        project_id: projectId || null,
      });

      // Upload pending files
      if (pendingFiles.length > 0) {
        try {
          await uploadNoteAttachments(note.id, pendingFiles);
        } catch {
          showToast("一部のファイルのアップロードに失敗しました", "error");
        }
      }

      const updated = await fetchMeetingNotes();
      setNotes(updated);
      resetForm();
      setViewMode("list");
      showToast("議事録を作成しました", "success");
    } catch {
      showToast("議事録の作成に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedNote || !title.trim()) return;
    setSubmitting(true);
    try {
      await updateMeetingNote(selectedNote.id, {
        title: title.trim(),
        content,
        meeting_date: meetingDate,
        project_id: projectId || null,
      });

      // Upload any new pending files
      if (pendingFiles.length > 0) {
        try {
          await uploadNoteAttachments(selectedNote.id, pendingFiles);
        } catch {
          showToast("一部のファイルのアップロードに失敗しました", "error");
        }
      }

      const updated = await fetchMeetingNotes();
      setNotes(updated);
      const updatedNote = updated.find((n) => n.id === selectedNote.id);
      if (updatedNote) setSelectedNote(updatedNote);
      setPendingFiles([]);
      setViewMode("view");
      showToast("議事録を更新しました", "success");
    } catch {
      showToast("議事録の更新に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMeetingNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeleteTarget(null);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setViewMode("list");
      }
      showToast("議事録を削除しました", "success");
    } catch {
      showToast("議事録の削除に失敗しました", "error");
    }
  };

  const openCreate = () => {
    resetForm();
    setViewMode("create");
  };

  const openView = (note: MeetingNoteWithAuthor) => {
    setSelectedNote(note);
    setViewMode("view");
    loadAttachments(note.id);
  };

  const openEdit = () => {
    if (!selectedNote) return;
    setTitle(selectedNote.title);
    setContent(selectedNote.content);
    setMeetingDate(selectedNote.meeting_date);
    setProjectId(selectedNote.project_id ?? "");
    setPendingFiles([]);
    loadAttachments(selectedNote.id);
    setViewMode("edit");
  };

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center h-full">
        <p className="text-muted text-sm">読み込み中...</p>
      </PageTransition>
    );
  }

  // View: note detail
  if (viewMode === "view" && selectedNote) {
    return (
      <PageTransition className="p-4 sm:p-6 max-w-3xl mx-auto">
        <button
          onClick={() => { setViewMode("list"); setSelectedNote(null); }}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          一覧に戻る
        </button>

        <div className="glass rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold">{selectedNote.title}</h1>
            <div className="flex gap-2 shrink-0">
              <button onClick={openEdit} className="p-2 rounded-lg hover:bg-card transition-colors text-muted hover:text-foreground">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget(selectedNote.id)} className="p-2 rounded-lg hover:bg-card transition-colors text-muted hover:text-status-overdue">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {selectedNote.meeting_date}
            </span>
            {selectedNote.project && (
              <span className="flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5" />
                {selectedNote.project.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Avatar name={selectedNote.author.display_name} src={selectedNote.author.avatar_url} size="xs" />
              {selectedNote.author.display_name}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
            {selectedNote.content || "（内容なし）"}
          </div>

          {/* Attachments */}
          {loadingAttachments ? (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted">添付ファイルを読み込み中...</p>
            </div>
          ) : savedAttachments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-muted" />
                添付ファイル ({savedAttachments.length})
              </h3>
              <div className="space-y-2">
                {savedAttachments.map((att) => (
                  <div
                    key={att.storage_path}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2"
                  >
                    <FileIcon className="w-4 h-4 text-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{att.name}</p>
                      <p className="text-xs text-muted">{formatFileSize(att.size)}</p>
                    </div>
                    {att.signed_url && (
                      <a
                        href={att.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-card transition-colors text-muted hover:text-foreground shrink-0"
                        title="ダウンロード"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete confirmation */}
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="議事録を削除">
          <p className="text-sm text-muted mb-4">この議事録を削除しますか？この操作は取り消せません。</p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-status-overdue hover:bg-red-600">削除</Button>
          </div>
        </Modal>
      </PageTransition>
    );
  }

  // View: create / edit form
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <PageTransition className="p-4 sm:p-6 max-w-3xl mx-auto">
        <button
          onClick={() => { setViewMode(selectedNote ? "view" : "list"); }}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="glass rounded-xl p-6">
          <h1 className="text-lg font-bold mb-4">
            {viewMode === "create" ? "新しい議事録" : "議事録を編集"}
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">タイトル</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus-glow min-h-[44px]"
                placeholder="例: 週次定例MTG"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">会議日</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus-glow min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">プロジェクト（任意）</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus-glow min-h-[44px]"
                >
                  <option value="">なし</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus-glow resize-y leading-relaxed min-h-[44px]"
                placeholder={"■ 参加者\n- \n\n■ アジェンダ\n- \n\n■ 決定事項\n- \n\n■ アクションアイテム\n- "}
              />
            </div>

            {/* File attachments */}
            <div>
              <label className="block text-sm font-medium mb-1">添付ファイル</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                ファイルを添付
              </button>

              {/* Pending files (not yet uploaded) */}
              {pendingFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-sm"
                    >
                      <FileIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted shrink-0">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(i)}
                        className="p-0.5 rounded hover:bg-card transition-colors text-muted hover:text-status-overdue shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Already saved attachments (edit mode only) */}
              {viewMode === "edit" && savedAttachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted mt-2 mb-1">保存済みファイル:</p>
                  {savedAttachments.map((att) => (
                    <div
                      key={att.storage_path}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm"
                    >
                      <FileIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="truncate flex-1">{att.name}</span>
                      <span className="text-xs text-muted shrink-0">{formatFileSize(att.size)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att)}
                        className="p-0.5 rounded hover:bg-card transition-colors text-muted hover:text-status-overdue shrink-0"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setViewMode(selectedNote ? "view" : "list")}>
                キャンセル
              </Button>
              <Button
                onClick={viewMode === "create" ? handleCreate : handleUpdate}
                disabled={submitting || !title.trim()}
              >
                {submitting ? "保存中..." : viewMode === "create" ? "作成" : "更新"}
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // View: list
  return (
    <PageTransition className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">議事録</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          新規作成
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm mb-4">議事録はまだありません</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            最初の議事録を作成
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => openView(note)}
                className="w-full text-left glass rounded-xl p-4 hover:bg-card/80 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate">{note.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {note.meeting_date}
                      </span>
                      {note.project && (
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          {note.project.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Avatar name={note.author.display_name} src={note.author.avatar_url} size="xs" />
                        {note.author.display_name}
                      </span>
                    </div>
                    {note.content && (
                      <p className="text-xs text-muted mt-2 line-clamp-2">{note.content}</p>
                    )}
                  </div>
                  <FileText className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
        </div>
      )}
    </PageTransition>
  );
}
