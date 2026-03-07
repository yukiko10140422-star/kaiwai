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
  const { error } = await supabase
    .from("meeting_notes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
