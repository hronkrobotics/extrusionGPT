"use client";

import { create } from "zustand";
import {
  compileDesign,
  DEFAULT_WORKBENCH_INTENT,
  type CompiledDesign,
  type DesignDocument,
  type NodeOverride,
  type WorkbenchIntent,
} from "@extrusiongpt/core";

/**
 * The studio store holds the source-of-truth DesignDocument. The compiled
 * design (graph + geometry + bom) is a memoized derivation recomputed on every
 * edit -- this is the "regenerate while preserving intent" loop, entirely
 * client-side and LLM-free.
 */

function makeDocument(intent: WorkbenchIntent, name = "Untitled workbench"): DesignDocument {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    version: 1,
    familyId: intent.family,
    intent,
    overrides: [],
    meta: { createdAt: now, updatedAt: now },
  };
}

const initialDocument = makeDocument(DEFAULT_WORKBENCH_INTENT);

export interface StudioState {
  document: DesignDocument;
  compiled: CompiledDesign;
  selectedNodeId: string | null;
  planning: boolean;
  assumptions: string[];
  error: string | null;

  setIntent: (patch: Partial<WorkbenchIntent>) => void;
  loadDocument: (doc: DesignDocument, assumptions?: string[]) => void;
  applyOverride: (override: NodeOverride) => void;
  removeOverride: (nodeId: string) => void;
  clearOverrides: () => void;
  select: (nodeId: string | null) => void;
  setPlanning: (planning: boolean) => void;
  setError: (error: string | null) => void;
  rename: (name: string) => void;
}

function recompile(doc: DesignDocument): CompiledDesign {
  return compileDesign(doc);
}

export const useStudio = create<StudioState>((set, get) => ({
  document: initialDocument,
  compiled: recompile(initialDocument),
  selectedNodeId: null,
  planning: false,
  assumptions: [],
  error: null,

  setIntent: (patch) =>
    set((state) => {
      const intent = { ...state.document.intent, ...patch } as WorkbenchIntent;
      const document: DesignDocument = {
        ...state.document,
        intent,
        meta: { ...state.document.meta, updatedAt: new Date().toISOString() },
      };
      return { document, compiled: recompile(document), error: null };
    }),

  loadDocument: (doc, assumptions = []) =>
    set(() => ({
      document: doc,
      compiled: recompile(doc),
      assumptions,
      selectedNodeId: null,
      error: null,
    })),

  applyOverride: (override) =>
    set((state) => {
      const rest = state.document.overrides.filter((o) => o.nodeId !== override.nodeId);
      const overrides = [...rest, override];
      const document = { ...state.document, overrides };
      return { document, compiled: recompile(document) };
    }),

  removeOverride: (nodeId) =>
    set((state) => {
      const overrides = state.document.overrides.filter((o) => o.nodeId !== nodeId);
      const document = { ...state.document, overrides };
      return { document, compiled: recompile(document) };
    }),

  clearOverrides: () =>
    set((state) => {
      const document = { ...state.document, overrides: [] };
      return { document, compiled: recompile(document) };
    }),

  select: (nodeId) => set({ selectedNodeId: nodeId }),
  setPlanning: (planning) => set({ planning }),
  setError: (error) => set({ error }),
  rename: (name) =>
    set((state) => ({ document: { ...state.document, name } })),
}));

export { makeDocument };
