import { createClient } from "@/lib/supabase/client";
import type { LibraryFolder, LibraryFile, LibraryFileComment, Profile } from "@/types/database";
import { categorizeFile } from "@/lib/files";

// ---- Types ----

export type LibraryFileCategory = "all" | "image" | "video" | "audio" | "pdf" | "document" | "other";

export interface LibraryFileWithProfile extends LibraryFile {
  uploader?: Pick<Profile, "id" | "display_name" | "avatar_url">;
}

export interface LibraryCommentWithProfile extends LibraryFileComment {
  profile?: Pick<Profile, "id" | "display_name" | "avatar_url">;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

// ---- Folder Operations ----

export async function fetchFolders(parentId?: string | null, projectId?: string | null) {
  const supabase = createClient();
  let query = supabase
    .from("library_folders")
    .select("*")
    .order("name", { ascending: true });

  if (parentId === null || parentId === undefined) {
    query = query.is("parent_id", null);
  } else {
    query = query.eq("parent_id", parentId);
  }

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LibraryFolder[];
}

export async function createFolder(name: string, parentId: string | null, projectId: string | null, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_folders")
    .insert({ name, parent_id: parentId, project_id: projectId, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data as LibraryFolder;
}

export async function renameFolder(folderId: string, newName: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("library_folders")
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq("id", folderId);
  if (error) throw error;
}

export async function deleteFolder(folderId: string) {
  const supabase = createClient();

  // 再帰的にフォルダツリー内の全ファイルを収集
  const allFiles: { id: string; storage_path: string }[] = [];

  async function collectFiles(parentFolderId: string) {
    // このフォルダ直下のファイル（バージョンファイル含む）
    const { data: files } = await supabase
      .from("library_files")
      .select("id, storage_path")
      .eq("folder_id", parentFolderId);

    if (files) {
      for (const f of files) {
        allFiles.push(f);
        // バージョンファイルも収集
        const { data: versions } = await supabase
          .from("library_files")
          .select("id, storage_path")
          .eq("parent_file_id", f.id);
        if (versions) allFiles.push(...versions);
      }
    }

    // サブフォルダを再帰
    const { data: subFolders } = await supabase
      .from("library_folders")
      .select("id")
      .eq("parent_id", parentFolderId);

    if (subFolders) {
      for (const sub of subFolders) {
        await collectFiles(sub.id);
      }
    }
  }

  await collectFiles(folderId);

  // ストレージからファイルをバッチ削除
  if (allFiles.length > 0) {
    const paths = allFiles.map((f) => f.storage_path);
    await supabase.storage.from("attachments").remove(paths);

    // DB からファイルレコードを削除
    const ids = allFiles.map((f) => f.id);
    for (const id of ids) {
      await supabase.from("library_files").delete().eq("id", id);
    }
  }

  // フォルダを削除（サブフォルダは ON DELETE CASCADE で自動削除）
  const { error } = await supabase
    .from("library_folders")
    .delete()
    .eq("id", folderId);
  if (error) throw error;
}

export async function moveFolder(folderId: string, newParentId: string | null) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_folders")
    .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error("フォルダの移動に失敗しました");
}

export async function getFolderBreadcrumbs(folderId: string | null): Promise<BreadcrumbItem[]> {
  if (!folderId) return [{ id: null, name: "ファイル" }];

  const supabase = createClient();
  const crumbs: BreadcrumbItem[] = [{ id: null, name: "ファイル" }];
  let currentId: string | null = folderId;

  while (currentId) {
    const { data, error } = await supabase
      .from("library_folders")
      .select("id, name, parent_id")
      .eq("id", currentId)
      .single();
    if (error || !data) break;
    const row = data as { id: string; name: string; parent_id: string | null };
    crumbs.push({ id: row.id, name: row.name });
    currentId = row.parent_id;
  }

  // Reverse the folder chain (we collected child->parent) but keep root first
  const root = crumbs.shift()!;
  crumbs.reverse();
  return [root, ...crumbs];
}

// ---- File Operations ----

function matchesCategory(fileType: string, category: LibraryFileCategory): boolean {
  if (category === "all") return true;
  if (category === "audio") return fileType.startsWith("audio/");
  if (category === "pdf") return fileType === "application/pdf";
  const cat = categorizeFile(fileType);
  if (category === "image") return cat === "image";
  if (category === "video") return cat === "video";
  if (category === "document") return cat === "document";
  return cat === "other";
}

export async function fetchLibraryFiles(opts: {
  folderId?: string | null;
  projectId?: string | null;
  search?: string;
  fileType?: LibraryFileCategory;
}) {
  const supabase = createClient();
  let query = supabase
    .from("library_files")
    .select("*, profiles:uploaded_by(id, display_name, avatar_url)")
    .is("parent_file_id", null) // Only show latest / root versions
    .order("created_at", { ascending: false });

  // When searching, don't filter by folder
  if (opts.search) {
    query = query.ilike("file_name", `%${opts.search}%`);
  } else if (opts.folderId === null || opts.folderId === undefined) {
    query = query.is("folder_id", null);
  } else {
    query = query.eq("folder_id", opts.folderId);
  }

  if (opts.projectId) {
    query = query.eq("project_id", opts.projectId);
  }

  const { data, error } = await query;
  if (error) throw error;

  let files = (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Pick<Profile, "id" | "display_name" | "avatar_url"> | undefined;
    const { profiles: _, ...rest } = row;
    return { ...rest, uploader: profile } as LibraryFileWithProfile;
  });

  // Client-side category filter
  if (opts.fileType && opts.fileType !== "all") {
    files = files.filter((f) => matchesCategory(f.file_type, opts.fileType!));
  }

  return files;
}

export async function uploadLibraryFile(
  file: File,
  userId: string,
  folderId: string | null,
  projectId: string | null,
  description?: string,
) {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`ファイルサイズが上限(50MB)を超えています: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  const supabase = createClient();

  // Sanitize file name
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `library/${userId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("library_files")
    .insert({
      folder_id: folderId,
      project_id: projectId,
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: storagePath,
      description: description || null,
      uploaded_by: userId,
      parent_file_id: null,
      version: 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LibraryFile;
}

export async function deleteLibraryFile(fileId: string) {
  const supabase = createClient();

  // Get file info for storage deletion
  const { data: fileData } = await supabase
    .from("library_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (fileData) {
    await supabase.storage.from("attachments").remove([fileData.storage_path]);
  }

  // Also delete version files
  const { data: versions } = await supabase
    .from("library_files")
    .select("id, storage_path")
    .eq("parent_file_id", fileId);

  if (versions && versions.length > 0) {
    const paths = versions.map((v) => v.storage_path);
    await supabase.storage.from("attachments").remove(paths);
    // DB records deleted by cascade (parent_file_id ON DELETE SET NULL) – we delete manually
    for (const v of versions) {
      await supabase.from("library_files").delete().eq("id", v.id);
    }
  }

  const { error } = await supabase.from("library_files").delete().eq("id", fileId);
  if (error) throw error;
}

export async function moveLibraryFile(fileId: string, newFolderId: string | null) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_files")
    .update({ folder_id: newFolderId, updated_at: new Date().toISOString() })
    .eq("id", fileId)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error("ファイルの移動に失敗しました");
}

export async function getLibraryFileSignedUrl(storagePath: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ---- Version Operations ----

export async function uploadNewVersion(originalFileId: string, file: File, userId: string) {
  const supabase = createClient();

  // Get current max version
  const { data: original } = await supabase
    .from("library_files")
    .select("*")
    .eq("id", originalFileId)
    .single();
  if (!original) throw new Error("Original file not found");

  const { data: versions } = await supabase
    .from("library_files")
    .select("version")
    .or(`id.eq.${originalFileId},parent_file_id.eq.${originalFileId}`)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version ?? 1) + 1;

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`ファイルサイズが上限(50MB)を超えています: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `library/${userId}/${Date.now()}_v${nextVersion}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("library_files")
    .insert({
      folder_id: original.folder_id,
      project_id: original.project_id,
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: storagePath,
      description: original.description,
      uploaded_by: userId,
      parent_file_id: originalFileId,
      version: nextVersion,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LibraryFile;
}

export async function getFileVersions(fileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_files")
    .select("*, profiles:uploaded_by(id, display_name, avatar_url)")
    .or(`id.eq.${fileId},parent_file_id.eq.${fileId}`)
    .order("version", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Pick<Profile, "id" | "display_name" | "avatar_url"> | undefined;
    const { profiles: _, ...rest } = row;
    return { ...rest, uploader: profile } as LibraryFileWithProfile;
  });
}

// ---- Comment Operations ----

export async function fetchFileComments(fileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_file_comments")
    .select("*, profiles:user_id(id, display_name, avatar_url)")
    .eq("file_id", fileId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Pick<Profile, "id" | "display_name" | "avatar_url"> | undefined;
    const { profiles: _, ...rest } = row;
    return { ...rest, profile } as LibraryCommentWithProfile;
  });
}

export async function addFileComment(fileId: string, userId: string, content: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("library_file_comments")
    .insert({ file_id: fileId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  return data as LibraryFileComment;
}

export async function deleteFileComment(commentId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("library_file_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
}
