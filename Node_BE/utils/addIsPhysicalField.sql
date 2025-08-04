-- Migration script to add is_physical field to ingredient_type table
-- Run this script on existing databases to add the new field

-- Add the is_physical column to the ingredient_type table
ALTER TABLE `ingredient_type` ADD COLUMN `is_physical` TINYINT(1) NOT NULL DEFAULT 1;

-- Update existing ingredient types to set appropriate is_physical values
-- Extra Shot is considered non-physical (service)
UPDATE `ingredient_type` SET `is_physical` = 0 WHERE `name` = 'Extra Shot';

-- All other ingredient types are physical
UPDATE `ingredient_type` SET `is_physical` = 1 WHERE `name` != 'Extra Shot';

-- Verify the changes
SELECT `id`, `name`, `is_physical` FROM `ingredient_type` ORDER BY `name`; 