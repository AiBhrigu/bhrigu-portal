BEGIN;

CREATE TABLE IF NOT EXISTS btc_observability_events (
  event_id UUID PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'BTC_CHAT_OPENED','BTC_CHAT_QUESTION_SENT','BTC_CHAT_ANSWER_COMPLETED','BTC_CHAT_ANSWER_FAILED',
    'BTC_SUPPORT_GLYPH_CLICKED','BTC_SUPPORT_PAGE_REACHED','BTC_SUPPORT_SESSION_STARTED','BTC_SUPPORT_RECEIPT_OBSERVED'
  )),
  anon_browser_key TEXT NOT NULL CHECK (anon_browser_key ~ '^[a-f0-9]{64}$'),
  visit_session_id TEXT NOT NULL CHECK (visit_session_id ~ '^[A-Za-z0-9_-]{8,96}$'),
  locale TEXT NOT NULL CHECK (locale IN ('ru','en')),
  surface TEXT NOT NULL CHECK (surface IN ('btc_clean_chat','btc_support')),
  chat_turn_id TEXT NULL CHECK (chat_turn_id IS NULL OR chat_turn_id ~ '^[A-Za-z0-9_-]{8,96}$'),
  donation_session_id TEXT NULL CHECK (donation_session_id IS NULL OR donation_session_id ~ '^[A-Za-z0-9_-]{8,96}$'),
  model TEXT NULL CHECK (model IS NULL OR length(model) <= 80),
  input_tokens BIGINT NULL CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens BIGINT NULL CHECK (output_tokens IS NULL OR output_tokens >= 0),
  web_search_calls INTEGER NULL CHECK (web_search_calls IS NULL OR web_search_calls >= 0),
  nominal_cost_micros BIGINT NULL CHECK (nominal_cost_micros IS NULL OR nominal_cost_micros >= 0),
  price_policy TEXT NULL CHECK (price_policy IS NULL OR length(price_policy) <= 96),
  completion_status TEXT NULL CHECK (completion_status IS NULL OR completion_status IN ('completed','failed')),
  error_class TEXT NULL CHECK (error_class IS NULL OR error_class ~ '^[a-z0-9_-]{1,64}$'),
  traffic_source TEXT NOT NULL CHECK (traffic_source IN ('direct','bitcointalk','x','telegram','other')),
  traffic_medium TEXT NOT NULL CHECK (traffic_medium IN ('direct','forum','social','profile','post','other')),
  traffic_campaign TEXT NULL CHECK (traffic_campaign IS NULL OR traffic_campaign ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((event_type IN ('BTC_CHAT_QUESTION_SENT','BTC_CHAT_ANSWER_COMPLETED','BTC_CHAT_ANSWER_FAILED')) = (chat_turn_id IS NOT NULL)),
  CHECK ((event_type IN ('BTC_SUPPORT_SESSION_STARTED','BTC_SUPPORT_RECEIPT_OBSERVED')) = (donation_session_id IS NOT NULL)),
  CHECK (
    (event_type = 'BTC_CHAT_ANSWER_COMPLETED' AND completion_status='completed' AND model IS NOT NULL AND input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND web_search_calls IS NOT NULL AND nominal_cost_micros IS NOT NULL AND price_policy IS NOT NULL AND error_class IS NULL)
    OR (event_type = 'BTC_CHAT_ANSWER_FAILED' AND completion_status='failed' AND error_class IS NOT NULL AND model IS NULL AND input_tokens IS NULL AND output_tokens IS NULL AND web_search_calls IS NULL AND nominal_cost_micros IS NULL AND price_policy IS NULL)
    OR (event_type NOT IN ('BTC_CHAT_ANSWER_COMPLETED','BTC_CHAT_ANSWER_FAILED') AND completion_status IS NULL AND model IS NULL AND input_tokens IS NULL AND output_tokens IS NULL AND web_search_calls IS NULL AND nominal_cost_micros IS NULL AND price_policy IS NULL AND error_class IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS btc_observability_events_time_idx ON btc_observability_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS btc_observability_events_browser_time_idx ON btc_observability_events(anon_browser_key,occurred_at DESC);
CREATE INDEX IF NOT EXISTS btc_observability_events_visit_time_idx ON btc_observability_events(visit_session_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS btc_observability_events_source_time_idx ON btc_observability_events(traffic_source,occurred_at DESC);
CREATE INDEX IF NOT EXISTS btc_observability_events_expiry_idx ON btc_observability_events(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS btc_observability_chat_turn_event_unique_idx
  ON btc_observability_events(event_type,visit_session_id,chat_turn_id) WHERE chat_turn_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS btc_observability_support_session_event_unique_idx
  ON btc_observability_events(event_type,donation_session_id) WHERE donation_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS btc_observability_visit_once_event_unique_idx
  ON btc_observability_events(event_type,visit_session_id)
  WHERE event_type IN ('BTC_CHAT_OPENED','BTC_SUPPORT_GLYPH_CLICKED','BTC_SUPPORT_PAGE_REACHED');

COMMIT;
