-- Create book_reactions table
CREATE TABLE IF NOT EXISTS book_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'star', 'fire', 'clap', 'rocket')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_id, user_id, reaction_type) -- Allow multiple diff reactions but one of each type per user
);

-- Index for faster counting
CREATE INDEX IF NOT EXISTS idx_book_reactions_book_id ON book_reactions(book_id);

-- API for fetching reactions (Optional if we use direct select)
-- We can use standard Supabase select with count
