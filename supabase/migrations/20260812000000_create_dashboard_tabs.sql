-- Migration to create simplified dashboard_tabs table (id, name, is_visible)
CREATE TABLE IF NOT EXISTS public.dashboard_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.dashboard_tabs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read dashboard tabs
CREATE POLICY "Allow public read access to dashboard tabs" 
    ON public.dashboard_tabs
    FOR SELECT 
    USING (true);

-- RLS Policy: Allow write access for admin
CREATE POLICY "Allow write access to dashboard tabs for admin" 
    ON public.dashboard_tabs
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Insert Seed Data (Dashboard tabs with only name and is_visible)
INSERT INTO public.dashboard_tabs (name, is_visible)
VALUES 
    ('Dashboard', true),
    ('AI Trade', true),
    ('AI Chat', true),
    ('AI Strategy', true),
    ('Economic Calendar', true),
    ('Credit History', true),
    ('Subscription Plans', true),
    ('Broker', true),
    ('Profile', true)
ON CONFLICT (name) 
DO UPDATE SET 
    is_visible = EXCLUDED.is_visible;

--------------------------------------------------------------------------------
-- RPC FUNCTIONS
--------------------------------------------------------------------------------

-- 1. RPC to get only VISIBLE tabs (for user dashboard)
CREATE OR REPLACE FUNCTION public.get_visible_dashboard_tabs()
RETURNS SETOF public.dashboard_tabs
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT * 
    FROM public.dashboard_tabs 
    WHERE is_visible = true;
$$;

-- 2. RPC to get ALL tabs (for admin panel)
CREATE OR REPLACE FUNCTION public.get_all_dashboard_tabs_admin()
RETURNS SETOF public.dashboard_tabs
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT * 
    FROM public.dashboard_tabs;
$$;

-- 3. RPC to Toggle Tab Visibility (true / false) by tab ID
CREATE OR REPLACE FUNCTION public.toggle_dashboard_tab_visibility(
    p_id UUID,
    p_is_visible BOOLEAN
)
RETURNS public.dashboard_tabs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_tab public.dashboard_tabs;
BEGIN
    UPDATE public.dashboard_tabs
    SET is_visible = p_is_visible
    WHERE id = p_id
    RETURNING * INTO v_updated_tab;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tab with id % not found', p_id;
    END IF;

    RETURN v_updated_tab;
END;
$$;

-- 4. RPC to Add a New Tab (Admin creating new tab)
CREATE OR REPLACE FUNCTION public.add_dashboard_tab(
    p_name TEXT,
    p_is_visible BOOLEAN DEFAULT true
)
RETURNS public.dashboard_tabs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tab public.dashboard_tabs;
BEGIN
    INSERT INTO public.dashboard_tabs (name, is_visible)
    VALUES (p_name, p_is_visible)
    ON CONFLICT (name) DO UPDATE SET
        is_visible = EXCLUDED.is_visible
    RETURNING * INTO v_tab;

    RETURN v_tab;
END;
$$;
