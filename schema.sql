-- Asador Callejero - D1 Database Schema

-- Menu table
CREATE TABLE IF NOT EXISTS menu (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Sales Active table
CREATE TABLE IF NOT EXISTS sales_active (
    id TEXT PRIMARY KEY,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    delivery_fee REAL DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- Sales Closed table
CREATE TABLE IF NOT EXISTS sales_closed (
    id TEXT PRIMARY KEY,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    delivery_fee REAL DEFAULT 0,
    payment_method TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    closed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_closed_date ON sales_closed(closed_at);
CREATE INDEX IF NOT EXISTS idx_sales_closed_payment ON sales_closed(payment_method);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Config table
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Insert default config
INSERT OR IGNORE INTO config (key, value, updated_at) VALUES
    ('version', '"1.0"', strftime('%s', 'now')),
    ('appName', '"Asador Callejero Catorce"', strftime('%s', 'now')),
    ('currency', '"MXN"', strftime('%s', 'now'));
