"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type {
  AgentPhase,
  AgentState,
  Mission,
  ToolCall,
  ToolResult,
  AgentEvent,
} from "@/lib/types";

interface AgentStore {
  state: AgentState | null;
  events: AgentEvent[];
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
}

type AgentAction =
  | { type: "INIT"; payload: { sessionId: string; mission: Mission } }
  | { type: "SET_PHASE"; payload: { phase: AgentPhase; iteration: number } }
  | { type: "SET_THOUGHT"; payload: string }
  | { type: "SET_TOOL_CALL"; payload: ToolCall }
  | { type: "SET_TOOL_RESULT"; payload: ToolResult }
  | { type: "SET_OBSERVATION"; payload: string }
  | { type: "SET_COMPLETE"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  | { type: "ADD_EVENT"; payload: AgentEvent }
  | { type: "RESET" };

const initialState: AgentStore = {
  state: null,
  events: [],
  isRunning: false,
  isComplete: false,
  error: null,
};

function agentReducer(state: AgentStore, action: AgentAction): AgentStore {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        state: {
          sessionId: action.payload.sessionId,
          missionId: "",
          iteration: 0,
          phase: "idle",
          mission: action.payload.mission,
          reasoning: "",
          toolCall: null,
          toolResult: null,
          observations: "",
          missionComplete: false,
          error: null,
          startedAt: Date.now(),
          updatedAt: Date.now(),
        },
        isRunning: true,
        isComplete: false,
        error: null,
        events: [],
      };
    case "SET_PHASE":
      return {
        ...state,
        state: state.state
          ? {
              ...state.state,
              phase: action.payload.phase,
              iteration: action.payload.iteration,
              updatedAt: Date.now(),
            }
          : null,
      };
    case "SET_THOUGHT":
      return {
        ...state,
        state: state.state
          ? { ...state.state, reasoning: action.payload, updatedAt: Date.now() }
          : null,
      };
    case "SET_TOOL_CALL":
      return {
        ...state,
        state: state.state
          ? {
              ...state.state,
              toolCall: action.payload,
              updatedAt: Date.now(),
            }
          : null,
      };
    case "SET_TOOL_RESULT":
      return {
        ...state,
        state: state.state
          ? {
              ...state.state,
              toolResult: action.payload,
              updatedAt: Date.now(),
            }
          : null,
      };
    case "SET_OBSERVATION":
      return {
        ...state,
        state: state.state
          ? {
              ...state.state,
              observations: action.payload,
              updatedAt: Date.now(),
            }
          : null,
      };
    case "SET_COMPLETE":
      return {
        ...state,
        state: state.state
          ? {
              ...state.state,
              phase: "complete",
              missionComplete: true,
              updatedAt: Date.now(),
            }
          : null,
        isRunning: false,
        isComplete: true,
      };
    case "SET_ERROR":
      return {
        ...state,
        state: state.state
          ? {
              ...state.state,
              phase: "error",
              error: action.payload,
              updatedAt: Date.now(),
            }
          : null,
        isRunning: false,
        error: action.payload,
      };
    case "ADD_EVENT":
      return {
        ...state,
        events: [...state.events, action.payload],
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const AgentContext = createContext<{
  store: AgentStore;
  dispatch: React.Dispatch<AgentAction>;
  init: (sessionId: string, mission: Mission) => void;
  setPhase: (phase: AgentPhase, iteration: number) => void;
  setThought: (thought: string) => void;
  setToolCall: (call: ToolCall) => void;
  setToolResult: (result: ToolResult) => void;
  setObservation: (obs: string) => void;
  setComplete: (summary: string) => void;
  setError: (error: string) => void;
  addEvent: (event: AgentEvent) => void;
  reset: () => void;
} | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(agentReducer, initialState);

  const init = useCallback(
    (sessionId: string, mission: Mission) =>
      dispatch({ type: "INIT", payload: { sessionId, mission } }),
    []
  );

  const setPhase = useCallback(
    (phase: AgentPhase, iteration: number) =>
      dispatch({ type: "SET_PHASE", payload: { phase, iteration } }),
    []
  );

  const setThought = useCallback(
    (thought: string) => dispatch({ type: "SET_THOUGHT", payload: thought }),
    []
  );

  const setToolCall = useCallback(
    (call: ToolCall) => dispatch({ type: "SET_TOOL_CALL", payload: call }),
    []
  );

  const setToolResult = useCallback(
    (result: ToolResult) =>
      dispatch({ type: "SET_TOOL_RESULT", payload: result }),
    []
  );

  const setObservation = useCallback(
    (obs: string) => dispatch({ type: "SET_OBSERVATION", payload: obs }),
    []
  );

  const setComplete = useCallback(
    (summary: string) => dispatch({ type: "SET_COMPLETE", payload: summary }),
    []
  );

  const setError = useCallback(
    (error: string) => dispatch({ type: "SET_ERROR", payload: error }),
    []
  );

  const addEvent = useCallback(
    (event: AgentEvent) => dispatch({ type: "ADD_EVENT", payload: event }),
    []
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <AgentContext.Provider
      value={{
        store,
        dispatch,
        init,
        setPhase,
        setThought,
        setToolCall,
        setToolResult,
        setObservation,
        setComplete,
        setError,
        addEvent,
        reset,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): NonNullable<typeof AgentContext extends React.Context<infer T> ? T : never> {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return ctx;
}
