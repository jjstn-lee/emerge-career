
export interface emailJSON {
    sender: string,
    subject: string,
    body: string,
}

const CATEGORIES = ["usage", "education", "career"] as const;
export type Category = typeof CATEGORIES[number];

export function isCategory(t: unknown): t is Category {
  return CATEGORIES.includes(t as Category);
}