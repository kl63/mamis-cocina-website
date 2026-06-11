-- Add Spanish translation fields to menu_items and menu_categories

-- Add Spanish fields to menu_items
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS name_es TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- Add Spanish fields to menu_categories
ALTER TABLE menu_categories
ADD COLUMN IF NOT EXISTS name_es TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- Add comments for clarity
COMMENT ON COLUMN menu_items.name_es IS 'Spanish translation of menu item name';
COMMENT ON COLUMN menu_items.description_es IS 'Spanish translation of menu item description';
COMMENT ON COLUMN menu_categories.name_es IS 'Spanish translation of category name';
COMMENT ON COLUMN menu_categories.description_es IS 'Spanish translation of category description';
