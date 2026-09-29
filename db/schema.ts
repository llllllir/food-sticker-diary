// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const meals = sqliteTable('meals', {
 id: text('id').primaryKey(), owner: text('owner').notNull(), date: text('date').notNull(),
 meal: text('meal').notNull(), food: text('food').notNull(), amount: text('amount').notNull(), note: text('note').notNull(), created: text('created').notNull(),
}, t => [index('idx_meals_owner_date').on(t.owner, t.date)]);
