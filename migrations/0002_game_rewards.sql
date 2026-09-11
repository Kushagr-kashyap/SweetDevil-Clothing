-- Discounts won in "Devil's Aim".
--
-- The game runs in the customer's browser, so nothing it reports can be
-- trusted. This table is what makes a reward real: the browser posts a SCORE,
-- the server converts that score to a percentage using its own tier table and
-- writes the row, and checkout only ever reads the percentage from here. A
-- hand-edited "I won 20%" in the request body has nowhere to land.
--
-- A code is a bearer token — whoever holds it can spend it once. That is
-- deliberate and the percentages are set at a level the business is happy to
-- give any visitor, so a shared code costs a discount, never the store.

CREATE TABLE IF NOT EXISTS game_rewards (
  code          TEXT PRIMARY KEY,          -- e.g. DEVIL-7K2M, shown to the player
  created_at    TEXT NOT NULL,             -- ISO-8601 UTC
  expires_at    TEXT NOT NULL,             -- ISO-8601 UTC; short, to create urgency

  pct           INTEGER NOT NULL,          -- 10 | 15 | 20, decided server-side
  hits          INTEGER NOT NULL,          -- the score it was earned with, for tuning

  -- NULL until the payment for `order_id` actually succeeds. Set at payment,
  -- never at order creation: an abandoned checkout must not burn the code.
  used_at       TEXT,
  order_id      TEXT,

  -- Coarse origin, for spotting a script minting thousands of rows. Not
  -- identity — it is never shown, joined on, or used to price anything.
  ip            TEXT
);

-- Sweeping expired, unclaimed rewards.
CREATE INDEX IF NOT EXISTS idx_game_rewards_expires ON game_rewards (expires_at);

-- The flood guard counts recent rows for one origin.
CREATE INDEX IF NOT EXISTS idx_game_rewards_ip_created ON game_rewards (ip, created_at);

-- ── orders ───────────────────────────────────────────────────────────────
-- `amount_paise` stays the amount actually charged, so nothing that reads it
-- today needs to change. These two record how it got there.
--
-- SQLite ALTER TABLE ADD COLUMN cannot be re-run, and D1 tracks which
-- migrations have been applied, so these are correct exactly once.
ALTER TABLE orders ADD COLUMN reward_code TEXT;
ALTER TABLE orders ADD COLUMN discount_paise INTEGER NOT NULL DEFAULT 0;
