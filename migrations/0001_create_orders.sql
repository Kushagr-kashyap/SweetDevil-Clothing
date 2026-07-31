-- Order records for Sweet Devil.
--
-- Money is stored in PAISE as INTEGER, never as a decimal. SQLite REAL is a
-- float, and floats silently turn ₹1,299.00 into ₹1,298.9999999. Every amount
-- column here is whole paise.
--
-- `razorpay_payment_id` is UNIQUE on purpose: it is what makes the verify
-- endpoint idempotent. If a customer double-taps, or Razorpay retries a
-- webhook, the second insert collides instead of creating a duplicate order.

CREATE TABLE IF NOT EXISTS orders (
  id                   TEXT PRIMARY KEY,          -- our own order number, e.g. SD-8F3K2Q
  created_at           TEXT NOT NULL,             -- ISO-8601 UTC

  -- payment
  razorpay_order_id    TEXT NOT NULL,
  razorpay_payment_id  TEXT UNIQUE,               -- NULL until payment succeeds
  status               TEXT NOT NULL,             -- pending | paid | failed
  amount_paise         INTEGER NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'INR',
  test_mode            INTEGER NOT NULL DEFAULT 0, -- 1 when placed with rzp_test_ keys

  -- customer
  customer_name        TEXT NOT NULL,
  customer_email       TEXT NOT NULL,
  customer_phone       TEXT NOT NULL,
  address_line         TEXT NOT NULL,
  city                 TEXT NOT NULL,
  state                TEXT NOT NULL,
  pincode              TEXT NOT NULL,

  -- what was bought: JSON array of priced lines, exactly as the server priced
  -- them. Snapshotted rather than referenced, so a later price change never
  -- rewrites the history of an order already placed.
  items_json           TEXT NOT NULL,

  notes                TEXT
);

-- The admin page lists newest first; without this it's a full scan.
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- Reconciling against the Razorpay dashboard means looking up by their id.
CREATE INDEX IF NOT EXISTS idx_orders_rzp_order ON orders (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
