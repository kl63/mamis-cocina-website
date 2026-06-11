-- Add customization_options column to menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS customization_options JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN menu_items.customization_options IS 'Customization options for menu items (e.g., protein choices with price modifiers)';
