import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { DesignDocumentSchema } from "@extrusiongpt/core";
import { getDb, schema } from "@/db/client";

export const runtime = "nodejs";

const NO_DB = () =>
  NextResponse.json(
    { error: "Persistence is not configured. Set DATABASE_URL to enable saving." },
    { status: 503 },
  );

/** GET /api/designs -> list of saved designs (most recent first). */
export async function GET() {
  const db = getDb();
  if (!db) return NO_DB();
  const rows = await db.select().from(schema.designs).orderBy(desc(schema.designs.updatedAt));
  return NextResponse.json({ designs: rows });
}

/** POST /api/designs { document } -> creates a design + its first version. */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return NO_DB();

  const body = await req.json().catch(() => null);
  const parsed = DesignDocumentSchema.safeParse(body?.document);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid design document." }, { status: 400 });
  }
  const doc = parsed.data;

  const [design] = await db
    .insert(schema.designs)
    .values({ id: doc.id, name: doc.name, familyId: doc.familyId })
    .returning();

  await db.insert(schema.designVersions).values({
    designId: doc.id,
    version: doc.version,
    document: doc,
  });

  return NextResponse.json({ design }, { status: 201 });
}
