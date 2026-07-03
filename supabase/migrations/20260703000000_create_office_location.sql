-- Migration to create hrms_office_location table for geofencing clock-in/out
CREATE TABLE IF NOT EXISTS public.hrms_office_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    name TEXT DEFAULT 'Main Office',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hrms_office_location ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so all employees can fetch it to check distance)
CREATE POLICY "Allow public read access" ON public.hrms_office_location
    FOR SELECT USING (true);

-- Allow write access for authenticated users (admin can update)
CREATE POLICY "Allow write access for all users" ON public.hrms_office_location
    FOR ALL USING (true) WITH CHECK (true);
