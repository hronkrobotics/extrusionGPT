import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { DesignDocumentSchema } from "@extrusiongpt/core";
import { getDb, schema } from "@/db/client";

export const runtime = "nodejs";

const NO_DB = () =>
  NextResponse.json(
    { error: "Persistence is not configured. Set DATABASE_URL to enable saving." },
    { status: 503 },
  );

/** GET /api/designs/:id -> latest document for a design. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return NO_DB();

  const [latest] = await db
    .select()
    .from(schema.designVersions)
    .where(eq(schema.designVersions.designId, params.id))
    .orderBy(desc(schema.designVersions.version))
    .limit(1);

  if (!latest) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ document: latest.document, version: latest.version });
}

/** PATCH /api/designs/:id { document } -> appends a new version. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return NO_DB();

  const body = await req.json().catch(() => null);
  const parsed = DesignDocumentSchema.safeParse(body?.document);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid design document." }, { status: 400 });
  }
  const doc = parsed.data;

  const [latest] = await db
    .select({ version: schema.designVersions.version })
    .from(schema.designVersions)
    .where(eq(schema.designVersions.designId, params.id))
    .orderBy(desc(schema.designVersions.version))
    .limit(1);

  const nextVersion = (latest?.version ?? 0) + 1;

  await db.insert(schema.designVersions).values({
    designId: params.id,
    version: nextVersion,
    document: { ...doc, version: nextVersion },
  });

  await db
    .update(schema.designs)
    .set({ name: doc.name, updatedAt: new Date() })
    .where(and(eq(schema.designs.id, params.id)));

  return NextResponse.json({ ok: true, version: nextVersion });
}
