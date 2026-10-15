CREATE TABLE `ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rater_id` integer NOT NULL,
	`rated_id` integer NOT NULL,
	`stars` integer NOT NULL,
	`comment` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`rater_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rated_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ratings_rater_rated_uq` ON `ratings` (`rater_id`,`rated_id`);--> statement-breakpoint
CREATE INDEX `ratings_rated_idx` ON `ratings` (`rated_id`,`updated_at`);