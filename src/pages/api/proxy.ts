import type { APIRoute } from "astro";
import { generateProxyPayload } from "@/utils/openAI";
import { verifySignature } from "@/utils/auth";

const httpsProxy = import.meta.env.HTTPS_PROXY;
const baseUrl = (
  import.meta.env.OPENAI_API_BASE_URL || "https://api.openai.com"
)
  .trim()
  .replace(/\/$/, "");
const openaiProxyApi = import.meta.env.OPENAI_API_PROXY_URL;

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const { sign, time, messages } = body;

  if (!messages) {
    return new Response("No input text");
  }

  if (
    import.meta.env.PROD &&
    !(await verifySignature(
      { t: time, m: messages?.[messages.length - 1]?.content || "" },
      sign
    ))
  ) {
    return new Response("Invalid signature");
  }

  const initOptions = generateProxyPayload(messages);

  const url = openaiProxyApi
    ? openaiProxyApi
    : `${baseUrl}/v1/chat/completions`;

  // @ts-ignore
  const response = (await fetch(url, initOptions)) as Response;

  return new Response(response.body);
};
