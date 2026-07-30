"use client";

import { useEffect, useRef, useCallback } from "react";
import type { AgentEvent } from "@/lib/types";

type EventHandler = (event: AgentEvent) => void;

export function useSSE(url: string, onEvent: EventHandler, onError?: (error: string) => void) {
  const sourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  onEventRef.current = onEvent;
  onErrorRef.current = onError;

  const connect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
    }

    const source = new EventSource(url);
    sourceRef.current = source;

    const events = ["phase", "thought", "tool_call", "tool_result", "memory", "error", "complete"] as const;

    for (const eventType of events) {
      source.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current({ type: eventType, data, timestamp: Date.now() });
        } catch {
          // ignore parse errors
        }
      });
    }

    source.onerror = () => {
      onErrorRef.current?.("SSE connection error");
      source.close();
    };
  }, [url]);

  const disconnect = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    return disconnect;
  }, [disconnect]);

  return { connect, disconnect };
}
