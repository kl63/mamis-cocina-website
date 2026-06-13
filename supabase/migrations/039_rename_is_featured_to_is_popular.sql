-- Rename is_featured column to is_popular in menu_items table
ALTER TABLE menu_items 
RENAME COLUMN is_featured TO is_popular;

-- Update the index name if it exists
DROP INDEX IF EXISTS idx_menu_items_is_featured;
CREATE INDEX IF NOT EXISTS idx_menu_items_is_popular ON menu_items(is_popular);

-- Add comment for clarity
COMMENT ON COLUMN menu_items.is_popular IS 'Indicates if the menu item should be featured as popular on the home page';
