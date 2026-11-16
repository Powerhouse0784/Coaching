// Push notifications through Expo's push service (https://docs.expo.dev/push-notifications/sending-notifications/).
// Sending never throws: a message must be saved even when notifications fail.

import { prisma } from '@/lib/prisma';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;           // Expo accepts up to 100 messages per request
const TIMEOUT_MS = 5000;

export const isExpoPushToken = (t: unknown): t is string =>
  typeof t === 'string' && t.length <= 200 && /^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/.test(t);

/** What the notification shows as its body. */
export function chatPreview(content: string, hasFile: boolean): string {
  const text = (content ?? '').replace(/\s+/g, ' ').trim();
  if (text) return text.length > 140 ? `${text.slice(0, 137)}...` : text;
  return hasFile ? 'Sent an attachment' : 'New message';
}

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

/** Sends to Expo and removes tokens Expo reports as dead (app uninstalled / token revoked). Returns how many were accepted. */
export async function sendPushMessages(messages: PushMessage[]): Promise<number> {
  if (!messages.length) return 0;
  let accepted = 0;
  const dead: string[] = [];
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(chunk),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) { console.error('Expo push HTTP', res.status); continue; }
      const json: any = await res.json().catch(() => null);
      const tickets: any[] = Array.isArray(json?.data) ? json.data : [];
      tickets.forEach((t, idx) => {
        if (t?.status === 'ok') accepted++;
        else if (t?.details?.error === 'DeviceNotRegistered' && chunk[idx]) dead.push(chunk[idx].to);
      });
    } catch (e) {
      console.error('Expo push failed', (e as Error)?.name);
    }
  }
  if (dead.length) {
    try { await prisma.pushToken.deleteMany({ where: { token: { in: dead } } }); } catch { /* cleanup only */ }
  }
  return accepted;
}

/** Notify every OTHER active teacher (who has not muted the chat) about a new chat message. */
export async function notifyTeacherChat(args: { senderId: string; senderName: string | null; content: string; hasFile: boolean; messageId: string }): Promise<number> {
  try {
    const rows = await prisma.pushToken.findMany({
      where: { chatMuted: false, user: { role: 'TEACHER', isActive: true, id: { not: args.senderId } } },
      select: { token: true },
    });
    const tokens = Array.from(new Set(rows.map((r: { token: string }) => r.token))).filter(isExpoPushToken);
    const title = args.senderName?.trim() || 'Teacher Chat';
    const body = chatPreview(args.content, args.hasFile);
    return await sendPushMessages(
      tokens.map((to) => ({
        to, title: `${title} · Teacher Chat`, body,
        data: { type: 'teacher-chat', messageId: args.messageId },
        channelId: 'chat', sound: 'default' as const, priority: 'high' as const,
      }))
    );
  } catch (e) {
    console.error('notifyTeacherChat failed', (e as Error)?.name);
    return 0;
  }
}
