-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, book_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
