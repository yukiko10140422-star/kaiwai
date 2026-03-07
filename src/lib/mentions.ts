import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

/**
 * メッセージ内の @表示名 を解析し、該当するユーザーIDの配列を返す
 */
export function parseMentions(
  content: string,
  members: Pick<Profile, "id" | "display_name">[]
): string[] {
  const mentionedIds: string[] = [];
  // 長い名前から先にマッチさせる（"田中太郎" が "田中" より先）
  const sorted = [...members].sort(
    (a, b) => b.display_name.length - a.display_name.length
  );

  for (const member of sorted) {
    const pattern = `@${member.display_name}`;
    if (content.includes(pattern) && !mentionedIds.includes(member.id)) {
      mentionedIds.push(member.id);
    }
  }

  return mentionedIds;
}

/**
 * メンションされたユーザーに通知を送信する
 */
export async function sendMentionNotifications(
  mentionedUserIds: string[],
  senderName: string,
  channelName: string | null,
  messageId: string
): Promise<void> {
  if (mentionedUserIds.length === 0) return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 自分自身へのメンションは通知しない
  const targets = mentionedUserIds.filter((id) => id !== user.id);
  if (targets.length === 0) return;

  const notifications = targets.map((userId) => ({
    user_id: userId,
    type: "mention" as const,
    title: `${senderName} があなたをメンションしました`,
    body: channelName ? `#${channelName} でメンションされました` : "DMでメンションされました",
    reference_id: messageId,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) console.error("Failed to send mention notifications:", error);
}

/**
 * メッセージ内容をメンション部分とテキスト部分に分割する
 * 表示用（ハイライト）に使用
 */
export interface MessageSegment {
  type: "text" | "mention";
  value: string;
}

export function parseMessageSegments(
  content: string,
  memberNames: string[]
): MessageSegment[] {
  if (memberNames.length === 0) return [{ type: "text", value: content }];

  // 長い名前から先にマッチ
  const sorted = [...memberNames].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(@(?:${escaped.join("|")}))`, "g");

  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mention", value: match[1] });
    lastIndex = match.index + match[1].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: content }];
}
