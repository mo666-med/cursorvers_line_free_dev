-- Create article_posts table for tracking article URL posts to Discord
CREATE TABLE IF NOT EXISTS article_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_url TEXT NOT NULL,
  article_title TEXT,
  article_description TEXT,
  article_image_url TEXT,
  summary TEXT,
  discord_message_id TEXT,
  discord_channel_id TEXT NOT NULL,
  posted_by TEXT NOT NULL, -- Discord user ID
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_article_posts_url ON article_posts(article_url);
CREATE INDEX IF NOT EXISTS idx_article_posts_status ON article_posts(status);
CREATE INDEX IF NOT EXISTS idx_article_posts_created_at ON article_posts(created_at DESC);

-- Enable RLS
ALTER TABLE article_posts ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (bot can do everything)
CREATE POLICY "Service role has full access to article_posts"
  ON article_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE article_posts IS 'Stores article URL posts made to Discord channels';
