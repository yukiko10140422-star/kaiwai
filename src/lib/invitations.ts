import { createClient } from "@/lib/supabase/client";
import type { Invitation } from "@/types/database";

/**
 * 招待を作成する
 */
export async function createInvitation(email: string): Promise<Invitation> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
      accepted_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Invitation;
}

/**
 * 自分が送った招待一覧を取得
 */
export async function getInvitations(): Promise<Invitation[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("invited_by", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Invitation[];
}

/**
 * トークンで招待を検証する
 */
export async function validateInvitation(token: string): Promise<Invitation | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return null;

  const invitation = data as Invitation;

  // 期限切れチェック
  if (new Date(invitation.expires_at) < new Date()) return null;

  // 使用済みチェック
  if (invitation.accepted_at) return null;

  return invitation;
}

/**
 * 招待を受諾する
 */
export async function acceptInvitation(token: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("token", token);

  if (error) throw error;
}

/**
 * 招待を削除する
 */
export async function deleteInvitation(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
