import { createClient } from "@/lib/supabase/client";
import type { MessageAttachment, Profile } from "@/types/database";

export interface FileWithMeta extends MessageAttachment {
  sender: Pick<Profile, "id" | "display_name" | "avatar_url">;
  signed_url: string | null;
}

export type FileCategory = "all" | "image" | "video" | "document" | "other";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export function categorizeFile(fileType: string): Exclude<FileCategory, "all"> {
  if (IMAGE_TYPES.some((t) => fileType.startsWith(t.split("/")[0] + "/"))) {
    return fileType.startsWith("image/") ? "image" : "other";
  }
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (DOC_TYPES.includes(fileType)) return "document";
  return "other";
}

/**
 * チャンネル内の添付ファイル一覧を取得（送信者情報付き）
 */
export async function getChannelFiles(channelId: string): Promise<FileWithMeta[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("message_attachments")
    .select("*, messages!inner(channel_id, user_id, profiles(id, display_name, avatar_url))")
    .eq("messages.channel_id", channelId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const files: FileWithMeta[] = [];
  for (const row of data ?? []) {
    const msg = (row as Record<string, unknown>).messages as Record<string, unknown>;
    const profile = msg.profiles as Pick<Profile, "id" | "display_name" | "avatar_url">;

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from("attachments")
      .createSignedUrl(row.storage_path, 3600); // 1 hour

    files.push({
      id: row.id,
      message_id: row.message_id,
      file_name: row.file_name,
      file_type: row.file_type,
      file_size: row.file_size,
      storage_path: row.storage_path,
      created_at: row.created_at,
      sender: profile,
      signed_url: urlData?.signedUrl ?? null,
    });
  }

  return files;
}

/**
 * DM会話内の添付ファイル一覧を取得
 */
export async function getDmFiles(conversationId: string): Promise<FileWithMeta[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("message_attachments")
    .select("*, messages!inner(conversation_id, user_id, profiles(id, display_name, avatar_url))")
    .eq("messages.conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const files: FileWithMeta[] = [];
  for (const row of data ?? []) {
    const msg = (row as Record<string, unknown>).messages as Record<string, unknown>;
    const profile = msg.profiles as Pick<Profile, "id" | "display_name" | "avatar_url">;

    const { data: urlData } = await supabase.storage
      .from("attachments")
      .createSignedUrl(row.storage_path, 3600);

    files.push({
      id: row.id,
      message_id: row.message_id,
      file_name: row.file_name,
      file_type: row.file_type,
      file_size: row.file_size,
      storage_path: row.storage_path,
      created_at: row.created_at,
      sender: profile,
      signed_url: urlData?.signedUrl ?? null,
    });
  }

  return files;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
