import { check, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const feedbackEntries = sqliteTable('feedback_entries', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
  authorSiteUserId: text('author_site_user_id'),
  legacySourceId: text('legacy_source_id'),
}, table => [
  uniqueIndex('feedback_entries_legacy_source_id_unique').on(table.legacySourceId),
  check('feedback_entries_category_check', sql`${table.category} in ('message','game','feature','complaint','other')`),
  check('feedback_entries_status_check', sql`${table.status} in ('new','read','planned','done')`),
]);
