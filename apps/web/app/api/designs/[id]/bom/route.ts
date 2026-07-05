import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { compileDesign, DesignDocumentSchema, type Bom } from "@extrusiongpt/core";
import { getDb, schema } from "@/db/client";

export const runtime = "nodejs";

/** GET /api/designs/:id/bom?format=csv|json -> BOM for the latest version. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Persistence is not configured. Set DATABASE_URL to enable saving." },
      { status: 503 },
    );
  }

  const [latest] = await db
    .select()
    .from(schema.designVersions)
    .where(eq(schema.designVersions.designId, params.id))
    .orderBy(desc(schema.designVersions.version))
    .limit(1);

  if (!latest) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = DesignDocumentSchema.safeParse(latest.document);
  if (!parsed.success) {
    return NextResponse.json({ error: "Stored document is invalid." }, { status: 500 });
  }

  const { bom } = compileDesign(parsed.data);
  const format = new URL(req.url).searchParams.get("format") ?? "json";

  if (format === "csv") {
    return new NextResponse(toCsv(bom), {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename="${params.id}-bom.csv"`,
      },
    });
  }
  return NextResponse.json({ bom });
}

function toCsv(bom: Bom): string {
  const header = ["qty", "description", "length_mm", "unit_cost", "line_cost", "line_weight_g", "vendor", "sku"];
  const rows = bom.lines.map((l) =>
    [l.qty, l.description, l.lengthMm ?? "", l.unitCost, l.lineCost, l.lineWeight, l.vendor ?? "", l.sku ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
