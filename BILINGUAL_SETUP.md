# Bilingual Support Setup Guide

## What's Been Added

Your menu system now supports **bilingual content** (English/Spanish) for both menu items and categories!

## Database Changes

### New Fields Added:
- **Menu Items**: `name_es`, `description_es`
- **Categories**: `name_es`, `description_es`

### To Apply the Migration:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project → SQL Editor
3. Copy and paste the contents of `supabase/migrations/037_add_spanish_translations.sql`
4. Click "Run" to execute the migration

## Admin Panel Updates

### Adding/Editing Menu Items:
- **Side-by-side input fields** for English 🇺🇸 and Spanish 🇲🇽
- Fill in both languages as you add items
- Spanish fields are optional (if left empty, only English shows)

### Example:
```
Name (English): Tacos
Nombre (Español): Tacos

Description (English): Three soft corn tortillas with your choice of protein
Descripción (Español): Tres tortillas de maíz suaves con tu elección de proteína
```

## Menu Page Display

### How It Shows:
- **Category Headers**: "Tacos / Tacos" (English / Spanish)
- **Item Names**: "Beef Tacos / Tacos de Res"
- **Descriptions**: English on first line, Spanish below in lighter gray

### Smart Display Logic:
- If Spanish = English → only shows once (no duplicate)
- If Spanish is empty → only shows English
- If Spanish is different → shows both with "/"

## Tips for Adding Content

1. **Keep it consistent**: Always fill both English and Spanish when possible
2. **Use the format**: "English / Español" is already handled automatically
3. **Customization options**: Already support bilingual labels like "Pollo / Chicken"
4. **Categories**: Update existing categories to add Spanish translations

## Next Steps

1. Run the migration in Supabase Dashboard
2. Refresh your admin page to get a new JWT token
3. Start adding Spanish translations to your menu items!
4. Update existing items to add Spanish versions

## Need Help?

The system automatically:
- Shows both languages when different
- Hides duplicates when same
- Falls back to English if Spanish is missing
- Displays beautifully on the menu page

🌮 ¡Buen provecho!
