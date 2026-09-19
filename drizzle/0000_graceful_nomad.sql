CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`email_id` text,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`note` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_session_created` ON `audit` (`session`,`created_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`session` text NOT NULL,
	`email_id` text NOT NULL,
	`result` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`session`, `email_id`)
);
