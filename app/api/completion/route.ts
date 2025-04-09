import { CoreMessage, generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const { text } = await generateText({
    model: openai("gpt-4"),
    system: "You are a helpful assistant.",
    messages,
  });

  return Response.json({ text });
}
