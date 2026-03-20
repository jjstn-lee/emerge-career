import OpenAI from "openai";

export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type Category = "usage" | "account" | "feedback";

function buildPrompt(subject: string, body: string) {
    return `
        You are an email classification assistant.

        Your task is to read the email subject and body, and classify the email into exactly one of the following categories:

        - "usage": Questions or issues about how to use the product, features, errors, bugs, or performance.
        - "account": Issues related to login, billing, subscriptions, account settings, or personal data.
        - "feedback": Suggestions, feature requests, opinions, compliments, or complaints not tied to a specific usage issue.

        Instructions:
        - Choose the single best category.
        - Respond with ONLY the category name (no explanation).

        Email Subject:
        ${subject}

        Email Body:
        ${body}
    `;
}

export async function categorize(subject: string, body: string) {
    const prompt = buildPrompt(subject, body)

    const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
    })
    console.log("in openai lib, ")

    const category = response.output_text.trim() as Category
    console.log(`in openai lib, category = ${ category }`)

    return response.output_text.trim() as Category
}

