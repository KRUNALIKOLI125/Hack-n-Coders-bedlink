export type Language = 'en' | 'hi' | 'mr' | 'ml' | 'bn' | 'gu';

export type BloodGroup = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export type BedType = 'icu' | 'ventilator' | 'oxygen' | 'trauma' | 'burns' | 'regular';

export type InjuryType =
  | 'blood_loss'
  | 'road_accident'
  | 'cardiac'
  | 'burns'
  | 'neuro_head'
  | 'respiratory'
  | 'fracture_ortho'
  | 'general_critical';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  status: 'available' | 'in_surgery' | 'on_standby' | 'busy';
  phone: string;
  requestedForCase?: boolean;
  requestStatus?: 'none' | 'pending' | 'accepted' | 'declined';
  lastSeen?: string;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  type: 'ALS' | 'BLS' | 'Cardiac';
  status: 'available' | 'dispatched' | 'en_route_pickup' | 'arrived_scene' | 'in_transit_hospital' | 'arrived_hospital';
  currentLocation: string;
  etaMinutes?: number;
}

export interface Hospital {
  id: string;
  name: string;
  station: string; // e.g. 'Andheri', 'Bandra', 'Borivali', 'Virar', 'Churchgate'
  stationDistanceKm: number; // e.g. 0.8
  stationDistanceText: string; // e.g. '0.8 km from Andheri Station'
  area: string;
  address: string;
  phone: string;
  isFamous: boolean;
  beds: {
    icuAvailable: number;
    icuTotal: number;
    ventilatorAvailable: number;
    ventilatorTotal: number;
    oxygenAvailable: number;
    oxygenTotal: number;
    traumaAvailable: number;
    traumaTotal: number;
    burnsAvailable: number;
    burnsTotal: number;
    regularAvailable: number;
    regularTotal: number;
  };
  bloodBank: Record<BloodGroup, number>;
  lastUpdatedMinutesAgo: number; // For Data Freshness: Green <5, Yellow 5-15, Red >15
  schemes: {
    ayushmanBharat: boolean;
    mjpjay: boolean;
    cashlessInsurance: boolean;
  };
  doctors: Doctor[];
  ambulances: Ambulance[];
  currentLoadPercentage: number;
}

export interface MultiHoldHospitalResponse {
  hospitalId: string;
  hospitalName: string;
  station: string;
  distanceKm: number;
  distanceText: string;
  phone: string;
  availableBedsCount: number;
  bloodAvailableUnits: number;
  status: 'pending' | 'accepted' | 'declined' | 'timed_out';
  confirmedBedNumber?: string;
  responseTimeSeconds?: number;
}

export interface MultiHoldSession {
  id: string;
  patientName: string;
  injuryType: InjuryType;
  bloodType: BloodGroup;
  bedType: BedType;
  hospitals: MultiHoldHospitalResponse[];
  iterationNumber: number; // 1, 2, etc.
  hospitalTimerSeconds: number; // 120s countdown for hospital responses
  patientDecisionTimerSeconds: number; // 120s countdown for patient to confirm once hospital(s) accept
  phase: 'waiting_hospitals' | 'patient_selecting' | 'confirmed_selecting_ambulance' | 'finalized' | 'failed_need_next_iteration';
  selectedHospitalId?: string;
  selectedHospitalName?: string;
  ambulanceDecision?: {
    needed: boolean;
    withOxygen: boolean; // true = with oxygen, false = without oxygen
    assignedVehicle?: string;
    driverName?: string;
    driverPhone?: string;
    etaMinutes?: number;
  };
}

export interface EmergencyRequest {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Female' | 'Male' | 'Other';
  relativeName?: string;
  relativePhone?: string;
  contactPhone: string;
  userRole: 'patient' | 'relative' | 'good_samaritan' | 'ambulance_crew';
  station: string;
  locationAddress: string;
  gpsCoordinates?: { lat: number; lng: number };
  patientBloodType: BloodGroup;
  injuryType: InjuryType;
  specialistRequired: string;
  specialistBooked: boolean;
  hospitalId: string;
  hospitalName: string;
  bedType: BedType;
  allocatedBedNumber?: string;
  // Ambulance Need & Status
  needAmbulance: 'yes_hospital' | 'yes_any' | 'own_private' | 'not_needed';
  ambulanceInfo?: {
    type: 'hospital_deployed' | '108_city' | 'private_call';
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    currentStage: 'dispatched' | 'en_route_pickup' | 'arrived_scene' | 'in_transit_hospital' | 'arrived_hospital';
    currentLocationText: string;
    etaMinutes: number;
    withOxygen?: boolean;
  };
  // SLA Confirm & Hold
  slaRemainingSeconds: number; // 120 sec countdown
  slaStatus: 'pending_response' | 'accepted_held' | 'rejected_rerouted' | 'timeout_rerouted';
  fallbackHospitalSuggested?: string;
  hospitalBloodRequirement?: {
    required: boolean;
    unitsNeeded: number;
    bloodGroup: BloodGroup;
    status: 'reserved' | 'cross_match_needed' | 'dispatched_regional';
    notes?: string;
  };
  doctorRequested?: {
    doctorId: string;
    doctorName: string;
    specialty: string;
    status: 'pending' | 'accepted' | 'declined';
  };
  createdAt: string;
  updatedAt: string;
  timeline: Array<{
    time: string;
    title: string;
    description: string;
    role: string;
  }>;
}

export interface UserSession {
  isLoggedIn: boolean;
  role: 'guest' | 'patient_relative' | 'nurse' | 'doctor' | 'ambulance_crew' | 'admin';
  name: string;
  phone: string;
  hospitalId?: string;
  hospitalName?: string;
  patientBloodType?: BloodGroup;
  selectedStation?: string;
  relativeName?: string;
  relativePhone?: string;
  locationShared?: boolean;
}

export interface UserLoginLog {
  id: string;
  userName: string;
  phone: string;
  role: 'guest' | 'patient_relative' | 'nurse' | 'doctor' | 'ambulance_crew' | 'admin';
  hospitalId?: string;
  hospitalName?: string;
  station?: string;
  loginTimestamp: string;
  status: 'active' | 'logged_out' | 'session_expired';
  ipAddress?: string;
  userAgent?: string;
}

export interface PatientRecord {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Female' | 'Male' | 'Other';
  contactPhone: string;
  relativeName?: string;
  relativePhone?: string;
  bloodGroup: BloodGroup;
  injuryType: InjuryType | string;
  conditionSeverity: 'critical' | 'severe' | 'moderate' | 'stable';
  loginTime: string; // When did patient/relative log in / enter system
  confirmedHospitalId?: string; // Which hospital they were confirmed at
  confirmedHospitalName?: string;
  confirmedBedType?: BedType | string;
  confirmedBedNumber?: string;
  confirmationTime?: string; // When hospital confirmed bed hold & admission
  admissionStatus: 'pending_confirmation' | 'confirmed_admitted' | 'under_treatment' | 'discharged' | 'transferred';
  dischargeTime?: string; // When did they discharge
  dischargeSummary?: string; // Clinical notes / discharge summary
  attendingDoctor?: string;
  ambulanceVehicleNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AmbulanceDispatchRecord {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  type: 'ALS' | 'BLS' | 'Cardiac';
  status: 'available' | 'dispatched' | 'en_route_pickup' | 'arrived_scene' | 'in_transit_hospital' | 'arrived_hospital';
  currentLocation: string;
  etaMinutes?: number;
  hospitalId: string;
  hospitalName: string;
  hospitalStation: string;
  hospitalPhone?: string;
  assignedPatientName?: string;
  patientLocation?: string;
  requestId?: string;
  dispatchedAt?: string;
}
