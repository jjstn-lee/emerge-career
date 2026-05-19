import Anthropic from "@anthropic-ai/sdk";
import { Category, isCategory } from "@/lib/types";

const MODEL = "claude-sonnet-4-20250514";

const client = new Anthropic();

function buildPrompt(subject: string, body: string) {
  return `You are an email classification assistant.

Your task is to read the email subject and body, and classify the email into exactly one of the following categories:

- "education": Questions or complaints about course content, video lessons, quizzes, assignments, certifications, course access, or learning materials.
- "career": Questions or complaints about job placement, job applications, career coaching sessions, resume reviews, employer matching, or other career-related services.
- "usage": Questions or complaints about the platform itself that are unrelated to a specific feature — such as login issues, account access, billing charges, subscription management, or settings.

Instructions:
- If the email mentions both a feature issue (education or career) AND a platform issue (usage), pick the feature category.
- If the email is ambiguous, default to "usage".
- You MUST choose exactly one of the three categories: "education", "career", or "usage".
- Respond with ONLY the category name (no explanation).
- Respond with plain text only. Do not use markdown, bullet points, headers, special characters, newline characters, or formatting of any kind.

Email Subject:
${subject}

Email Body:
${body}`;
}

export async function categorizeEmail(subject: string, body: string): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 16,
    temperature: 0.6,
    messages: [
      {
        role: "user",
        content: buildPrompt(subject, body),
      },
    ],
  });

  const rawResponse = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  console.log("----categorizer raw response----");
  console.log(rawResponse);
  console.log("--------------------------------");

  const cleaned = rawResponse
    .trim()
    .replace(/[\n\r]+/g, " ")
    .replace(/[*_~`#]+/g, "")
    .toLowerCase()
    .trim();

  const match = cleaned.match(/\b(usage|education|career)\b/);

  if (match) {
    const candidate = match[1] as Category;
    if (isCategory(candidate)) {
      return candidate;
    }
  }

  console.error("Categorizer returned invalid category", {
    raw: rawResponse,
    cleaned,
  });
  throw new Error(`Categorizer response was not a valid category: '${cleaned}'`);
}