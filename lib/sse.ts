import { SSEProgressEvent } from "./types";

type SendFn = (event: SSEProgressEvent) => void;
type SSEHandler = (send: SendFn, signal: AbortSignal) => Promise<void>;

export function createSSEResponse(handler: SSEHandler): Response {
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send: SendFn = (event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream already closed
        }
      };

      try {
        await handler(send, abortController.signal);
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
