-- Add is_spicy column to menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_spicy BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN menu_items.is_spicy IS 'Indicates if the menu item is spicy';
