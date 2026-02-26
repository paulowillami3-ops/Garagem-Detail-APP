-- Database Schema for Garagem Detail
-- Designed for PostgreSQL/MySQL compatibility

-- 1. Clients Table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Services Table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL, -- Duration in minutes
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Appointments Table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Appointment_Services Table (Many-to-Many)
CREATE TABLE appointment_services (
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    price_at_booking DECIMAL(10, 2), -- Records price at time of booking
    PRIMARY KEY (appointment_id, service_id)
);

-- 5. Chat_Messages Table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id), -- Nullable if message is from anon/system before registration, or system messages
    sender_type VARCHAR(20) CHECK (sender_type IN ('CUSTOMER', 'BARBER', 'SYSTEM')) NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_chat_client ON chat_messages(client_id);
