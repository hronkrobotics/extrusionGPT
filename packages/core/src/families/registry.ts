import type { AssemblyGraph } from "../schema/assembly-graph.js";
import type { DesignIntent } from "../schema/design-intent.js";
import { generateWorkbench } from "./workbench/generator.js";

/**
 * Family registry. Adding a product family (cnc-frame, enclosure, ...) means
 * registering a generator here; the rest of the pipeline is untouched.
 */

export type FamilyGenerator = (intent: DesignIntent) => AssemblyGraph;

const FAMILIES: Record<string, FamilyGenerator> = {
  workbench: (intent) => {
    if (intent.family !== "workbench") {
      throw new Error(`workbench generator received family "${intent.family}"`);
    }
    return generateWorkbench(intent);
  },
};

export function getFamilyGenerator(familyId: string): FamilyGenerator {
  const gen = FAMILIES[familyId];
  if (!gen) throw new Error(`Unknown product family: "${familyId}"`);
  return gen;
}

export function listFamilies(): string[] {
  return Object.keys(FAMILIES);
}
