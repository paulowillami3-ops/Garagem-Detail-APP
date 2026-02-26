-- 1. Tables
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0
);

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

CREATE TABLE appointment_services (
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    price_at_booking DECIMAL(10, 2),
    PRIMARY KEY (appointment_id, service_id)
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    sender_type VARCHAR(20) CHECK (sender_type IN ('CUSTOMER', 'BARBER', 'SYSTEM')) NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blocked_slots (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE work_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL UNIQUE,
    is_open BOOLEAN DEFAULT TRUE,
    is_morning_open BOOLEAN DEFAULT TRUE,
    is_afternoon_open BOOLEAN DEFAULT TRUE,
    start_time_1 TIME,
    end_time_1 TIME,
    start_time_2 TIME,
    end_time_2 TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    description TEXT,
    amount DECIMAL(10, 2),
    category VARCHAR(50),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 2. Indexes
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_chat_client ON chat_messages(client_id);

-- 3. Trigger for overlapping appointments
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE appointment_date = NEW.appointment_date
    AND appointment_time = NEW.appointment_time
    AND status != 'CANCELLED'
    AND id != COALESCE(NEW.id, -1)
  ) THEN
    RAISE EXCEPTION 'Horário indisponível (reservado).';
  END IF;

  IF EXISTS (
    SELECT 1 FROM blocked_slots
    WHERE date = NEW.appointment_date
    AND time = NEW.appointment_time
  ) THEN
      RAISE EXCEPTION 'Horário indisponível (bloqueado).';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_no_double_booking
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_overlap();

-- 4. Initial Seeding
INSERT INTO settings (key, value) VALUES ('interval_minutes', '30');

INSERT INTO work_hours (day_of_week, is_open, start_time_1, end_time_1, start_time_2, end_time_2)
VALUES 
(0, false, '09:00', '12:00', '13:00', '19:00'),
(1, true,  '09:00', '12:00', '13:00', '19:00'),
(2, true,  '09:00', '12:00', '13:00', '19:00'),
(3, true,  '09:00', '12:00', '13:00', '19:00'),
(4, true,  '09:00', '12:00', '13:00', '19:00'),
(5, true,  '09:00', '12:00', '13:00', '19:00'),
(6, true,  '09:00', '12:00', '13:00', '18:00');

INSERT INTO services (name, description, price, duration, image_url, display_order)
VALUES 
('Corte de Cabelo', 'Tesoura ou máquina, com acabamento perfeito na navalha.', 20.0, 30, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD4RptFvymJZDEkLZfMwqmhcd_4f7zkFYVMIa7qEGmfvAoMtQimIv7hrUEV2OEnVBlB9HQTs8M0h8XYaxvMg2u5xa3tV8QmAmuMHwS0iuJsSN3vs-kspcMGI3AV5vKVvy6Ung0cWriRLz4lBHj-XcCL3zh0fIzRcRCZZ2q9kBzYfy5y5R7gm2bV94C2KuW45zOrmYTOW2-2HddWogTJsONXGSe3X8e5hQkvR8yNxDTinFszQCQzZP8OgKBcNnjBNXw7uNJXcAyP-PT', 1),
('Barba Completa', 'Modelagem, toalha quente e massagem facial relaxante.', 15.0, 20, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZxLjMFWK0xxuFeG-K_vmcs7YFlRon3BIo4GORMtB1FNOTw63z5yInatq8sENF5RPOVF1-e-unnFABYWrahvx_ldhuD9HIasezPJUlZ6DIZWZ2otfJR6R7UoqoejIxiyjoLpKteLWUyamkN7DnWQ4W45YzaFLNb89odMgkHQi96VNQExFoPnO3iN2YGwLimRCI_kDgYyhqd41d-PBgkKisP8cdcMVnQ30QU_KjBByqqZVX7r8RSA4OE7y97Ypso8CbxEECx3kgMQ9R', 2),
('Pezinho', 'Acabamento do contorno do cabelo.', 10.0, 10, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvYByM6ju2CjbwNDRm9RmCAHKYgF0kZLDCxyiDUJv3Q3PpL884sG9ZTSyCUXuexr-MwvArU8zSvMnwlcRMdE7DsvrJ5mA-Pw2CQJQvxofrvuA7c1X2L5wVHVFV0zZ47_Qey3ylP01VDSxTCT6Du7-gwW1f6iOVzM5EO8ufqcX9aI3b3gyFXpdDjSnOUGVkLgYjLOwodqskOtoRtUzGSSEHQmLTkP04GzdGonGWAkeQJNyZiAJUe59AjVEYvAvk-14f6WWnxyu2LyPl', 3),
('Sobrancelha', 'Design e limpeza dos contornos com navalha.', 10.0, 10, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvYByM6ju2CjbwNDRm9RmCAHKYgF0kZLDCxyiDUJv3Q3PpL884sG9ZTSyCUXuexr-MwvArU8zSvMnwlcRMdE7DsvrJ5mA-Pw2CQJQvxofrvuA7c1X2L5wVHVFV0zZ47_Qey3ylP01VDSxTCT6Du7-gwW1f6iOVzM5EO8ufqcX9aI3b3gyFXpdDjSnOUGVkLgYjLOwodqskOtoRtUzGSSEHQmLTkP04GzdGonGWAkeQJNyZiAJUe59AjVEYvAvk-14f6WWnxyu2LyPl', 4),
('Hidratação', 'Tratamento profundo para cabelos.', 30.0, 20, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsJ9fLPDPYlVIXr3ibJLRRdxEf6FA1fq_4H9sNT3VFLx3OKqPIMwMVDt8GS6V5bCvwmkrOJD2FtlFb7ieFs_4mOyQ4iPgPzfWgo-mvW_0LTb2eqeMNTkES7koFP0epzr0FTypKeZ54izOshgN5F73LQ8eCi0Uu0h1p48L_dEQCkCK90_Q1TF6iI5JJWdB5RwEMFNGYPUnwHxNxq5Toi85j-FrC50daezUz1mvfweQ2SifaKxEyF-wJXqhJhwwtYr30oaCWg_XGO1Mf', 5),
('Cabelo / Barba / Sobrancelha', 'Pacote completo para visual renovado.', 35.0, 60, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsJ9fLPDPYlVIXr3ibJLRRdxEf6FA1fq_4H9sNT3VFLx3OKqPIMwMVDt8GS6V5bCvwmkrOJD2FtlFb7ieFs_4mOyQ4iPgPzfWgo-mvW_0LTb2eqeMNTkES7koFP0epzr0FTypKeZ54izOshgN5F73LQ8eCi0Uu0h1p48L_dEQCkCK90_Q1TF6iI5JJWdB5RwEMFNGYPUnwHxNxq5Toi85j-FrC50daezUz1mvfweQ2SifaKxEyF-wJXqhJhwwtYr30oaCWg_XGO1Mf', 6);

INSERT INTO admins (email, password) VALUES ('admin@garagemdetail.com', 'admin123');
