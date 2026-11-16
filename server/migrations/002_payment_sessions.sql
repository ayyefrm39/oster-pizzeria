CREATE TABLE checkout_sessions (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id));
INSERT INTO checkout_sessions SELECT session_id,order_id FROM payments WHERE session_id IS NOT NULL;
CREATE INDEX checkout_sessions_order_idx ON checkout_sessions(order_id);
