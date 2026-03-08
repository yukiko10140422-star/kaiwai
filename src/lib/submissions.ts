import { createClient } from "@/lib/supabase/client";
import type { TaskSubmission, SubmissionFile, Profile } from "@/types/database";

// ============================================================
// Types
// ============================================================

export interface SubmissionWithAuthor extends TaskSubmission {
  author: Pick<Profile, "id" | "display_name" | "avatar_url">;
  reviewer?: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
  files: SubmissionFile[];
}

// ============================================================
// Fetch
// ============================================================

/** Fetch all submissions for a task, with author and files */
export async function fetchTaskSubmissions(taskId: string): Promise<SubmissionWithAuthor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("task_submissions")
    .select(
      "*, author:profiles!task_submissions_submitted_by_fkey(id, display_name, avatar_url)"
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch files for all submissions
  const submissionIds = (data ?? []).map((s) => s.id);
  let filesMap: Record<string, SubmissionFile[]> = {};

  if (submissionIds.length > 0) {
    const { data: files } = await supabase
      .from("submission_files")
      .select("*")
      .in("submission_id", submissionIds);

    for (const f of files ?? []) {
      if (!filesMap[f.submission_id]) filesMap[f.submission_id] = [];
      filesMap[f.submission_id].push(f);
    }
  }

  // Fetch reviewer profiles
  const reviewerIds = (data ?? [])
    .map((s) => s.reviewer_id)
    .filter((id): id is string => !!id);

  let reviewerMap: Record<string, Pick<Profile, "id" | "display_name" | "avatar_url">> = {};
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", reviewerIds);

    for (const r of reviewers ?? []) {
      reviewerMap[r.id] = r;
    }
  }

  return (data ?? []).map((s) => ({
    ...s,
    author: s.author as Pick<Profile, "id" | "display_name" | "avatar_url">,
    reviewer: s.reviewer_id ? reviewerMap[s.reviewer_id] ?? null : null,
    files: filesMap[s.id] ?? [],
  }));
}

// ============================================================
// Create submission
// ============================================================

/** Submit deliverables for a task */
export async function createSubmission(
  taskId: string,
  files: File[],
  comment?: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Create submission record
  const { data: submission, error } = await supabase
    .from("task_submissions")
    .insert({
      task_id: taskId,
      submitted_by: user.id,
      comment: comment || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  // Upload files
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `submissions/${taskId}/${submission.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file);

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      continue;
    }

    await supabase.from("submission_files").insert({
      submission_id: submission.id,
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: storagePath,
    });
  }
}

// ============================================================
// Review submission
// ============================================================

/** Approve or reject a submission */
export async function reviewSubmission(
  submissionId: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("task_submissions")
    .update({
      status,
      reviewer_id: user.id,
      reviewer_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw error;
}

// ============================================================
// Delete submission
// ============================================================

export async function deleteSubmission(submissionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("task_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) throw error;
}

// ============================================================
// File URL
// ============================================================

export async function getSubmissionFileUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
