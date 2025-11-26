DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    photo_url TEXT,
    telp TEXT,
    balance NUMERIC(12,2) DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_id BIGINT NOT NULL,
    to_id BIGINT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_transaction_from
        FOREIGN KEY (from_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transaction_to
        FOREIGN KEY (to_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
CREATE INDEX idx_from_id_transactions ON transactions (from_id);
CREATE INDEX idx_to_id_transactions ON transactions (to_id);

CREATE TABLE otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telp BIGINT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);