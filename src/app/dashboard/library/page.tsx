"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import PageTransition from "@/components/ui/PageTransition";
import LibraryToolbar from "@/components/library/LibraryToolbar";
import FolderCard from "@/components/library/FolderCard";
import LibraryFileCard from "@/components/library/LibraryFileCard";
import LibraryFileRow from "@/components/library/LibraryFileRow";
import LibraryBreadcrumbs from "@/components/library/LibraryBreadcrumbs";
import FileUploadZone from "@/components/library/FileUploadZone";
import FolderCreateModal from "@/components/library/FolderCreateModal";
import FileDetailModal from "@/components/library/FileDetailModal";
import FilePreviewModal from "@/components/library/FilePreviewModal";
import { fetchProjectsWithStats } from "@/lib/projects";
import { showToast } from "@/lib/toast";
import {
  fetchFolders,
  fetchLibraryFiles,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  moveLibraryFile,
  getFolderBreadcrumbs,
  uploadLibraryFile,
  deleteLibraryFile,
  type LibraryFileCategory,
  type LibraryFileWithProfile,
  type BreadcrumbItem,
} from "@/lib/library";
import type { LibraryFolder, Project } from "@/types/database";

export default function LibraryPage() {
  // Auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Navigation & filters
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileType, setFileType] = useState<LibraryFileCategory>("all");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // UI toggles
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Data
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [files, setFiles] = useState<LibraryFileWithProfile[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "ファイル" },
  ]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected file (for FileDetailModal)
  const [selectedFile, setSelectedFile] = useState<LibraryFileWithProfile | null>(null);

  // Preview file (for FilePreviewModal)
  const [previewFile, setPreviewFile] = useState<LibraryFileWithProfile | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // DnD state
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Debounce ref for search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ---- Effects ----

  // Fetch current user
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setCurrentUserId(data.user?.id ?? null);
      });
  }, []);

  // Debounce search query
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // Load folders, files, breadcrumbs when deps change
  const refreshData = useCallback(async () => {
    try {
      const [foldersData, filesData, crumbs] = await Promise.all([
        debouncedSearch
          ? Promise.resolve([])
          : fetchFolders(currentFolderId, projectFilter),
        fetchLibraryFiles({
          folderId: currentFolderId,
          projectId: projectFilter,
          search: debouncedSearch || undefined,
          fileType,
        }),
        getFolderBreadcrumbs(currentFolderId),
      ]);
      setFolders(foldersData);
      setFiles(filesData);
      setBreadcrumbs(crumbs);
    } catch (err) {
      console.error("Failed to load library data:", err);
      showToast("データの読み込みに失敗しました", "error");
    }
  }, [currentFolderId, debouncedSearch, fileType, projectFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refreshData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [refreshData]);

  // Load projects on mount
  useEffect(() => {
    fetchProjectsWithStats()
      .then((data) => {
        setProjects(data);
      })
      .catch((err) => {
        console.error("Failed to load projects:", err);
      });
  }, []);

  // ---- Handlers ----

  const handleUpload = useCallback(
    async (selectedFiles: File[]) => {
      if (!currentUserId) return;
      setUploading(true);
      setUploadProgress(0);

      try {
        for (let i = 0; i < selectedFiles.length; i++) {
          await uploadLibraryFile(
            selectedFiles[i],
            currentUserId,
            currentFolderId,
            projectFilter,
          );
          setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }
        showToast(
          `${selectedFiles.length}件のファイルをアップロードしました`,
          "success",
        );
        setShowUploadZone(false);
        await refreshData();
      } catch (err) {
        console.error("Upload failed:", err);
        const msg = err instanceof Error ? err.message : "アップロードに失敗しました";
        showToast(msg, "error");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [currentUserId, currentFolderId, projectFilter, refreshData],
  );

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (!currentUserId) return;
      try {
        await createFolder(name, currentFolderId, projectFilter, currentUserId);
        showToast("フォルダを作成しました", "success");
        const refreshed = await fetchFolders(currentFolderId, projectFilter);
        setFolders(refreshed);
      } catch (err) {
        console.error("Folder creation failed:", err);
        showToast("フォルダの作成に失敗しました", "error");
      }
    },
    [currentUserId, currentFolderId, projectFilter],
  );

  const handleRenameFolder = useCallback(
    async (folderId: string, newName: string) => {
      try {
        await renameFolder(folderId, newName);
        showToast("フォルダ名を変更しました", "success");
        const refreshed = await fetchFolders(currentFolderId, projectFilter);
        setFolders(refreshed);
      } catch (err) {
        console.error("Folder rename failed:", err);
        showToast("フォルダ名の変更に失敗しました", "error");
      }
    },
    [currentFolderId, projectFilter],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      if (!confirm("このフォルダを削除しますか？中のファイルも削除されます。")) return;
      try {
        await deleteFolder(folderId);
        showToast("フォルダを削除しました", "success");
        const refreshed = await fetchFolders(currentFolderId, projectFilter);
        setFolders(refreshed);
      } catch (err) {
        console.error("Folder deletion failed:", err);
        showToast("フォルダの削除に失敗しました", "error");
      }
    },
    [currentFolderId, projectFilter],
  );

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      if (!confirm("このファイルを削除しますか？")) return;
      try {
        await deleteLibraryFile(fileId);
        showToast("ファイルを削除しました", "success");
        await refreshData();
      } catch (err) {
        console.error("File deletion failed:", err);
        showToast("ファイルの削除に失敗しました", "error");
      }
    },
    [refreshData],
  );

  // ---- DnD Handlers ----

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetFolderId: string | null) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolderId(null);

      let payload: { type: string; id: string };
      try {
        const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
        payload = JSON.parse(raw);
      } catch (parseErr) {
        console.error("DnD payload parse failed:", parseErr);
        return;
      }

      // Guard: don't drop folder onto itself
      if (payload.type === "folder" && payload.id === targetFolderId) return;

      // Guard: don't move to same location (current folder)
      if (targetFolderId === currentFolderId) return;

      // Optimistic update: immediately remove from UI
      if (payload.type === "file") {
        setFiles((prev) => prev.filter((f) => f.id !== payload.id));
      } else if (payload.type === "folder") {
        setFolders((prev) => prev.filter((f) => f.id !== payload.id));
      }

      try {
        if (payload.type === "file") {
          await moveLibraryFile(payload.id, targetFolderId);
          showToast("ファイルを移動しました", "success");
        } else if (payload.type === "folder") {
          await moveFolder(payload.id, targetFolderId);
          showToast("フォルダを移動しました", "success");
        }
        await refreshData();
      } catch (err) {
        console.error("Move failed:", err);
        showToast("移動に失敗しました", "error");
        // Revert on error
        await refreshData();
      }
    },
    [refreshData, currentFolderId],
  );

  const handleDragOverFolder = useCallback((e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId);
  }, []);

  const handleDragLeaveFolder = useCallback(() => {
    setDragOverFolderId(null);
  }, []);

  // ---- Render ----

  const isSearching = debouncedSearch.length > 0;
  const hasContent = folders.length > 0 || files.length > 0;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold">ライブラリ</h1>

        {/* Breadcrumbs */}
        <LibraryBreadcrumbs
          items={breadcrumbs}
          onNavigate={(folderId) => setCurrentFolderId(folderId)}
          onDropOnBreadcrumb={(folderId, e) => handleDrop(e, folderId)}
        />

        {/* Toolbar */}
        <LibraryToolbar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          fileType={fileType}
          onFileTypeChange={setFileType}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          projects={projects}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewFolder={() => setShowFolderModal(true)}
          onUpload={() => setShowUploadZone((prev) => !prev)}
        />

        {/* Upload Zone */}
        {showUploadZone && (
          <FileUploadZone
            onFilesSelected={handleUpload}
            uploading={uploading}
            progress={uploadProgress}
          />
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasContent ? (
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-muted text-4xl mb-3">
              {isSearching ? "🔍" : "📁"}
            </div>
            <p className="text-muted text-sm">
              {isSearching
                ? "検索結果が見つかりませんでした"
                : "このフォルダにはファイルがありません"}
            </p>
            {!isSearching && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="px-4 py-2 text-sm rounded-lg bg-card hover:bg-card/80 transition-colors"
                >
                  フォルダを作成
                </button>
                <button
                  onClick={() => setShowUploadZone(true)}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  ファイルをアップロード
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Folders Grid */}
            {!isSearching && folders.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted mb-3">
                  フォルダ
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onRename={(newName) =>
                        handleRenameFolder(folder.id, newName)
                      }
                      onDelete={() => handleDeleteFolder(folder.id)}
                      onMove={() => {
                        // Move to parent via DnD instead
                      }}
                      isDragOver={dragOverFolderId === folder.id}
                      onDropOnFolder={(e) => handleDrop(e, folder.id)}
                      onDragOverFolder={(e) => handleDragOverFolder(e, folder.id)}
                      onDragLeaveFolder={handleDragLeaveFolder}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted mb-3">
                  ファイル
                </h2>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {files.map((file) => (
                      <LibraryFileCard
                        key={file.id}
                        file={file}
                        onClick={() => setPreviewFile(file)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-xl divide-y divide-border">
                    {files.map((file) => (
                      <LibraryFileRow
                        key={file.id}
                        file={file}
                        onClick={() => setPreviewFile(file)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Folder Create Modal */}
        <FolderCreateModal
          open={showFolderModal}
          onClose={() => setShowFolderModal(false)}
          onCreate={handleCreateFolder}
        />

        {/* File Preview Modal */}
        <FilePreviewModal
          file={previewFile}
          files={files}
          onClose={() => setPreviewFile(null)}
          onOpenDetail={(file) => {
            setPreviewFile(null);
            setSelectedFile(file);
          }}
        />

        {/* File Detail Modal */}
        <FileDetailModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDeleted={() => {
            setSelectedFile(null);
            refreshData();
          }}
        />
      </div>
    </PageTransition>
  );
}
