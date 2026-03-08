/**
 * Feature Requests (機能リクエスト) - Supabase functions
 *
 * Required DB tables (create via Supabase dashboard or SQL editor):
 *
 * CREATE TABLE feature_requests (
 *   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 *   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   votes INTEGER DEFAULT 0,
 *   status TEXT DEFAULT 'open' CHECK (status IN ('open', 'planned', 'done', 'rejected')),
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE feature_request_votes (
 *   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 *   request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE NOT NULL,
 *   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(request_id, user_id)
 * );
 *
 * -- RLS
 * ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Anyone can view feature requests" ON feature_requests FOR SELECT USING (true);
 * CREATE POLICY "Auth users can insert feature requests" ON feature_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
 * CREATE POLICY "Users can delete own requests" ON feature_requests FOR DELETE USING (auth.uid() = user_id);
 * CREATE POLICY "Auth users can update feature requests" ON feature_requests FOR UPDATE USING (true);
 *
 * CREATE POLICY "Anyone can view votes" ON feature_request_votes FOR SELECT USING (true);
 * CREATE POLICY "Auth users can insert votes" ON feature_request_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
 * CREATE POLICY "Users can delete own votes" ON feature_request_votes FOR DELETE USING (auth.uid() = user_id);
 */

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  votes: number;
  status: string;
  created_at: string;
  author?: Pick<Profile, "display_name" | "avatar_url">;
}

export interface FeatureRequestWithAuthor extends FeatureRequest {
  author: Pick<Profile, "display_name" | "avatar_url">;
  voted_by_me: boolean;
}

export async function fetchFeatureRequests(): Promise<FeatureRequestWithAuthor[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("feature_requests")
    .select(
      "*, author:profiles!feature_requests_user_id_fkey(display_name, avatar_url)"
    )
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Get user's votes
  let myVotes = new Set<string>();
  if (user) {
    const { data: votes } = await supabase
      .from("feature_request_votes")
      .select("request_id")
      .eq("user_id", user.id);
    myVotes = new Set((votes ?? []).map((v) => v.request_id));
  }

  return (data ?? []).map((r) => ({
    ...r,
    author: r.author as Pick<Profile, "display_name" | "avatar_url">,
    voted_by_me: myVotes.has(r.id),
  }));
}

export async function createFeatureRequest(
  title: string,
  description?: string
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("feature_requests").insert({
    user_id: user.id,
    title,
    description: description || null,
    votes: 0,
    status: "open",
  });

  if (error) throw error;
}

export async function voteFeatureRequest(requestId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if already voted
  const { data: existing } = await supabase
    .from("feature_request_votes")
    .select("id")
    .eq("request_id", requestId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unvote
    await supabase
      .from("feature_request_votes")
      .delete()
      .eq("id", existing.id);
    const { data: req } = await supabase
      .from("feature_requests")
      .select("votes")
      .eq("id", requestId)
      .single();
    if (req) {
      await supabase
        .from("feature_requests")
        .update({ votes: Math.max(0, req.votes - 1) })
        .eq("id", requestId);
    }
  } else {
    // Vote
    await supabase
      .from("feature_request_votes")
      .insert({ request_id: requestId, user_id: user.id });
    const { data: req } = await supabase
      .from("feature_requests")
      .select("votes")
      .eq("id", requestId)
      .single();
    if (req) {
      await supabase
        .from("feature_requests")
        .update({ votes: req.votes + 1 })
        .eq("id", requestId);
    }
  }
}

export async function deleteFeatureRequest(requestId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("feature_requests")
    .delete()
    .eq("id", requestId);
  if (error) throw error;
}
