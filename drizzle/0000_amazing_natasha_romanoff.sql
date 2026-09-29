CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`date` text NOT NULL,
	`meal` text NOT NULL,
	`food` text NOT NULL,
	`amount` text NOT NULL,
	`note` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_meals_owner_date` ON `meals` (`owner`,`date`);