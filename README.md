# ExtrusionGPT

AI-powered parametric design platform for modular aluminum extrusion systems.
**MVP scope: workbench generation.**

Describe a workbench in plain language, get an editable parametric design, a
live 3D view, and a costed Bill of Materials. The LLM only extracts a small
**Design Intent**; everything downstream (assembly graph, geometry, BOM) is
generated deterministically.

```
Natural Language
   -> Design Intent          (validated, parametric)
   -> Assembly Graph         (derived: parts + joints + metadata)
   -> Geometry / BOM         (deterministic projections)
   -> 3D Viewer              (React Three Fiber)
```

## Architecture

This is a pnpm monorepo. See the full design document in the plan; the short
version:

- **`packages/core`** - framework-agnostic engine. No React, no Next, no DB.
  Zod schemas (the shared contract), the module library + registry, family
  generators, the geometry engine, overrides, the BOM engine, and the
  deterministic half of the planner. Fully unit-tested with Vitest.
- **`apps/web`** - Next.js (App Router) UI: React Three Fiber viewer, Zustand
  store (holds the source-of-truth `DesignDocument`), parameter + selection
  panels, BOM table, the planner API (`/api/plan`), and optional persistence
  (`/api/designs`).

The **source of truth** is a `DesignDocument = { intent, overrides }`. The
Assembly Graph is a pure, cached derivation: `buildGraph(doc)`. Editing a
parameter re-runs the generator (intent preserved); per-part tweaks live as
non-destructive `overrides` keyed by stable, semantic node ids.

## Getting started

```bash
# 1. Install (pnpm is required)
pnpm install

# 2. Run the core engine tests
pnpm test

# 3. Start the web app
pnpm dev
# -> http://localhost:3000
```

### Optional configuration

Copy `apps/web/.env.example` to `apps/web/.env.local`:

- `OPENAI_API_KEY` - enables LLM intent extraction (Structured Outputs). Without
  it, a built-in deterministic parser handles natural language, so the app is
  fully usable offline.
- `DATABASE_URL` - enables saving designs as versioned JSONB (Postgres /
  Supabase). Without it, the app runs in-memory.

To create the database schema once `DATABASE_URL` is set:

```bash
pnpm --filter @extrusiongpt/web exec drizzle-kit push
```

## Extending

- **New module** (e.g. linear rail): add a `ModuleDefinition` and register it in
  `packages/core/src/modules/registry.ts`.
- **New product family** (e.g. CNC frame): add a generator under
  `packages/core/src/families/` and register it in the family registry. The
  pipeline, schema, viewer, and BOM are untouched.
- **STEP / CAD export** (future): a worker consumes the same Assembly Graph JSON;
  no coupling to the web app.
