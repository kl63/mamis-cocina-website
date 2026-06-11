-- Simpler approach: Update the specific item
-- First, let's see what we have
SELECT id, name, customization_options 
FROM menu_items 
WHERE name = 'Chilaquiles';

-- If you see the data, you can manually update it with the correct JSON
-- Replace 'ITEM_ID_HERE' with the actual ID from the query above
-- UPDATE menu_items
-- SET customization_options = '[
--   {
--     "name": "Protein Choices",
--     "options": [
--       {"label": "Pollo / Chicken", "price_modifier": 0},
--       {"label": "Bistec / Beef", "price_modifier": 1},
--       {"label": "Carnitas / Pork", "price_modifier": 0},
--       {"label": "Al Pastor / Marinated Pork", "price_modifier": 0},
--       {"label": "Cecina", "price_modifier": 2},
--       {"label": "Chorizo / Mexican Sausage", "price_modifier": 0},
--       {"label": "Carne Enchilada / Marinated Pork", "price_modifier": 0},
--       {"label": "Con Huevos / With Eggs", "price_modifier": 2}
--     ]
--   }
-- ]'::jsonb
-- WHERE id = 'ITEM_ID_HERE';
