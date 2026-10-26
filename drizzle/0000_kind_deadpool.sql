CREATE TABLE `feedback_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`author_site_user_id` text,
	`legacy_source_id` text,
	CONSTRAINT "feedback_entries_category_check" CHECK("feedback_entries"."category" in ('message','game','feature','complaint','other')),
	CONSTRAINT "feedback_entries_status_check" CHECK("feedback_entries"."status" in ('new','read','planned','done'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_entries_legacy_source_id_unique` ON `feedback_entries` (`legacy_source_id`);