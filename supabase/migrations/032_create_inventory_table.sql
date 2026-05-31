-- Create inventory table for tracking menu item stock levels
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  last_restocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id)
);

-- Add RLS policies
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read inventory
CREATE POLICY "allow_authenticated_read_inventory"
  ON public.inventory
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage inventory
CREATE POLICY "allow_admin_manage_inventory"
  ON public.inventory
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_menu_item_id ON public.inventory(menu_item_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Seed initial inventory for existing menu items
INSERT INTO public.inventory (menu_item_id, quantity, low_stock_threshold)
SELECT 
  id,
  50, -- Default starting quantity
  10  -- Default low stock threshold
FROM public.menu_items
ON CONFLICT (menu_item_id) DO NOTHING;
