-- BedLink Emergency Care & Bed Network SQL Database Schema
-- Multi-facility Western Railway emergency triage and bed allocation schema

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  station TEXT NOT NULL,
  station_distance_km REAL NOT NULL,
  station_distance_text TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_famous INTEGER DEFAULT 0,
  current_load_percentage INTEGER DEFAULT 60,
  last_updated_minutes_ago INTEGER DEFAULT 2,
  ayushman_bharat INTEGER DEFAULT 1,
  mjpjay INTEGER DEFAULT 1,
  cashless_insurance INTEGER DEFAULT 1,
  icu_available INTEGER NOT NULL DEFAULT 5,
  icu_total INTEGER NOT NULL DEFAULT 20,
  ventilator_available INTEGER NOT NULL DEFAULT 3,
  ventilator_total INTEGER NOT NULL DEFAULT 10,
  oxygen_available INTEGER NOT NULL DEFAULT 10,
  oxygen_total INTEGER NOT NULL DEFAULT 30,
  trauma_available INTEGER NOT NULL DEFAULT 2,
  trauma_total INTEGER NOT NULL DEFAULT 6,
  burns_available INTEGER NOT NULL DEFAULT 1,
  burns_total INTEGER NOT NULL DEFAULT 4,
  regular_available INTEGER NOT NULL DEFAULT 15,
  regular_total INTEGER NOT NULL DEFAULT 35,
  blood_o_pos INTEGER NOT NULL DEFAULT 10,
  blood_o_neg INTEGER NOT NULL DEFAULT 4,
  blood_a_pos INTEGER NOT NULL DEFAULT 12,
  blood_a_neg INTEGER NOT NULL DEFAULT 5,
  blood_b_pos INTEGER NOT NULL DEFAULT 15,
  blood_b_neg INTEGER NOT NULL DEFAULT 4,
  blood_ab_pos INTEGER NOT NULL DEFAULT 6,
  blood_ab_neg INTEGER NOT NULL DEFAULT 2,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  department TEXT NOT NULL,
  qualification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  phone TEXT NOT NULL,
  last_seen TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ambulances (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ALS',
  status TEXT NOT NULL DEFAULT 'available',
  current_location TEXT NOT NULL,
  eta_minutes INTEGER DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emergency_requests (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL DEFAULT 30,
  patient_gender TEXT NOT NULL DEFAULT 'Female',
  relative_name TEXT,
  relative_phone TEXT,
  contact_phone TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'patient',
  station TEXT NOT NULL,
  location_address TEXT NOT NULL,
  patient_blood_type TEXT NOT NULL,
  injury_type TEXT NOT NULL,
  specialist_required TEXT NOT NULL,
  specialist_booked INTEGER DEFAULT 0,
  hospital_id TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  bed_type TEXT NOT NULL,
  allocated_bed_number TEXT,
  need_ambulance TEXT NOT NULL DEFAULT 'yes_hospital',
  ambulance_vehicle_number TEXT,
  ambulance_driver_name TEXT,
  ambulance_driver_phone TEXT,
  ambulance_stage TEXT,
  ambulance_location_text TEXT,
  ambulance_eta_minutes INTEGER,
  ambulance_with_oxygen INTEGER DEFAULT 1,
  sla_remaining_seconds INTEGER DEFAULT 120,
  sla_status TEXT NOT NULL DEFAULT 'pending_response',
  fallback_hospital_suggested TEXT,
  blood_required INTEGER DEFAULT 1,
  blood_units_needed INTEGER DEFAULT 2,
  blood_group TEXT DEFAULT 'O+',
  blood_status TEXT DEFAULT 'reserved',
  blood_notes TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  doctor_specialty TEXT,
  doctor_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  time_text TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES emergency_requests(id) ON DELETE CASCADE
);

-- User Login Audit Log Table (Tracks who logged in and when)
CREATE TABLE IF NOT EXISTS user_login_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  hospital_id TEXT,
  hospital_name TEXT,
  station TEXT,
  login_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  ip_address TEXT DEFAULT '127.0.0.1',
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Patient Lifecycle Registry (Intake/login, confirmed hospital, bed, and discharge)
CREATE TABLE IF NOT EXISTS patient_records (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL DEFAULT 30,
  patient_gender TEXT NOT NULL DEFAULT 'Female',
  contact_phone TEXT NOT NULL,
  relative_name TEXT,
  relative_phone TEXT,
  blood_group TEXT NOT NULL,
  injury_type TEXT NOT NULL,
  condition_severity TEXT NOT NULL DEFAULT 'critical',
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_hospital_id TEXT,
  confirmed_hospital_name TEXT,
  confirmed_bed_type TEXT,
  confirmed_bed_number TEXT,
  confirmation_time DATETIME,
  admission_status TEXT NOT NULL DEFAULT 'confirmed_admitted',
  discharge_time DATETIME,
  discharge_summary TEXT,
  attending_doctor TEXT,
  ambulance_vehicle_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-velocity queries
CREATE INDEX IF NOT EXISTS idx_hospitals_station ON hospitals(station);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_hospital ON ambulances(hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_hospital ON emergency_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON emergency_requests(sla_status);
CREATE INDEX IF NOT EXISTS idx_user_logs_role ON user_login_logs(role);
CREATE INDEX IF NOT EXISTS idx_user_logs_timestamp ON user_login_logs(login_timestamp);
CREATE INDEX IF NOT EXISTS idx_patient_records_status ON patient_records(admission_status);
CREATE INDEX IF NOT EXISTS idx_patient_records_hospital ON patient_records(confirmed_hospital_id);
