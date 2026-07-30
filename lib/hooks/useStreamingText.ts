"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useStreamingText(target: string, speed = 15) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    stop();
    indexRef.current = 0;
    setDisplayed("");
    intervalRef.current = setInterval(() => {
      if (indexRef.current < target.length) {
        indexRef.current++;
        setDisplayed(target.slice(0, indexRef.current));
      } else {
        stop();
      }
    }, speed);
  }, [target, speed]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const complete = useCallback(() => {
    stop();
    setDisplayed(target);
  }, [target, stop]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return { displayed, start, stop, complete };
}
