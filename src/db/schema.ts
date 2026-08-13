
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
  password_hash: varchar("password_hash", { length: 256 }).notNull(),
  password_salt: varchar("password_salt", { length: 64 }).notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Per-user memorization progress for each surah.
// status: not_started | learning | memorized | mastered
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  surah_number: integer("surah_number").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("learning"),
  memorized_ayahs: integer("memorized_ayahs").notNull().default(0),
  retention: integer("retention").notNull().default(0),
  review_count: integer("review_count").notNull().default(0),
  last_reviewed_at: timestamp("last_reviewed_at"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Progress = typeof progress.$inferSelect;