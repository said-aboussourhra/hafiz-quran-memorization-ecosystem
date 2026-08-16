import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  passwordSalt: varchar("password_salt", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Per-user memorization progress for each surah.
// status: not_started | learning | memorized | mastered
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  surahNumber: integer("surah_number").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("learning"),
  memorizedAyahs: integer("memorized_ayahs").notNull().default(0),
  retention: integer("retention").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Progress = typeof progress.$inferSelect;
