import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Hospital,
  Doctor,
  Ambulance,
  EmergencyRequest,
  BloodGroup,
  UserLoginLog,
  PatientRecord,
  AmbulanceDispatchRecord,
} from '../types.ts';
import { INITIAL_WESTERN_HOSPITALS } from '../data/westernLineHospitals.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../bedlink.sqlite');
const SCHEMA_PATH = path.resolve(__dirname, './schema.sql');

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// Helper to save current database state to disk
export function persistDatabase(): void {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

// Convert SQL query result array of objects
function resultToObjects(result: any[]): any[] {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, idx: number) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Initialize database with schema and initial seed data
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing BedLink SQL database from:', DB_PATH);
      // Ensure user_login_logs and patient_records tables exist and are seeded
      seedUserLogsAndPatients(db);
      persistDatabase();
      return db;
    } catch (err) {
      console.warn('Could not read existing database file, recreating:', err);
    }
  }

  // Create new database from schema.sql
  db = new SQL.Database();
  console.log('Initializing fresh BedLink SQL database from schema.sql...');

  let schemaSql = '';
  if (fs.existsSync(SCHEMA_PATH)) {
    schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  } else {
    throw new Error('schema.sql file not found at: ' + SCHEMA_PATH);
  }

  db.run(schemaSql);

  // Seed initial hospitals, doctors, and ambulances from INITIAL_WESTERN_HOSPITALS
  seedInitialData(db);
  seedUserLogsAndPatients(db);

  persistDatabase();
  return db;
}

function seedInitialData(database: Database): void {
  console.log(`Seeding ${INITIAL_WESTERN_HOSPITALS.length} Western Line hospitals into SQL database...`);

  for (const hosp of INITIAL_WESTERN_HOSPITALS) {
    database.run(
      `INSERT INTO hospitals (
        id, name, station, station_distance_km, station_distance_text, area, address, phone,
        is_famous, current_load_percentage, last_updated_minutes_ago,
        ayushman_bharat, mjpjay, cashless_insurance,
        icu_available, icu_total, ventilator_available, ventilator_total,
        oxygen_available, oxygen_total, trauma_available, trauma_total,
        burns_available, burns_total, regular_available, regular_total,
        blood_o_pos, blood_o_neg, blood_a_pos, blood_a_neg, blood_b_pos, blood_b_neg, blood_ab_pos, blood_ab_neg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hosp.id,
        hosp.name,
        hosp.station,
        hosp.stationDistanceKm,
        hosp.stationDistanceText,
        hosp.area,
        hosp.address,
        hosp.phone,
        hosp.isFamous ? 1 : 0,
        hosp.currentLoadPercentage || 65,
        hosp.lastUpdatedMinutesAgo || 2,
        hosp.schemes?.ayushmanBharat ? 1 : 0,
        hosp.schemes?.mjpjay ? 1 : 0,
        hosp.schemes?.cashlessInsurance ? 1 : 0,
        hosp.beds.icuAvailable,
        hosp.beds.icuTotal,
        hosp.beds.ventilatorAvailable,
        hosp.beds.ventilatorTotal,
        hosp.beds.oxygenAvailable,
        hosp.beds.oxygenTotal,
        hosp.beds.traumaAvailable,
        hosp.beds.traumaTotal,
        hosp.beds.burnsAvailable,
        hosp.beds.burnsTotal,
        hosp.beds.regularAvailable,
        hosp.beds.regularTotal,
        hosp.bloodBank['O+'] || 10,
        hosp.bloodBank['O-'] || 4,
        hosp.bloodBank['A+'] || 12,
        hosp.bloodBank['A-'] || 5,
        hosp.bloodBank['B+'] || 15,
        hosp.bloodBank['B-'] || 4,
        hosp.bloodBank['AB+'] || 6,
        hosp.bloodBank['AB-'] || 2,
      ]
    );

    // Doctors
    if (hosp.doctors && hosp.doctors.length > 0) {
      for (const doc of hosp.doctors) {
        database.run(
          `INSERT INTO doctors (id, hospital_id, name, specialty, department, qualification, status, phone, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            doc.id,
            hosp.id,
            doc.name,
            doc.specialty,
            doc.department,
            doc.qualification,
            doc.status,
            doc.phone,
            doc.lastSeen || 'In Emergency Ward',
          ]
        );
      }
    }

    // Ambulances
    if (hosp.ambulances && hosp.ambulances.length > 0) {
      for (const amb of hosp.ambulances) {
        database.run(
          `INSERT INTO ambulances (id, hospital_id, vehicle_number, driver_name, driver_phone, type, status, current_location, eta_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            amb.id,
            hosp.id,
            amb.vehicleNumber,
            amb.driverName,
            amb.driverPhone,
            amb.type,
            amb.status,
            amb.currentLocation,
            amb.etaMinutes || 5,
          ]
        );
      }
    }
  }

  // Seed Swara Patil initial emergency request
  database.run(
    `INSERT INTO emergency_requests (
      id, patient_name, patient_age, patient_gender, relative_name, relative_phone, contact_phone,
      user_role, station, location_address, patient_blood_type, injury_type, specialist_required,
      specialist_booked, hospital_id, hospital_name, bed_type, allocated_bed_number, need_ambulance,
      ambulance_vehicle_number, ambulance_driver_name, ambulance_driver_phone, ambulance_stage,
      ambulance_location_text, ambulance_eta_minutes, ambulance_with_oxygen, sla_remaining_seconds,
      sla_status, blood_required, blood_units_needed, blood_group, blood_status, blood_notes,
      doctor_id, doctor_name, doctor_specialty, doctor_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-12 minutes'), datetime('now'))`,
    [
      'REQ-7H-8821',
      'Swara Patil',
      26,
      'Female',
      'Swara Patil',
      '+91 98201 54321',
      '+91 98201 54321',
      'patient',
      'Andheri',
      'Western Express Highway, near Hub Flyover, Andheri / Goregaon East',
      'O+',
      'blood_loss',
      'Vascular & Trauma Surgeon (Emergency Bleed)',
      1,
      'seven-hills',
      'Seven Hills Hospital',
      'trauma',
      'Trauma Resuscitation Bay #02',
      'yes_hospital',
      'MH-02-ER-9192',
      'Ramesh Sawant',
      '+91 98700 11223',
      'en_route_pickup',
      'WEH Metro Flyover, 1.2 km away from patient',
      4,
      1,
      78,
      'accepted_held',
      1,
      2,
      'O+',
      'reserved',
      'Seven Hills Blood Bank reserved 2 units O+ PRBC in trauma bay cooler.',
      'doc-7h-2',
      'Dr. Anita Deshmukh',
      'Vascular & Trauma Surgeon',
      'accepted',
    ]
  );

  // Timeline for Swara's request
  const timelineEvents = [
    { time: '12 mins ago', title: 'Bed Hold Request Initiated', desc: 'Patient Swara Patil held Trauma Bay at Seven Hills Hospital.', role: 'Swara (Patient)' },
    { time: '10 mins ago', title: 'Seven Hills Nurse Accepted (2-Min SLA)', desc: 'Sister Sneha locked Trauma Bay #02 for 120s window.', role: 'Sister Sneha (Seven Hills Nurse Desk)' },
    { time: '8 mins ago', title: 'Hospital Blood Alert: 2 Units O+ Reserved', desc: 'Seven Hills Blood Bank tagged cross-match for rapid transfusion.', role: 'Blood Bank Officer' },
    { time: '5 mins ago', title: 'Ambulance Deployed: MH-02-ER-9192 (With Oxygen)', desc: 'Driver Ramesh Sawant en route with oxygen cylinder & trauma kit.', role: 'Seven Hills Emergency Dispatch' },
  ];

  for (const ev of timelineEvents) {
    database.run(
      `INSERT INTO request_timeline (request_id, time_text, title, description, role) VALUES (?, ?, ?, ?, ?)`,
      ['REQ-7H-8821', ev.time, ev.title, ev.desc, ev.role]
    );
  }
}

function seedUserLogsAndPatients(database: Database): void {
  // Ensure tables and indexes exist
  database.run(`
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

    CREATE INDEX IF NOT EXISTS idx_user_logs_role ON user_login_logs(role);
    CREATE INDEX IF NOT EXISTS idx_user_logs_timestamp ON user_login_logs(login_timestamp);
    CREATE INDEX IF NOT EXISTS idx_patient_records_status ON patient_records(admission_status);
    CREATE INDEX IF NOT EXISTS idx_patient_records_hospital ON patient_records(confirmed_hospital_id);
  `);

  // Seed user_login_logs if empty
  try {
    const userCount = resultToObjects(database.exec('SELECT COUNT(*) as count FROM user_login_logs'));
    if (!userCount[0] || Number(userCount[0].count) === 0) {
      console.log('Seeding initial user login audit records into SQL database...');
      const initialLogs = [
        {
          id: 'LOG-7H-101',
          userName: 'Sister Sneha Kadam',
          phone: '+91 22 6767 6767',
          role: 'nurse',
          hospitalId: 'seven-hills',
          hospitalName: 'Seven Hills Hospital',
          station: 'Andheri',
          timeExpr: "datetime('now', '-28 minutes')",
          status: 'active',
        },
        {
          id: 'LOG-PAT-202',
          userName: 'Swara Patil (Relative: Aarti Patil)',
          phone: '+91 98201 54321',
          role: 'patient_relative',
          hospitalId: null,
          hospitalName: null,
          station: 'Andheri',
          timeExpr: "datetime('now', '-22 minutes')",
          status: 'active',
        },
        {
          id: 'LOG-AMB-303',
          userName: 'Ramesh Sawant (Pilot MH-02-ER-9192)',
          phone: '+91 98700 11223',
          role: 'ambulance_crew',
          hospitalId: 'seven-hills',
          hospitalName: 'Seven Hills Hospital Dispatch',
          station: 'Andheri',
          timeExpr: "datetime('now', '-18 minutes')",
          status: 'active',
        },
        {
          id: 'LOG-DOC-404',
          userName: 'Dr. Anita Deshmukh',
          phone: '+91 98200 44556',
          role: 'doctor',
          hospitalId: 'seven-hills',
          hospitalName: 'Seven Hills Hospital',
          station: 'Andheri',
          timeExpr: "datetime('now', '-15 minutes')",
          status: 'active',
        },
        {
          id: 'LOG-ADM-505',
          userName: 'Administrator (ADM-OPS-01)',
          phone: '+91 22 2262 0108',
          role: 'admin',
          hospitalId: null,
          hospitalName: 'Central HealthTech Operations',
          station: 'Churchgate',
          timeExpr: "datetime('now', '-8 minutes')",
          status: 'active',
        },
      ];

      for (const log of initialLogs) {
        database.run(
          `INSERT INTO user_login_logs (id, user_name, phone, role, hospital_id, hospital_name, station, login_timestamp, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ${log.timeExpr}, ?)`,
          [log.id, log.userName, log.phone, log.role, log.hospitalId, log.hospitalName, log.station, log.status]
        );
      }
    }
  } catch (err) {
    console.warn('Could not seed user_login_logs:', err);
  }

  // Seed patient_records if empty
  try {
    const patCount = resultToObjects(database.exec('SELECT COUNT(*) as count FROM patient_records'));
    if (!patCount[0] || Number(patCount[0].count) === 0) {
      console.log('Seeding initial patient admission & discharge records into SQL database...');
      const initialPatients = [
        {
          id: 'PAT-7H-8821',
          patientName: 'Swara Patil',
          patientAge: 26,
          patientGender: 'Female',
          contactPhone: '+91 98201 54321',
          relativeName: 'Aarti Patil',
          relativePhone: '+91 98201 54321',
          bloodGroup: 'O+',
          injuryType: 'road_accident',
          conditionSeverity: 'critical',
          loginTimeExpr: "datetime('now', '-22 minutes')",
          confirmedHospitalId: 'seven-hills',
          confirmedHospitalName: 'Seven Hills Hospital',
          confirmedBedType: 'trauma',
          confirmedBedNumber: 'Trauma Resuscitation Bay #02',
          confirmationTimeExpr: "datetime('now', '-18 minutes')",
          admissionStatus: 'confirmed_admitted',
          dischargeTimeExpr: 'NULL',
          dischargeSummary: null,
          attendingDoctor: 'Dr. Anita Deshmukh (Vascular & Trauma Surgeon)',
          ambulanceVehicleNumber: 'MH-02-ER-9192 (ALS with Oxygen)',
          notes: 'Arrived via ALS ambulance. 2 units O+ PRBC infused. Under active resuscitation in Trauma Bay #02.',
        },
        {
          id: 'PAT-KDA-7714',
          patientName: 'Rajesh Sharma',
          patientAge: 52,
          patientGender: 'Male',
          contactPhone: '+91 98190 23456',
          relativeName: 'Sunita Sharma',
          relativePhone: '+91 98190 23457',
          bloodGroup: 'B+',
          injuryType: 'cardiac',
          conditionSeverity: 'critical',
          loginTimeExpr: "datetime('now', '-26 hours')",
          confirmedHospitalId: 'kokilaben',
          confirmedHospitalName: 'Kokilaben Dhirubhai Ambani Hospital',
          confirmedBedType: 'icu',
          confirmedBedNumber: 'Cardiac ICU Bed #04',
          confirmationTimeExpr: "datetime('now', '-25 hours')",
          admissionStatus: 'discharged',
          dischargeTimeExpr: "datetime('now', '-2 hours')",
          dischargeSummary: 'Emergency PCI with drug-eluting stent to LAD successfully performed. Troponin levels normalized, vitals stable (BP 124/78, HR 72 bpm). Discharged in stable condition with dual antiplatelet therapy and 2-week cardiology review.',
          attendingDoctor: 'Dr. Sanjay Mehta (Chief Interventional Cardiologist)',
          ambulanceVehicleNumber: 'MH-02-ER-4011',
          notes: 'Patient successfully discharged home to relative care.',
        },
        {
          id: 'PAT-NAN-6602',
          patientName: 'Priya Nair',
          patientAge: 31,
          patientGender: 'Female',
          contactPhone: '+91 98330 87654',
          relativeName: 'Anand Nair',
          relativePhone: '+91 98330 87655',
          bloodGroup: 'O-',
          injuryType: 'fracture_ortho',
          conditionSeverity: 'severe',
          loginTimeExpr: "datetime('now', '-3 days')",
          confirmedHospitalId: 'nanavati',
          confirmedHospitalName: 'Nanavati Max Super Speciality Hospital',
          confirmedBedType: 'trauma',
          confirmedBedNumber: 'Trauma Bay #01',
          confirmationTimeExpr: "datetime('now', '-3 days', '+20 minutes')",
          admissionStatus: 'discharged',
          dischargeTimeExpr: "datetime('now', '-18 hours')",
          dischargeSummary: 'Compound tibia fracture reduced and closed intramedullary nailing performed. Distal pulses palpable, surgical wound dry and intact. Mobilized with walker. Discharged with analgesics, antibiotics, and physiotherapy schedule.',
          attendingDoctor: 'Dr. Vivek Joshi (Senior Orthopedic Trauma Surgeon)',
          ambulanceVehicleNumber: 'MH-02-ER-2244',
          notes: 'Post-op recovery satisfactory. Full discharge clearance granted by department head.',
        },
        {
          id: 'PAT-CPR-5590',
          patientName: 'Mohammed Ansari',
          patientAge: 64,
          patientGender: 'Male',
          contactPhone: '+91 98211 44332',
          relativeName: 'Zeeshan Ansari',
          relativePhone: '+91 98211 44333',
          bloodGroup: 'AB+',
          injuryType: 'respiratory',
          conditionSeverity: 'critical',
          loginTimeExpr: "datetime('now', '-6 hours')",
          confirmedHospitalId: 'cooper',
          confirmedHospitalName: 'Cooper Municipal Hospital',
          confirmedBedType: 'ventilator',
          confirmedBedNumber: 'Ventilator Bay #03',
          confirmationTimeExpr: "datetime('now', '-5 hours')",
          admissionStatus: 'under_treatment',
          dischargeTimeExpr: 'NULL',
          dischargeSummary: null,
          attendingDoctor: 'Dr. Pooja Salve (Critical Care Intensivist)',
          ambulanceVehicleNumber: 'MH-02-ER-5512',
          notes: 'Severe acute COPD exacerbation with type-2 respiratory failure. Mechanical ventilation maintained at 40% FiO2. ABG monitoring ongoing.',
        },
        {
          id: 'PAT-LIL-4418',
          patientName: 'Vikram Gaikwad',
          patientAge: 38,
          patientGender: 'Male',
          contactPhone: '+91 98690 99887',
          relativeName: 'Meena Gaikwad',
          relativePhone: '+91 98690 99888',
          bloodGroup: 'A+',
          injuryType: 'road_accident',
          conditionSeverity: 'moderate',
          loginTimeExpr: "datetime('now', '-1 day')",
          confirmedHospitalId: 'lilavati',
          confirmedHospitalName: 'Lilavati Hospital & Research Centre',
          confirmedBedType: 'regular',
          confirmedBedNumber: 'Surgical HDU Bed #12',
          confirmationTimeExpr: "datetime('now', '-1 day', '+15 minutes')",
          admissionStatus: 'confirmed_admitted',
          dischargeTimeExpr: 'NULL',
          dischargeSummary: null,
          attendingDoctor: 'Dr. Ashok Patil (Spine & Neuro Surgeon)',
          ambulanceVehicleNumber: 'MH-02-ER-8833',
          notes: 'Conservative management for stable lumbar transverse process fracture. Neuro exam normal. Vitals stable.',
        },
      ];

      for (const pat of initialPatients) {
        database.run(
          `INSERT INTO patient_records (
            id, patient_name, patient_age, patient_gender, contact_phone, relative_name, relative_phone,
            blood_group, injury_type, condition_severity, login_time, confirmed_hospital_id,
            confirmed_hospital_name, confirmed_bed_type, confirmed_bed_number, confirmation_time,
            admission_status, discharge_time, discharge_summary, attending_doctor, ambulance_vehicle_number, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${pat.loginTimeExpr}, ?, ?, ?, ?, ${pat.confirmationTimeExpr}, ?, ${pat.dischargeTimeExpr}, ?, ?, ?, ?)`,
          [
            pat.id,
            pat.patientName,
            pat.patientAge,
            pat.patientGender,
            pat.contactPhone,
            pat.relativeName,
            pat.relativePhone,
            pat.bloodGroup,
            pat.injuryType,
            pat.conditionSeverity,
            pat.confirmedHospitalId,
            pat.confirmedHospitalName,
            pat.confirmedBedType,
            pat.confirmedBedNumber,
            pat.admissionStatus,
            pat.dischargeSummary,
            pat.attendingDoctor,
            pat.ambulanceVehicleNumber,
            pat.notes,
          ]
        );
      }
    }
  } catch (err) {
    console.warn('Could not seed patient_records:', err);
  }
}

// DAO Methods for Application and API routes

export function getAllHospitals(): Hospital[] {
  if (!db) throw new Error('Database not initialized');
  const rows = resultToObjects(db.exec('SELECT * FROM hospitals ORDER BY station_distance_km ASC'));

  return rows.map((r) => {
    // Fetch doctors
    const docRows = resultToObjects(
      db!.exec(`SELECT * FROM doctors WHERE hospital_id = '${r.id.replace(/'/g, "''")}'`)
    );
    // Fetch ambulances
    const ambRows = resultToObjects(
      db!.exec(`SELECT * FROM ambulances WHERE hospital_id = '${r.id.replace(/'/g, "''")}'`)
    );

    const doctors: Doctor[] = docRows.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      department: d.department,
      qualification: d.qualification,
      status: d.status,
      phone: d.phone,
      lastSeen: d.last_seen,
    }));

    const ambulances: Ambulance[] = ambRows.map((a) => ({
      id: a.id,
      vehicleNumber: a.vehicle_number,
      driverName: a.driver_name,
      driverPhone: a.driver_phone,
      type: a.type,
      status: a.status,
      currentLocation: a.current_location,
      etaMinutes: a.eta_minutes,
    }));

    return {
      id: r.id,
      name: r.name,
      station: r.station,
      stationDistanceKm: Number(r.station_distance_km),
      stationDistanceText: r.station_distance_text,
      area: r.area,
      address: r.address,
      phone: r.phone,
      isFamous: Boolean(r.is_famous),
      currentLoadPercentage: Number(r.current_load_percentage),
      lastUpdatedMinutesAgo: Number(r.last_updated_minutes_ago),
      schemes: {
        ayushmanBharat: Boolean(r.ayushman_bharat),
        mjpjay: Boolean(r.mjpjay),
        cashlessInsurance: Boolean(r.cashless_insurance),
      },
      beds: {
        icuAvailable: Number(r.icu_available),
        icuTotal: Number(r.icu_total),
        ventilatorAvailable: Number(r.ventilator_available),
        ventilatorTotal: Number(r.ventilator_total),
        oxygenAvailable: Number(r.oxygen_available),
        oxygenTotal: Number(r.oxygen_total),
        traumaAvailable: Number(r.trauma_available),
        traumaTotal: Number(r.trauma_total),
        burnsAvailable: Number(r.burns_available),
        burnsTotal: Number(r.burns_total),
        regularAvailable: Number(r.regular_available),
        regularTotal: Number(r.regular_total),
      },
      bloodBank: {
        'O+': Number(r.blood_o_pos),
        'O-': Number(r.blood_o_neg),
        'A+': Number(r.blood_a_pos),
        'A-': Number(r.blood_a_neg),
        'B+': Number(r.blood_b_pos),
        'B-': Number(r.blood_b_neg),
        'AB+': Number(r.blood_ab_pos),
        'AB-': Number(r.blood_ab_neg),
      },
      doctors,
      ambulances,
    };
  });
}

export function getHospitalById(id: string): Hospital | null {
  const all = getAllHospitals();
  return all.find((h) => h.id === id) || null;
}

export function insertHospital(hosp: Partial<Hospital>): Hospital {
  if (!db) throw new Error('Database not initialized');
  const id = hosp.id || `hosp-${Date.now().toString(36)}`;
  const name = hosp.name || 'Emergency Care Center';
  const station = hosp.station || 'Andheri';
  const distanceKm = hosp.stationDistanceKm || 1.0;
  const distanceText = hosp.stationDistanceText || `${distanceKm} km from ${station} Station`;
  const area = hosp.area || `${station} East`;
  const address = hosp.address || `${area}, Mumbai`;
  const phone = hosp.phone || '+91 22 2800 0000';

  const beds = hosp.beds || {
    icuAvailable: 6,
    icuTotal: 20,
    ventilatorAvailable: 3,
    ventilatorTotal: 10,
    oxygenAvailable: 12,
    oxygenTotal: 25,
    traumaAvailable: 4,
    traumaTotal: 8,
    burnsAvailable: 2,
    burnsTotal: 5,
    regularAvailable: 20,
    regularTotal: 40,
  };

  const blood = hosp.bloodBank || {
    'O+': 10,
    'O-': 4,
    'A+': 12,
    'A-': 5,
    'B+': 14,
    'B-': 4,
    'AB+': 6,
    'AB-': 2,
  };

  db.run(
    `INSERT INTO hospitals (
      id, name, station, station_distance_km, station_distance_text, area, address, phone,
      is_famous, current_load_percentage, last_updated_minutes_ago,
      ayushman_bharat, mjpjay, cashless_insurance,
      icu_available, icu_total, ventilator_available, ventilator_total,
      oxygen_available, oxygen_total, trauma_available, trauma_total,
      burns_available, burns_total, regular_available, regular_total,
      blood_o_pos, blood_o_neg, blood_a_pos, blood_a_neg, blood_b_pos, blood_b_neg, blood_ab_pos, blood_ab_neg
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      station,
      distanceKm,
      distanceText,
      area,
      address,
      phone,
      hosp.isFamous ? 1 : 0,
      hosp.currentLoadPercentage || 50,
      1,
      hosp.schemes?.ayushmanBharat ? 1 : 1,
      hosp.schemes?.mjpjay ? 1 : 1,
      hosp.schemes?.cashlessInsurance ? 1 : 1,
      beds.icuAvailable,
      beds.icuTotal,
      beds.ventilatorAvailable,
      beds.ventilatorTotal,
      beds.oxygenAvailable,
      beds.oxygenTotal,
      beds.traumaAvailable,
      beds.traumaTotal,
      beds.burnsAvailable,
      beds.burnsTotal,
      beds.regularAvailable,
      beds.regularTotal,
      blood['O+'],
      blood['O-'],
      blood['A+'],
      blood['A-'],
      blood['B+'],
      blood['B-'],
      blood['AB+'],
      blood['AB-'],
    ]
  );

  // Add default on-duty doctor
  db.run(
    `INSERT INTO doctors (id, hospital_id, name, specialty, department, qualification, status, phone, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `doc-${id}-1`,
      id,
      'Dr. Emergency Physician',
      'Trauma & Critical Care',
      'Emergency Department',
      'MBBS, MD (Emergency Medicine)',
      'available',
      phone,
      'On duty in ER Triage',
    ]
  );

  // Add default 108 ambulance
  db.run(
    `INSERT INTO ambulances (id, hospital_id, vehicle_number, driver_name, driver_phone, type, status, current_location, eta_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `amb-${id}-1`,
      id,
      `MH-02-ER-${Math.floor(1000 + Math.random() * 9000)}`,
      'Paramedic Pilot',
      phone,
      'ALS',
      'available',
      `${name} Ambulance Bay`,
      4,
    ]
  );

  persistDatabase();
  return getHospitalById(id)!;
}

export function deleteHospital(id: string): boolean {
  if (!db) throw new Error('Database not initialized');
  db.run(`DELETE FROM ambulances WHERE hospital_id = ?`, [id]);
  db.run(`DELETE FROM doctors WHERE hospital_id = ?`, [id]);
  db.run(`DELETE FROM hospitals WHERE id = ?`, [id]);
  persistDatabase();
  return true;
}

export function updateHospitalBeds(
  hospitalId: string,
  bedType: string,
  delta: number
): Hospital | null {
  if (!db) throw new Error('Database not initialized');
  const columnMap: Record<string, string> = {
    icuAvailable: 'icu_available',
    ventilatorAvailable: 'ventilator_available',
    oxygenAvailable: 'oxygen_available',
    traumaAvailable: 'trauma_available',
    burnsAvailable: 'burns_available',
    regularAvailable: 'regular_available',
  };

  const col = columnMap[bedType];
  if (!col) return null;

  db.run(
    `UPDATE hospitals SET ${col} = MAX(0, ${col} + ?), last_updated_minutes_ago = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [delta, hospitalId]
  );
  persistDatabase();
  return getHospitalById(hospitalId);
}

export function updateHospitalBlood(
  hospitalId: string,
  bloodGroup: BloodGroup,
  delta: number
): Hospital | null {
  if (!db) throw new Error('Database not initialized');
  const groupColMap: Record<BloodGroup, string> = {
    'O+': 'blood_o_pos',
    'O-': 'blood_o_neg',
    'A+': 'blood_a_pos',
    'A-': 'blood_a_neg',
    'B+': 'blood_b_pos',
    'B-': 'blood_b_neg',
    'AB+': 'blood_ab_pos',
    'AB-': 'blood_ab_neg',
  };

  const col = groupColMap[bloodGroup];
  if (!col) return null;

  db.run(
    `UPDATE hospitals SET ${col} = MAX(0, ${col} + ?), last_updated_minutes_ago = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [delta, hospitalId]
  );
  persistDatabase();
  return getHospitalById(hospitalId);
}

export function getAllRequests(): EmergencyRequest[] {
  if (!db) throw new Error('Database not initialized');
  const rows = resultToObjects(
    db.exec('SELECT * FROM emergency_requests ORDER BY created_at DESC')
  );

  return rows.map((r) => {
    const timelineRows = resultToObjects(
      db!.exec(
        `SELECT * FROM request_timeline WHERE request_id = '${r.id.replace(/'/g, "''")}' ORDER BY id ASC`
      )
    );

    return {
      id: r.id,
      patientName: r.patient_name,
      patientAge: Number(r.patient_age),
      patientGender: r.patient_gender,
      relativeName: r.relative_name || undefined,
      relativePhone: r.relative_phone || undefined,
      contactPhone: r.contact_phone,
      userRole: r.user_role,
      station: r.station,
      locationAddress: r.location_address,
      patientBloodType: r.patient_blood_type as BloodGroup,
      injuryType: r.injury_type,
      specialistRequired: r.specialist_required,
      specialistBooked: Boolean(r.specialist_booked),
      hospitalId: r.hospital_id,
      hospitalName: r.hospital_name,
      bedType: r.bed_type,
      allocatedBedNumber: r.allocated_bed_number || undefined,
      needAmbulance: r.need_ambulance,
      ambulanceInfo: r.ambulance_vehicle_number
        ? {
            type: 'hospital_deployed',
            vehicleNumber: r.ambulance_vehicle_number,
            driverName: r.ambulance_driver_name || 'Pilot',
            driverPhone: r.ambulance_driver_phone || '+91 98000 00000',
            currentStage: r.ambulance_stage || 'dispatched',
            currentLocationText: r.ambulance_location_text || 'En route',
            etaMinutes: Number(r.ambulance_eta_minutes) || 5,
            withOxygen: Boolean(r.ambulance_with_oxygen),
          }
        : undefined,
      slaRemainingSeconds: Number(r.sla_remaining_seconds),
      slaStatus: r.sla_status,
      fallbackHospitalSuggested: r.fallback_hospital_suggested || undefined,
      hospitalBloodRequirement: r.blood_required
        ? {
            required: true,
            unitsNeeded: Number(r.blood_units_needed) || 2,
            bloodGroup: r.blood_group as BloodGroup,
            status: r.blood_status || 'reserved',
            notes: r.blood_notes || undefined,
          }
        : undefined,
      doctorRequested: r.doctor_id
        ? {
            doctorId: r.doctor_id,
            doctorName: r.doctor_name,
            specialty: r.doctor_specialty,
            status: r.doctor_status || 'pending',
          }
        : undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      timeline: timelineRows.map((t) => ({
        time: t.time_text,
        title: t.title,
        description: t.description,
        role: t.role,
      })),
    };
  });
}

export function insertEmergencyRequest(req: EmergencyRequest): EmergencyRequest {
  if (!db) throw new Error('Database not initialized');
  db.run(
    `INSERT INTO emergency_requests (
      id, patient_name, patient_age, patient_gender, relative_name, relative_phone, contact_phone,
      user_role, station, location_address, patient_blood_type, injury_type, specialist_required,
      specialist_booked, hospital_id, hospital_name, bed_type, allocated_bed_number, need_ambulance,
      ambulance_vehicle_number, ambulance_driver_name, ambulance_driver_phone, ambulance_stage,
      ambulance_location_text, ambulance_eta_minutes, ambulance_with_oxygen, sla_remaining_seconds,
      sla_status, blood_required, blood_units_needed, blood_group, blood_status, blood_notes,
      doctor_id, doctor_name, doctor_specialty, doctor_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.id,
      req.patientName,
      req.patientAge || 30,
      req.patientGender || 'Female',
      req.relativeName || null,
      req.relativePhone || null,
      req.contactPhone,
      req.userRole,
      req.station,
      req.locationAddress,
      req.patientBloodType,
      req.injuryType,
      req.specialistRequired,
      req.specialistBooked ? 1 : 0,
      req.hospitalId,
      req.hospitalName,
      req.bedType,
      req.allocatedBedNumber || null,
      req.needAmbulance,
      req.ambulanceInfo?.vehicleNumber || null,
      req.ambulanceInfo?.driverName || null,
      req.ambulanceInfo?.driverPhone || null,
      req.ambulanceInfo?.currentStage || null,
      req.ambulanceInfo?.currentLocationText || null,
      req.ambulanceInfo?.etaMinutes || null,
      req.ambulanceInfo?.withOxygen ? 1 : 0,
      req.slaRemainingSeconds,
      req.slaStatus,
      req.hospitalBloodRequirement ? 1 : 0,
      req.hospitalBloodRequirement?.unitsNeeded || null,
      req.hospitalBloodRequirement?.bloodGroup || null,
      req.hospitalBloodRequirement?.status || null,
      req.hospitalBloodRequirement?.notes || null,
      req.doctorRequested?.doctorId || null,
      req.doctorRequested?.doctorName || null,
      req.doctorRequested?.specialty || null,
      req.doctorRequested?.status || null,
    ]
  );

  if (req.timeline && req.timeline.length > 0) {
    for (const ev of req.timeline) {
      db.run(
        `INSERT INTO request_timeline (request_id, time_text, title, description, role) VALUES (?, ?, ?, ?, ?)`,
        [req.id, ev.time, ev.title, ev.description, ev.role]
      );
    }
  }

  persistDatabase();
  return req;
}

export function updateRequestSla(requestId: string, status: string): boolean {
  if (!db) throw new Error('Database not initialized');
  db.run(
    `UPDATE emergency_requests SET sla_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, requestId]
  );
  db.run(
    `INSERT INTO request_timeline (request_id, time_text, title, description, role) VALUES (?, ?, ?, ?, ?)`,
    [
      requestId,
      'Just now',
      `SLA Status Updated: ${status.toUpperCase()}`,
      `Hospital triage desk processed SLA update to ${status}.`,
      'Triage System',
    ]
  );
  persistDatabase();
  return true;
}

export function executeRawSql(sql: string): { success: boolean; result?: any[]; error?: string; rowCount?: number } {
  if (!db) throw new Error('Database not initialized');
  try {
    const trimmed = sql.trim();
    if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
      const res = db.exec(trimmed);
      const objects = resultToObjects(res);
      return { success: true, result: objects, rowCount: objects.length };
    } else {
      db.run(trimmed);
      persistDatabase();
      return { success: true, result: [{ message: 'Statement executed successfully' }], rowCount: 1 };
    }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export function resetDatabaseToDefault(): void {
  if (!db) throw new Error('Database not initialized');
  db.run('DELETE FROM user_login_logs');
  db.run('DELETE FROM patient_records');
  db.run('DELETE FROM request_timeline');
  db.run('DELETE FROM emergency_requests');
  db.run('DELETE FROM ambulances');
  db.run('DELETE FROM doctors');
  db.run('DELETE FROM hospitals');
  seedInitialData(db);
  seedUserLogsAndPatients(db);
  persistDatabase();
}

// -------------------------------------------------------------
// DAO: User Login Logs & Activity Registry
// -------------------------------------------------------------

export function getUserLoginLogs(limit = 100): UserLoginLog[] {
  if (!db) throw new Error('Database not initialized');
  const rows = resultToObjects(
    db.exec(`SELECT * FROM user_login_logs ORDER BY login_timestamp DESC LIMIT ${Number(limit) || 100}`)
  );
  return rows.map((r) => ({
    id: r.id,
    userName: r.user_name,
    phone: r.phone || '',
    role: r.role,
    hospitalId: r.hospital_id || undefined,
    hospitalName: r.hospital_name || undefined,
    station: r.station || undefined,
    loginTimestamp: r.login_timestamp,
    status: r.status || 'active',
    ipAddress: r.ip_address || '127.0.0.1',
    userAgent: r.user_agent || undefined,
  }));
}

export function insertUserLoginLog(log: Partial<UserLoginLog>): UserLoginLog {
  if (!db) throw new Error('Database not initialized');
  const id = log.id || `LOG-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const userName = log.userName || 'Authorized User';
  const phone = log.phone || '';
  const role = log.role || 'guest';
  const hospitalId = log.hospitalId || null;
  const hospitalName = log.hospitalName || null;
  const station = log.station || 'Andheri';
  const status = log.status || 'active';
  const ipAddress = log.ipAddress || '127.0.0.1';
  const userAgent = log.userAgent || 'BedLink Emergency WebApp (Vite / React 19)';

  db.run(
    `INSERT INTO user_login_logs (id, user_name, phone, role, hospital_id, hospital_name, station, login_timestamp, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
    [id, userName, phone, role, hospitalId, hospitalName, station, status, ipAddress, userAgent]
  );
  persistDatabase();

  const results = resultToObjects(db.exec(`SELECT * FROM user_login_logs WHERE id = '${id.replace(/'/g, "''")}'`));
  const r = results[0] || {
    id,
    user_name: userName,
    phone,
    role,
    hospital_id: hospitalId,
    hospital_name: hospitalName,
    station,
    login_timestamp: new Date().toISOString(),
    status,
    ip_address: ipAddress,
    user_agent: userAgent,
  };

  return {
    id: r.id,
    userName: r.user_name,
    phone: r.phone || '',
    role: r.role,
    hospitalId: r.hospital_id || undefined,
    hospitalName: r.hospital_name || undefined,
    station: r.station || undefined,
    loginTimestamp: r.login_timestamp,
    status: r.status,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
  };
}

// -------------------------------------------------------------
// DAO: Patient Admissions, Confirmation & Discharge Registry
// -------------------------------------------------------------

export function getAllPatientRecords(): PatientRecord[] {
  if (!db) throw new Error('Database not initialized');
  const rows = resultToObjects(
    db.exec(`SELECT * FROM patient_records ORDER BY login_time DESC`)
  );
  return rows.map((r) => ({
    id: r.id,
    patientName: r.patient_name,
    patientAge: Number(r.patient_age) || 30,
    patientGender: r.patient_gender || 'Female',
    contactPhone: r.contact_phone || '',
    relativeName: r.relative_name || undefined,
    relativePhone: r.relative_phone || undefined,
    bloodGroup: (r.blood_group || 'O+') as BloodGroup,
    injuryType: r.injury_type || 'emergency',
    conditionSeverity: r.condition_severity || 'critical',
    loginTime: r.login_time,
    confirmedHospitalId: r.confirmed_hospital_id || undefined,
    confirmedHospitalName: r.confirmed_hospital_name || undefined,
    confirmedBedType: r.confirmed_bed_type || undefined,
    confirmedBedNumber: r.confirmed_bed_number || undefined,
    confirmationTime: r.confirmation_time || undefined,
    admissionStatus: r.admission_status || 'confirmed_admitted',
    dischargeTime: r.discharge_time || undefined,
    dischargeSummary: r.discharge_summary || undefined,
    attendingDoctor: r.attending_doctor || undefined,
    ambulanceVehicleNumber: r.ambulance_vehicle_number || undefined,
    notes: r.notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getPatientRecordById(id: string): PatientRecord | null {
  const all = getAllPatientRecords();
  return all.find((p) => p.id === id) || null;
}

export function insertPatientRecord(pat: Partial<PatientRecord>): PatientRecord {
  if (!db) throw new Error('Database not initialized');
  const id = pat.id || `PAT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const patientName = pat.patientName || 'Emergency Patient';
  const age = pat.patientAge || 30;
  const gender = pat.patientGender || 'Female';
  const contactPhone = pat.contactPhone || '+91 98000 00000';
  const relativeName = pat.relativeName || null;
  const relativePhone = pat.relativePhone || null;
  const bloodGroup = pat.bloodGroup || 'O+';
  const injuryType = pat.injuryType || 'road_accident';
  const conditionSeverity = pat.conditionSeverity || 'critical';
  const confirmedHospitalId = pat.confirmedHospitalId || null;
  const confirmedHospitalName = pat.confirmedHospitalName || null;
  const confirmedBedType = pat.confirmedBedType || null;
  const confirmedBedNumber = pat.confirmedBedNumber || null;
  const admissionStatus = pat.admissionStatus || (confirmedHospitalId ? 'confirmed_admitted' : 'pending_confirmation');
  const attendingDoctor = pat.attendingDoctor || null;
  const ambulanceVehicleNumber = pat.ambulanceVehicleNumber || null;
  const notes = pat.notes || null;

  db.run(
    `INSERT INTO patient_records (
      id, patient_name, patient_age, patient_gender, contact_phone, relative_name, relative_phone,
      blood_group, injury_type, condition_severity, login_time, confirmed_hospital_id,
      confirmed_hospital_name, confirmed_bed_type, confirmed_bed_number, confirmation_time,
      admission_status, attending_doctor, ambulance_vehicle_number, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ${confirmedHospitalId ? "datetime('now')" : "NULL"}, ?, ?, ?, ?)`,
    [
      id,
      patientName,
      age,
      gender,
      contactPhone,
      relativeName,
      relativePhone,
      bloodGroup,
      injuryType,
      conditionSeverity,
      confirmedHospitalId,
      confirmedHospitalName,
      confirmedBedType,
      confirmedBedNumber,
      admissionStatus,
      attendingDoctor,
      ambulanceVehicleNumber,
      notes,
    ]
  );
  persistDatabase();
  return getPatientRecordById(id)!;
}

export function updatePatientConfirmation(
  recordId: string,
  hospitalId: string,
  hospitalName: string,
  bedType: string,
  bedNumber?: string
): PatientRecord | null {
  if (!db) throw new Error('Database not initialized');
  db.run(
    `UPDATE patient_records SET
      confirmed_hospital_id = ?,
      confirmed_hospital_name = ?,
      confirmed_bed_type = ?,
      confirmed_bed_number = ?,
      confirmation_time = datetime('now'),
      admission_status = 'confirmed_admitted',
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [hospitalId, hospitalName, bedType, bedNumber || `${bedType.toUpperCase()} Bay #01`, recordId]
  );
  persistDatabase();
  return getPatientRecordById(recordId);
}

export function dischargePatientRecord(
  recordId: string,
  dischargeTime?: string,
  dischargeSummary?: string,
  attendingDoctor?: string
): PatientRecord | null {
  if (!db) throw new Error('Database not initialized');
  const summary = dischargeSummary || 'Patient vitals stabilized. Clinical discharge approved by emergency department.';
  
  db.run(
    `UPDATE patient_records SET
      admission_status = 'discharged',
      discharge_time = datetime('now'),
      discharge_summary = ?,
      attending_doctor = COALESCE(?, attending_doctor),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [summary, attendingDoctor || null, recordId]
  );
  persistDatabase();
  return getPatientRecordById(recordId);
}

// -------------------------------------------------------------
// DAO: Ambulance Dispatch & Origin Hospital Tracking
// -------------------------------------------------------------

export function getAllAmbulancesWithHospitals(): AmbulanceDispatchRecord[] {
  if (!db) throw new Error('Database not initialized');
  const sql = `
    SELECT 
      a.id,
      a.vehicle_number,
      a.driver_name,
      a.driver_phone,
      a.type,
      a.status,
      a.current_location,
      a.eta_minutes,
      a.hospital_id,
      COALESCE(h.name, 'Western Line Base Station') as hospital_name,
      COALESCE(h.station, 'Andheri') as hospital_station,
      h.phone as hospital_phone,
      r.id as request_id,
      r.patient_name as assigned_patient_name,
      r.location_address as patient_location,
      a.created_at
    FROM ambulances a
    LEFT JOIN hospitals h ON a.hospital_id = h.id
    LEFT JOIN emergency_requests r ON r.ambulance_vehicle_number = a.vehicle_number
    ORDER BY 
      CASE WHEN a.status != 'available' THEN 0 ELSE 1 END,
      h.name ASC;
  `;
  const rows = resultToObjects(db.exec(sql));
  return rows.map((r) => ({
    id: r.id,
    vehicleNumber: r.vehicle_number,
    driverName: r.driver_name,
    driverPhone: r.driver_phone,
    type: r.type,
    status: r.status,
    currentLocation: r.current_location,
    etaMinutes: Number(r.eta_minutes) || 5,
    hospitalId: r.hospital_id,
    hospitalName: r.hospital_name,
    hospitalStation: r.hospital_station,
    hospitalPhone: r.hospital_phone || undefined,
    assignedPatientName: r.assigned_patient_name || undefined,
    patientLocation: r.patient_location || undefined,
    requestId: r.request_id || undefined,
    dispatchedAt: r.created_at || undefined,
  }));
}
