-- ============================================================================
-- BYTEBURGER CONSOLIDATED SCHEMA
-- ============================================================================
-- This file consolidates all ByteBurger migrations into a single schema
-- Use this for fresh deployments instead of running 37+ individual migrations
-- 
-- Created: 2026-05-31
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- ENABLE EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');

-- Delivery type enum
CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery', 'dine-in');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  preparation_time INTEGER DEFAULT 15,
  calories INTEGER,
  allergens TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customization options for menu items
CREATE TABLE IF NOT EXISTS public.customization_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'single', 'multiple', 'quantity'
  required BOOLEAN DEFAULT FALSE,
  max_selections INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customization choices
CREATE TABLE IF NOT EXISTS public.customization_choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id UUID REFERENCES customization_options(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status order_status DEFAULT 'pending',
  delivery_type delivery_type DEFAULT 'pickup',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  tip DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_intent_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  special_instructions TEXT,
  estimated_ready_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  customizations JSONB DEFAULT '[]',
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  customizations JSONB DEFAULT '[]',
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, menu_item_id)
);

-- Restaurant hours
CREATE TABLE IF NOT EXISTS public.restaurant_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Rewards system
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Rewards transactions
CREATE TABLE IF NOT EXISTS public.rewards_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'redeemed', 'expired'
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory tracking
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_menu_item ON inventory(menu_item_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Menu categories policies (public read, admin write)
CREATE POLICY "Anyone can view active categories" ON public.menu_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.menu_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Menu items policies (public read, admin write)
CREATE POLICY "Anyone can view available menu items" ON public.menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can view all menu items" ON public.menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Customization options policies
CREATE POLICY "Anyone can view customization options" ON public.customization_options
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage customization options" ON public.customization_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Customization choices policies
CREATE POLICY "Anyone can view customization choices" ON public.customization_choices
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage customization choices" ON public.customization_choices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Order items policies
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Cart items policies
CREATE POLICY "Users can manage their own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Restaurant hours policies (public read, admin write)
CREATE POLICY "Anyone can view restaurant hours" ON public.restaurant_hours
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage restaurant hours" ON public.restaurant_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Rewards policies
CREATE POLICY "Users can view their own rewards" ON public.rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" ON public.rewards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create rewards" ON public.rewards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all rewards" ON public.rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Rewards transactions policies
CREATE POLICY "Users can view their transactions" ON public.rewards_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" ON public.rewards_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all transactions" ON public.rewards_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Promo codes policies
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
  FOR SELECT USING (is_active = true AND valid_until > NOW());

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Inventory policies
CREATE POLICY "Admins can view inventory" ON public.inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_hours_updated_at BEFORE UPDATE ON public.restaurant_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Create rewards account
  INSERT INTO public.rewards (user_id, points, lifetime_points, tier)
  VALUES (NEW.id, 0, 0, 'bronze');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to award points on order completion
CREATE OR REPLACE FUNCTION award_points_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Award 1 point per dollar spent
    points_to_award := FLOOR(NEW.total_amount);
    
    -- Update rewards
    UPDATE public.rewards
    SET 
      points = points + points_to_award,
      lifetime_points = lifetime_points + points_to_award,
      tier = CASE
        WHEN lifetime_points + points_to_award >= 1000 THEN 'gold'
        WHEN lifetime_points + points_to_award >= 500 THEN 'silver'
        ELSE 'bronze'
      END
    WHERE user_id = NEW.user_id;
    
    -- Log transaction
    INSERT INTO public.rewards_transactions (user_id, points, transaction_type, order_id, description)
    VALUES (NEW.user_id, points_to_award, 'earned', NEW.id, 'Points earned from order');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points
CREATE TRIGGER award_points_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION award_points_on_order_complete();

-- Function to update inventory on order completion
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Decrease inventory for each item in the order
    UPDATE public.inventory
    SET quantity = quantity - oi.quantity
    FROM public.order_items oi
    WHERE inventory.menu_item_id = oi.menu_item_id
    AND oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory
CREATE TRIGGER update_inventory_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default restaurant hours (Monday = 0, Sunday = 6)
INSERT INTO public.restaurant_hours (day_of_week, is_open, open_time, close_time) VALUES
  (0, true, '10:00', '22:00'),  -- Monday
  (1, true, '10:00', '22:00'),  -- Tuesday
  (2, true, '10:00', '22:00'),  -- Wednesday
  (3, true, '10:00', '22:00'),  -- Thursday
  (4, true, '10:00', '23:00'),  -- Friday
  (5, true, '10:00', '23:00'),  -- Saturday
  (6, true, '11:00', '21:00')   -- Sunday
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert sample menu categories
INSERT INTO public.menu_categories (name, description, display_order) VALUES
  ('Burgers', 'Our signature burgers made with 100% beef', 1),
  ('Sides', 'Delicious sides to complement your meal', 2),
  ('Drinks', 'Refreshing beverages', 3),
  ('Desserts', 'Sweet treats to finish your meal', 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ByteBurger schema created successfully!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Add menu items via admin dashboard';
  RAISE NOTICE '   2. Create your first admin user';
  RAISE NOTICE '   3. Configure Stripe and email settings';
  RAISE NOTICE '   4. Test the ordering flow';
END $$;
