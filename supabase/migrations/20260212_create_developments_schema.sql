-- Create Developments Table
CREATE TABLE IF NOT EXISTS developments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL,
    status_commercial TEXT NOT NULL,
    
    price_from DECIMAL(15, 2),
    price_to DECIMAL(15, 2),
    area_from DECIMAL(10, 2),
    area_to DECIMAL(10, 2),
    
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_spaces INTEGER,
    floor_count INTEGER,
    units_count INTEGER,
    
    city TEXT,
    neighborhood TEXT,
    address TEXT,
    country TEXT DEFAULT 'Brasil',
    
    selling_points TEXT[], -- Array of strings
    
    -- Media
    image TEXT,
    gallery_images TEXT[],
    floor_plans TEXT[],
    videos TEXT[],
    virtual_tour_url TEXT,
    brochure_url TEXT,
    
    -- developer_id UUID REFERENCES developers(id), -- Add later if developers table exists
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by TEXT 
);

-- Create Units Table
CREATE TABLE IF NOT EXISTS units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    development_id UUID NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
    
    unit_number TEXT NOT NULL,
    floor INTEGER,
    block TEXT,
    type TEXT,
    
    price DECIMAL(15, 2),
    area DECIMAL(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    
    status TEXT DEFAULT 'available',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Developers Table (Optional for now)
CREATE TABLE IF NOT EXISTS developers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

-- Allow everything for authenticated users (for now)
create policy "Allow all actions for logged in users"
on developments for all
to authenticated
using (true)
with check (true);

create policy "Allow public read access"
on developments for select
to public
using (status_commercial = 'published' or status_commercial = 'campaign');

create policy "Allow all actions for logged in users"
on units for all
to authenticated
using (true)
with check (true);

create policy "Allow public read access"
on units for select
to public
using (status = 'available');

create policy "Allow all actions for logged in users"
on developers for all
to authenticated
using (true)
with check (true);
