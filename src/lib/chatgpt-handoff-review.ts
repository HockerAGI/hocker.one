export const CHATGPT_REVIEW_SOURCE_ID = "chatgpt-hocker-project-handoff";

export function parseHockerChatgptHandoffUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /^https:\/\/github\.com\/HockerAGI\/hocker\.one\/issues\/306#issuecomment-([1-9][0-9]{5,18})$/.exec(value.trim());
  return m?.[1] ?? null;
}
