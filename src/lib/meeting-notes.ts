import { createClient } from "@/lib/supabase/client";
import type { MeetingNote } from "@/types/database";

export interface MeetingNoteWithAuthor extends MeetingNote {
  author: {
    display_name: string;
    avatar_url: string | null;
  };
  project?: {
    id: string;
    name: string;
  } | null;
}

export async function fetchMeetingNotes(): Promise<MeetingNoteWithAuthor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meeting_notes")
    .select(`
      *,
      profiles!meeting_notes_created_by_fkey(display_name, avatar_url),
      projects(id, name)
    `)
    .order("meeting_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { display_name: string; avatar_url: string | null } | null;
    const project = row.projects as unknown as { id: string; name: string } | null;
    return {
      ...row,
      author: profile ?? { display_name: "Unknown", avatar_url: null },
      project: project ?? null,
      profiles: undefined,
      projects: undefined,
    } as unknown as MeetingNoteWithAuthor;
  });
}

export async function fetchMeetingNote(id: string): Promise<MeetingNoteWithAuthor | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meeting_notes")
    .select(`
      *,
      profiles!meeting_notes_created_by_fkey(display_name, avatar_url),
      projects(id, name)
    `)
    .eq("id", id)
    .single();

  if (error) return null;

  const profile = data.profiles as unknown as { display_name: string; avatar_url: string | null } | null;
  const project = data.projects as unknown as { id: string; name: string } | null;
  return {
    ...data,
    author: profile ?? { display_name: "Unknown", avatar_url: null },
    project: project ?? null,
    profiles: undefined,
    projects: undefined,
  } as unknown as MeetingNoteWithAuthor;
}

export async function createMeetingNote(input: {
  title: string;
  content: string;
  meeting_date: string;
  project_id?: string | null;
}): Promise<MeetingNote> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("meeting_notes")
    .insert({
      title: input.title,
      content: input.content,
      meeting_date: input.meeting_date,
      project_id: input.project_id ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MeetingNote;
}

export async function updateMeetingNote(
  id: string,
  input: { title?: string; content?: string; meeting_date?: string; project_id?: string | null }
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("meeting_notes")
    .update(input)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteMeetingNote(id: string): Promise<void> {
  const supabase = createClient();

  // Delete all attachments from storage first
  try {
    const files = await listNoteAttachments(id);
    if (files.length > 0) {
      const paths = files.map((f) => f.storage_path);
      await supabase.storage.from("attachments").remove(paths);
    }
  } catch {
    // Ignore storage errors – proceed with note deletion
  }

  const { error } = await supabase
    .from("meeting_notes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// Note attachments (stored in Supabase Storage)
// ============================================================

export interface NoteAttachment {
  /** Original file name */
  name: string;
  /** File size in bytes */
  size: number;
  /** Full storage path (for signed URL creation) */
  storage_path: string;
  /** Signed download URL (temporary) */
  signed_url: string | null;
}

/**
 * Upload files to Supabase Storage under `notes/{noteId}/`.
 * Returns the list of uploaded attachment info.
 */
export async function uploadNoteAttachments(
  noteId: string,
  files: File[]
): Promise<NoteAttachment[]> {
  const supabase = createClient();
  const results: NoteAttachment[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[/\\:*?"<>|]/g, "_");
    const storagePath = `notes/${noteId}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file);

    if (error) throw error;

    const { data: urlData } = await supabase.storage
      .from("attachments")
      .createSignedUrl(storagePath, 3600);

    results.push({
      name: file.name,
      size: file.size,
      storage_path: storagePath,
      signed_url: urlData?.signedUrl ?? null,
    });
  }

  return results;
}

/**
 * List all attachments for a note by scanning the storage prefix `notes/{noteId}/`.
 */
export async function listNoteAttachments(
  noteId: string
): Promise<NoteAttachment[]> {
  const supabase = createClient();
  const folderPath = `notes/${noteId}`;

  const { data, error } = await supabase.storage
    .from("attachments")
    .list(folderPath, { limit: 100 });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Filter out folder placeholders
  const files = data.filter((f) => f.name && f.id);

  const signedUrls = await Promise.all(
    files.map((f) =>
      supabase.storage
        .from("attachments")
        .createSignedUrl(`${folderPath}/${f.name}`, 3600)
    )
  );

  return files.map((f, i) => {
    // Parse original name: strip leading timestamp_ prefix
    const originalName = f.name.replace(/^\d+_/, "");
    return {
      name: originalName,
      size: f.metadata?.size ?? 0,
      storage_path: `${folderPath}/${f.name}`,
      signed_url: signedUrls[i]?.data?.signedUrl ?? null,
    };
  });
}

/**
 * Delete a single attachment from storage.
 */
export async function deleteNoteAttachment(
  storagePath: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("attachments")
    .remove([storagePath]);

  if (error) throw error;
}
