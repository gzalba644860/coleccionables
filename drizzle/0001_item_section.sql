ALTER TABLE `items` ADD `section` text;--> statement-breakpoint
CREATE INDEX `items_collection_section_idx` ON `items` (`collection_id`,`section`);