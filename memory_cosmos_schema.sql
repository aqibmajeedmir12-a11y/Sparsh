-- =========================================
-- SPARSH MEMORY COSMOS SCHEMA
-- Run this in your Supabase SQL Editor
-- =========================================

CREATE TABLE IF NOT EXISTS memory_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    strength FLOAT NOT NULL DEFAULT 1.0,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    position_z FLOAT NOT NULL,
    last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE memory_nodes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own memory nodes" ON memory_nodes 
    FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE memory_nodes;

-- Optional: Insert dummy data for a demo user (replace with actual user ID later or run via frontend)
-- INSERT INTO memory_nodes (user_id, label, category, strength, position_x, position_y, position_z) VALUES 
-- ('YOUR-USER-ID-HERE', 'Hello', 'Greetings', 0.9, 0, 0, 0),
-- ('YOUR-USER-ID-HERE', 'Thank You', 'Greetings', 0.8, 2, 1, -1);
