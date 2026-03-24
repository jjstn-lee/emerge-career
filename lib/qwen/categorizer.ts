export type Category = "usage" | "education" | "career";

const MLVOCA_URL = "https://mlvoca.com/api/generate";
const MODEL = "deepseek-r1:1.5b";

function buildPrompt(subject: string, body: string) {
    return `You are an email classification assistant.

    Your task is to read the email subject and body, and classify the email into exactly one of the following categories:

    - "usage": Issues related to using the product, (i.e, account, login, billing, settings, etc.)
    - "education": Clarifying questions about course material or issues related to scheduling tests
    - "career": Issues related to job placement, career coaching, employers, etc.

    Instructions:
    - Choose the single best category.
    - You MUST choose one category.
    - Respond with ONLY the category name (no explanation).
    - Respond with plain text only. Do not use markdown, bullet points, headers, special characters, newline characters, or formatting of any kind.

    Email Subject:
    ${subject}

    Email Body:
    ${body}`;
}

interface MlvocaResponse {
  response: string;
  done: boolean;
}

export async function categorizeEmail(subject: string, body: string): Promise<string> {
  const response = await fetch(MLVOCA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: buildPrompt(subject, body),
        stream: false,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mlvoca API error ${response.status}: ${errorText}`);
    }

    const data: MlvocaResponse = await response.json();


    console.log("----before cleaning----");
    console.log(data.response);
    console.log("-----------------------");
    

    return data.response
      .trim()
      .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '') // remove <think>...</think> blocks first
      .replace(/<[\s\S]*?>/g, '')                       // remove any remaining <...> tags and everything between the angle brackets
      .replace(/[\n\r]+/g, '')                          // newlines
      .replace(/[*_~`#]+/g, '')                         // markdown symbols (note: '>' removed above)
      .toLowerCase()
}