import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { DesignDocument } from "@extrusiongpt/core";

/**
 * Persistence model (Section 12): the DesignDocument is stored as versioned
 * JSONB. The Assembly Graph is NEVER normalized into tables -- it is derived.
 * design_versions is append-only, giving free history + undo.
 */

export const designs = pgTable("designs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"), // nullable: auth is optional for the MVP
  name: text("name").notNull(),
  familyId: text("family_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const designVersions = pgTable("design_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  designId: uuid("design_id")
    .notNull()
    .references(() => designs.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  document: jsonb("document").$type<DesignDocument>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DesignRow = typeof designs.$inferSelect;
export type DesignVersionRow = typeof designVersions.$inferSelect;
