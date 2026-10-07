import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const earlyAccessSignupsTable = pgTable(
  "early_access_signups",
  {
    id: serial("id").primaryKey(),
    firstName: text("first_name").notNull(),
    email: text("email").notNull(),
    whatsappNumber: text("whatsapp_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("early_access_signups_email_unique").on(table.email)],
);

export const insertEarlyAccessSignupSchema = createInsertSchema(earlyAccessSignupsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertEarlyAccessSignup = z.infer<typeof insertEarlyAccessSignupSchema>;
export type EarlyAccessSignup = typeof earlyAccessSignupsTable.$inferSelect;
