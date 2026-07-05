import type { AssemblyGraph, Connection, PartNode } from "../../schema/assembly-graph.js";
import type { Transform } from "../../schema/geometry.js";
import { IDENTITY_QUAT, alongAxis, vec3 } from "../../schema/geometry.js";
import type { WorkbenchIntent } from "../../schema/design-intent.js";
import { getModule } from "../../modules/registry.js";
import { CORNERS, SHELF_PANEL_THICKNESS, computeLayout, type WorkbenchLayout } from "./rules.js";

/**
 * Workbench generator: DesignIntent -> AssemblyGraph.
 *
 * Emits absolute world transforms and stable, semantic node ids so that
 * regeneration after a parameter change reproduces the same ids (which is what
 * lets selection state and overrides survive).
 */

function node(
  id: string,
  role: string,
  moduleId: string,
  params: Record<string, number | string | boolean>,
  position: { x: number; y: number; z: number },
  rotation = { ...IDENTITY_QUAT },
  tags: string[] = [],
): PartNode {
  const mod = getModule(moduleId);
  const parsed = mod.paramSchema.safeParse(params);
  const validated = parsed.success ? (parsed.data as never) : (params as never);
  return {
    id,
    role,
    moduleId,
    params,
    transform: { position, rotation } satisfies Transform,
    connectionPoints: mod.connectionPoints(validated),
    meta: { generatedBy: "generator", tags },
  };
}

function connection(
  id: string,
  type: Connection["type"],
  a: { nodeId: string; connectionPointId: string },
  b: { nodeId: string; connectionPointId: string },
  hardware: string[] = [],
): Connection {
  return { id, type, a, b, hardware, meta: {} };
}

function buildFrame(
  layout: WorkbenchLayout,
  prefix: string,
  railY: number,
  nodes: PartNode[],
  connections: Connection[],
): void {
  const { profileModuleId, railLenX, railLenZ, legX, legZ, s } = layout;

  const xRails: { key: string; z: number }[] = [
    { key: "front", z: legZ },
    { key: "back", z: -legZ },
  ];
  for (const r of xRails) {
    nodes.push(
      node(
        `${prefix}/rail/${r.key}`,
        `${prefix} rail ${r.key}`,
        profileModuleId,
        { length: railLenX },
        vec3(0, railY, r.z),
        alongAxis("x"),
        ["rail"],
      ),
    );
  }

  const zRails: { key: string; x: number }[] = [
    { key: "left", x: -legX },
    { key: "right", x: legX },
  ];
  for (const r of zRails) {
    nodes.push(
      node(
        `${prefix}/rail/${r.key}`,
        `${prefix} rail ${r.key}`,
        profileModuleId,
        { length: railLenZ },
        vec3(r.x, railY, 0),
        alongAxis("z"),
        ["rail"],
      ),
    );
  }

  // Corner brackets tie each pair of perpendicular rails together, consuming
  // t-nuts + bolts (counted via the connection, not rendered individually).
  for (const c of CORNERS) {
    const bracketId = `${prefix}/bracket/${c.id}`;
    const xRailKey = c.sz === 1 ? "front" : "back";
    const zRailKey = c.sx === 1 ? "right" : "left";
    nodes.push(
      node(
        bracketId,
        `${prefix} corner bracket ${c.id}`,
        "corner-bracket",
        {},
        vec3(c.sx * (legX - s / 2), railY, c.sz * (legZ - s / 2)),
        { ...IDENTITY_QUAT },
        ["bracket"],
      ),
    );
    connections.push(
      connection(
        `${prefix}/joint/${c.id}/x`,
        "bracket",
        { nodeId: bracketId, connectionPointId: "face-a" },
        { nodeId: `${prefix}/rail/${xRailKey}`, connectionPointId: "slot-mid" },
        ["tnut", "tnut"],
      ),
    );
    connections.push(
      connection(
        `${prefix}/joint/${c.id}/z`,
        "bracket",
        { nodeId: bracketId, connectionPointId: "face-b" },
        { nodeId: `${prefix}/rail/${zRailKey}`, connectionPointId: "slot-mid" },
        ["tnut", "tnut"],
      ),
    );
  }
}

export function generateWorkbench(intent: WorkbenchIntent): AssemblyGraph {
  const layout = computeLayout(intent);
  const nodes: PartNode[] = [];
  const connections: Connection[] = [];

  // Legs
  const legCenterY = layout.footHeight + layout.legLen / 2;
  for (const c of CORNERS) {
    const legId = `leg/${c.id}`;
    nodes.push(
      node(
        legId,
        `leg ${c.id}`,
        layout.profileModuleId,
        { length: layout.legLen },
        vec3(c.sx * layout.legX, legCenterY, c.sz * layout.legZ),
        alongAxis("y"),
        ["leg"],
      ),
    );

    // Feet / casters under each leg.
    const footId = `${layout.footModuleId}/${c.id}`;
    nodes.push(
      node(
        footId,
        `${layout.footModuleId} ${c.id}`,
        layout.footModuleId,
        {},
        vec3(c.sx * layout.legX, layout.footHeight / 2, c.sz * layout.legZ),
        { ...IDENTITY_QUAT },
        [layout.footModuleId],
      ),
    );
    connections.push(
      connection(
        `joint/foot/${c.id}`,
        "butt",
        { nodeId: legId, connectionPointId: "end-a" },
        { nodeId: footId, connectionPointId: "mount" },
        ["tnut"],
      ),
    );
  }

  // Top frame + brackets
  buildFrame(layout, "top", layout.railY, nodes, connections);

  // Leg-to-top-frame corner joints
  for (const c of CORNERS) {
    connections.push(
      connection(
        `joint/leg-top/${c.id}`,
        "bracket",
        { nodeId: `leg/${c.id}`, connectionPointId: "end-b" },
        { nodeId: `top/bracket/${c.id}`, connectionPointId: "face-a" },
        ["tnut", "tnut"],
      ),
    );
  }

  // Optional gussets at the top corners for tall benches.
  if (layout.useGussets) {
    for (const c of CORNERS) {
      nodes.push(
        node(
          `gusset/${c.id}`,
          `gusset ${c.id}`,
          "gusset",
          {},
          vec3(
            c.sx * (layout.legX - layout.s),
            layout.legTopY - 40,
            c.sz * (layout.legZ - layout.s),
          ),
          { ...IDENTITY_QUAT },
          ["gusset"],
        ),
      );
      connections.push(
        connection(
          `joint/gusset/${c.id}`,
          "bracket",
          { nodeId: `gusset/${c.id}`, connectionPointId: "face-a" },
          { nodeId: `leg/${c.id}`, connectionPointId: "slot-mid" },
          ["tnut", "tnut"],
        ),
      );
    }
  }

  // Top work-surface panel
  if (intent.topPanel) {
    nodes.push(
      node(
        "panel/top",
        "top panel",
        "shelf-panel",
        { width: layout.W, depth: layout.D, thickness: SHELF_PANEL_THICKNESS },
        vec3(0, layout.H - SHELF_PANEL_THICKNESS / 2, 0),
        { ...IDENTITY_QUAT },
        ["panel", "top"],
      ),
    );
    connections.push(
      connection(
        "joint/panel-top",
        "panel-mount",
        { nodeId: "panel/top", connectionPointId: "corner-fl" },
        { nodeId: "top/rail/front", connectionPointId: "slot-mid" },
        ["tnut", "tnut", "tnut", "tnut"],
      ),
    );
  }

  // Shelves
  for (const shelf of layout.shelves) {
    const prefix = `shelf/${shelf.index}`;
    buildFrame(layout, prefix, shelf.railY, nodes, connections);
    const panelW = Math.max(20, layout.W - 2 * layout.section.x);
    const panelD = Math.max(20, layout.D - 2 * layout.section.x);
    nodes.push(
      node(
        `${prefix}/panel`,
        `shelf ${shelf.index} panel`,
        "shelf-panel",
        { width: panelW, depth: panelD, thickness: SHELF_PANEL_THICKNESS },
        vec3(0, shelf.railY + layout.s / 2 + SHELF_PANEL_THICKNESS / 2, 0),
        { ...IDENTITY_QUAT },
        ["panel", "shelf"],
      ),
    );
    connections.push(
      connection(
        `${prefix}/joint/panel`,
        "panel-mount",
        { nodeId: `${prefix}/panel`, connectionPointId: "corner-fl" },
        { nodeId: `${prefix}/rail/front`, connectionPointId: "slot-mid" },
        ["tnut", "tnut", "tnut", "tnut"],
      ),
    );
  }

  return {
    nodes,
    connections,
    constraints: [],
    params: [
      { name: "width", value: layout.W, unit: "mm", exposed: true },
      { name: "depth", value: layout.D, unit: "mm", exposed: true },
      { name: "height", value: layout.H, unit: "mm", exposed: true },
    ],
    meta: { familyId: "workbench", generatedAt: new Date().toISOString() },
  };
}
