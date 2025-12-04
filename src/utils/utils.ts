import type { Response } from "express"


export function asterikLongText(text: string) {
  return text.slice(0, text.length / 2) + "*".repeat(text.length / 2)
}

export const seeRequiredHeaders = (res: Response) => {
  // required for SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // optional Cors
  res.setHeader('Access-Control-Allow-Origin', "*");
  return res
}

export const textPlainRequiredHeaders = (res: Response) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");
  return res
}