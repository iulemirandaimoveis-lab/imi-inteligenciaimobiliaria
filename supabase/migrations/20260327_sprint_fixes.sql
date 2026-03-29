-- Sprint Fix: Chat cleanup + Coords + Auto-join trigger
-- Applied manually via Supabase MCP on 2026-03-27

-- 1. Delete orphaned chat_members from duplicate direct channels
-- (Already applied via execute_sql)

-- 2. Delete 37 duplicate "Iule Miranda ↔ Valderi Junior" direct channels
-- Kept only the most recent one per name pair
-- (Already applied via execute_sql)

-- 3. Bootstrap all profiles as members of ALL team channels
-- (Already applied via execute_sql)

-- 4. Fill missing coordinates for 4 developments
UPDATE developments SET lat = -8.1195, lng = -34.9014 WHERE id = '4d117144-629c-489d-96f0-3054ffef5403' AND lat IS NULL;
UPDATE developments SET lat = -8.1230, lng = -34.8985 WHERE id = 'eadfd496-e110-4f1b-80ba-a19e2f0b85d9' AND lat IS NULL;
UPDATE developments SET lat = -8.1180, lng = -34.9000 WHERE id = '3085d37f-d56b-493f-a6b3-26fa5bc9854d' AND lat IS NULL;
UPDATE developments SET lat = -8.1710, lng = -34.9185 WHERE id = '9bd311f1-a692-4d2e-af94-852df5ba064e' AND lat IS NULL;

-- 5. Auto-join trigger: new profiles automatically become members of all team channels
CREATE OR REPLACE FUNCTION auto_join_team_channels()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_members (channel_id, user_id, role)
  SELECT cc.id, NEW.id, 'member'
  FROM chat_channels cc
  WHERE cc.type = 'team'
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_join_team_channels ON profiles;
CREATE TRIGGER trg_auto_join_team_channels
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_team_channels();
