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
  email: varchar("email", { length: 200 }),
  passwordHash: varchar("password_hash", { length: 256 }),
  passwordSalt: varchar("password_salt", { length: 64 }),
  // تاريخ الازدياد (YYYY-MM-DD) — يُستخدم مع الاسم لتسهيل الدخول.
  birthDate: varchar("birth_date", { length: 10 }),
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
  // SM-2 spaced repetition
  ease: integer("ease").notNull().default(250), // ease factor ×100 (2.50)
  intervalDays: integer("interval_days").notNull().default(0),
  dueAt: timestamp("due_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Daily activity log — one row per user per day, for streaks & the heatmap.
export const activity = pgTable("activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: varchar("day", { length: 10 }).notNull(), // YYYY-MM-DD
  count: integer("count").notNull().default(0), // ayahs/sessions that day
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type Activity = typeof activity.$inferSelect;
