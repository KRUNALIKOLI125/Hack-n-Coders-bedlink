import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Hospital,
  EmergencyRequest,
  Language,
  BloodGroup,
  BedType,
  InjuryType,
  UserSession,
  MultiHoldSession,
  MultiHoldHospitalResponse,
  UserLoginLog,
  PatientRecord,
} from '../types';
import { INITIAL_WESTERN_HOSPITALS } from '../data/westernLineHospitals';
import { TRANSLATIONS } from '../data/translations';

interface EmergencyContextType {
  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Session & Authentication
  userSession: UserSession;
  loginAsEmergency: () => void;
  loginAsPatientRelative: (data: {
    relativeName: string;
    patientName: string;
    phone: string;
    bloodType: BloodGroup;
    station: string;
  }) => void;
  loginAsNurse: (data: { hospitalId: string; staffId: string; nurseName: string }) => void;
  loginAsDoctor: (hospitalId: string, doctorId: string) => void;
  loginAsAmbulance: (data: {
    driverId: string;
    driverName: string;
    vehicleNumber: string;
    phone: string;
  }) => void;
  logout: () => void;

  // Role Access Checks
  canAccessNurse: boolean;
  canAccessAmbulanceDriver: boolean;
  canAccessAdmin: boolean;
  loginAsAdmin: (adminId?: string) => void;
  addHospital: (hospData: Partial<Hospital>) => Promise<boolean>;
  removeHospital: (hospitalId: string) => Promise<boolean>;
  refreshFromBackend: () => Promise<void>;

  // User Login Logs & Patient Registry Database
  userLoginLogs: UserLoginLog[];
  patientRecords: PatientRecord[];
  refreshUserLogs: () => Promise<void>;
  refreshPatientRecords: () => Promise<void>;
  dischargePatientRecord: (patientId: string, summary?: string, doctor?: string) => Promise<boolean>;

  // Navigation & Active View
  activeView: 'login' | 'bed_grid' | 'nurse_dashboard' | 'ambulance_tracker' | 'track_case' | 'admin';
  setActiveView: (view: 'login' | 'bed_grid' | 'nurse_dashboard' | 'ambulance_tracker' | 'track_case' | 'admin') => void;

  // Patient GPS & SMS Location Access
  locationAccessSent: boolean;
  patientGpsAcquired: boolean;
  acquiredAddress: string;
  sendLocationSmsToPatient: () => void;
  triggerBrowserGps: () => Promise<void>;

  // Filters
  selectedStation: string;
  setSelectedStation: (station: string) => void;
  within2KmOnly: boolean;
  setWithin2KmOnly: (val: boolean) => void;
  patientBloodType: BloodGroup | 'all';
  setPatientBloodType: (blood: BloodGroup | 'all') => void;
  selectedInjuryType: InjuryType;
  setSelectedInjuryType: (injury: InjuryType) => void;
  selectedBedType: BedType;
  setSelectedBedType: (bed: BedType) => void;

  // Hospitals Data & 10-Second Bed Updates
  hospitals: Hospital[];
  updateBedCount: (hospitalId: string, bedType: keyof Hospital['beds'], delta: number) => void;
  updateHospitalBloodBank: (hospitalId: string, bloodGroup: BloodGroup, delta: number) => void;

  // Requests & 2-Minute SLA Confirm-and-Hold
  requests: EmergencyRequest[];
  activeRequest: EmergencyRequest | null;
  setActiveRequest: (req: EmergencyRequest | null) => void;
  createBedHoldRequest: (params: {
    hospitalId: string;
    bedType: BedType;
    needAmbulance: 'yes_hospital' | 'yes_any' | 'own_private' | 'not_needed';
    withOxygen?: boolean;
    privateAmbulanceInfo?: { driverName: string; vehicleNumber: string; driverPhone: string };
  }) => string;
  acceptBedHold: (requestId: string) => void;
  rejectBedHold: (requestId: string) => void;

  // Requirement 2 & 3: Multi-Hospital Hold & Confirm Session
  multiHoldSession: MultiHoldSession | null;
  startMultiHoldSession: (rankedHospitals: Hospital[], bedType: BedType) => void;
  confirmMultiHoldHospital: (hospitalId: string) => void;
  confirmAmbulanceDecision: (needed: boolean, withOxygen: boolean) => void;
  triggerNextIteration: () => void;
  closeMultiHoldModal: () => void;

  // Requirement 4: Offline Connection Handling
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  toggleSimulateOffline: () => void;
  getNearest3OfflineHospitals: () => Hospital[];

  // Doctor Availability
  requestDoctorAvailability: (hospitalId: string, doctorId: string) => void;
  respondDoctorAvailability: (hospitalId: string, doctorId: string, accepted: boolean) => void;

  // Ambulance Dispatch & Live Movement
  deployHospitalAmbulance: (requestId: string, hospitalId: string, withOxygen?: boolean) => void;
  updateAmbulanceStage: (
    requestId: string,
    stage: 'dispatched' | 'en_route_pickup' | 'arrived_scene' | 'in_transit_hospital' | 'arrived_hospital',
    locationText: string,
    etaMinutes: number
  ) => void;

  resetAllData: () => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

const SPECIALIST_MAPPING: Record<InjuryType, string> = {
  blood_loss: 'Vascular & Trauma Surgeon (Emergency Bleed)',
  road_accident: 'Trauma & Orthopedic Surgeon (Polytrauma)',
  cardiac: 'Interventional Cardiologist (Emergency Cath Lab)',
  burns: 'Plastic & Burns Reconstructive Surgeon',
  neuro_head: 'Neurosurgeon & Neuro-Intensivist',
  respiratory: 'Pulmonologist & Critical Care Intensivist',
  fracture_ortho: 'Orthopedic Trauma Surgeon',
  general_critical: 'Emergency Critical Care Physician',
};

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  const [userSession, setUserSession] = useState<UserSession>({
    isLoggedIn: false,
    role: 'guest',
    name: 'Guest User',
    phone: '',
    selectedStation: 'Andheri',
    patientBloodType: 'O+',
  });

  const [activeView, setActiveView] = useState<
    'login' | 'bed_grid' | 'nurse_dashboard' | 'ambulance_tracker' | 'track_case' | 'admin'
  >('login');

  // Role Access
  const canAccessNurse = userSession.role === 'nurse' || userSession.role === 'doctor';
  const canAccessAmbulanceDriver = userSession.role === 'ambulance_crew';
  const canAccessAdmin = userSession.role === 'admin';

  // GPS & Location Sharing
  const [locationAccessSent, setLocationAccessSent] = useState(false);
  const [patientGpsAcquired, setPatientGpsAcquired] = useState(false);
  const [acquiredAddress, setAcquiredAddress] = useState('Near Andheri Station East, Western Express Hwy');

  // Filters
  const [selectedStation, setSelectedStation] = useState<string>('All Stations (Virar to Churchgate)');
  const [within2KmOnly, setWithin2KmOnly] = useState<boolean>(false);
  const [patientBloodType, setPatientBloodType] = useState<BloodGroup | 'all'>('O+');
  const [selectedInjuryType, setSelectedInjuryType] = useState<InjuryType>('blood_loss');
  const [selectedBedType, setSelectedBedType] = useState<BedType>('trauma');

  // Requirement 4: Offline State Management
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulateOffline = () => {
    setIsOffline((prev) => !prev);
  };

  // Hospitals
  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    try {
      const saved = localStorage.getItem('bedlink_western_hospitals_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WESTERN_HOSPITALS;
  });

  // Requests
  const [requests, setRequests] = useState<EmergencyRequest[]>(() => {
    return [
      {
        id: 'REQ-7H-8821',
        patientName: 'Swara Patil',
        patientAge: 26,
        patientGender: 'Female',
        relativeName: 'Swara Patil',
        relativePhone: '+91 98201 54321',
        contactPhone: '+91 98201 54321',
        userRole: 'patient',
        station: 'Andheri',
        locationAddress: 'Western Express Highway, near Hub Flyover, Andheri / Goregaon East',
        patientBloodType: 'O+',
        injuryType: 'blood_loss',
        specialistRequired: 'Vascular & Trauma Surgeon (Emergency Bleed)',
        specialistBooked: true,
        hospitalId: 'seven-hills',
        hospitalName: 'Seven Hills Hospital',
        bedType: 'trauma',
        allocatedBedNumber: 'Trauma Resuscitation Bay #02',
        needAmbulance: 'yes_hospital',
        ambulanceInfo: {
          type: 'hospital_deployed',
          vehicleNumber: 'MH-02-ER-9192',
          driverName: 'Ramesh Sawant',
          driverPhone: '+91 98700 11223',
          currentStage: 'en_route_pickup',
          currentLocationText: 'WEH Metro Flyover, 1.2 km away from patient',
          etaMinutes: 4,
          withOxygen: true,
        },
        slaRemainingSeconds: 78,
        slaStatus: 'accepted_held',
        hospitalBloodRequirement: {
          required: true,
          unitsNeeded: 2,
          bloodGroup: 'O+',
          status: 'reserved',
          notes: 'Seven Hills Blood Bank reserved 2 units O+ PRBC in trauma bay cooler.',
        },
        doctorRequested: {
          doctorId: 'doc-7h-2',
          doctorName: 'Dr. Anita Deshmukh',
          specialty: 'Vascular & Trauma Surgeon',
          status: 'accepted',
        },
        createdAt: '12 mins ago',
        updatedAt: 'Just now',
        timeline: [
          {
            time: '12 mins ago',
            title: 'Bed Hold Request Initiated',
            description: 'Patient Swara Patil held Trauma Bay at Seven Hills Hospital.',
            role: 'Swara (Patient)',
          },
          {
            time: '10 mins ago',
            title: 'Seven Hills Nurse Accepted (2-Min SLA)',
            description: 'Sister Sneha locked Trauma Bay #02 for 120s window.',
            role: 'Sister Sneha (Seven Hills Nurse Desk)',
          },
          {
            time: '8 mins ago',
            title: 'Hospital Blood Alert: 2 Units O+ Reserved',
            description: 'Seven Hills Blood Bank tagged cross-match for rapid transfusion.',
            role: 'Blood Bank Officer',
          },
          {
            time: '5 mins ago',
            title: 'Ambulance Deployed: MH-02-ER-9192 (With Oxygen)',
            description: 'Driver Ramesh Sawant en route with oxygen cylinder & trauma kit.',
            role: 'Seven Hills Emergency Dispatch',
          },
        ],
      },
    ];
  });

  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(requests[0]);

  // Requirement 2: Multi-Hospital Hold Session State
  const [multiHoldSession, setMultiHoldSession] = useState<MultiHoldSession | null>(null);

  // Sync hospitals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bedlink_western_hospitals_v3', JSON.stringify(hospitals));
    } catch {}
  }, [hospitals]);

  // Initial fetch from Node.js backend SQL database
  const refreshFromBackend = async () => {
    try {
      const res = await fetch('/api/hospitals');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHospitals(data);
        }
      }
      const reqRes = await fetch('/api/requests');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (Array.isArray(reqData) && reqData.length > 0) {
          setRequests(reqData);
        }
      }
      await refreshUserLogs();
      await refreshPatientRecords();
    } catch (err) {
      console.warn('Backend sync fallback to cached state:', err);
    }
  };

  // User Login Logs & Patient Registry States
  const [userLoginLogs, setUserLoginLogs] = useState<UserLoginLog[]>([]);
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);

  const refreshUserLogs = async () => {
    try {
      const res = await fetch('/api/user-logs');
      if (res.ok) {
        const logs = await res.json();
        if (Array.isArray(logs)) setUserLoginLogs(logs);
      }
    } catch (err) {
      console.warn('Failed to load user logs from backend:', err);
    }
  };

  const refreshPatientRecords = async () => {
    try {
      const res = await fetch('/api/patient-records');
      if (res.ok) {
        const pats = await res.json();
        if (Array.isArray(pats)) setPatientRecords(pats);
      }
    } catch (err) {
      console.warn('Failed to load patient records from backend:', err);
    }
  };

  const dischargePatientRecord = async (
    patientId: string,
    summary?: string,
    doctor?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/patient-records/${patientId}/discharge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dischargeTime: new Date().toISOString(),
          dischargeSummary: summary || 'Patient stabilized. Discharge authorized by clinical staff.',
          attendingDoctor: doctor,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPatientRecords((prev) =>
          prev.map((p) => (p.id === patientId ? updated : p))
        );
        return true;
      }
    } catch (err) {
      console.error('Failed to discharge patient in backend:', err);
    }
    return false;
  };

  useEffect(() => {
    refreshFromBackend();
  }, []);

  // Administrator: Add new hospital to SQL database
  const addHospital = async (hospData: Partial<Hospital>): Promise<boolean> => {
    try {
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hospData),
      });
      if (res.ok) {
        const created = await res.json();
        setHospitals((prev) => [created, ...prev]);
        return true;
      }
    } catch (err) {
      console.error('Failed to add hospital to backend:', err);
    }

    // Client-side fallback if backend unreachable
    const newId = `hosp-${Date.now().toString(36)}`;
    const fullHosp: Hospital = {
      id: newId,
      name: hospData.name || 'Emergency Center',
      station: hospData.station || 'Andheri',
      stationDistanceKm: hospData.stationDistanceKm || 1.2,
      stationDistanceText: `${hospData.stationDistanceKm || 1.2} km from ${hospData.station || 'Andheri'} Station`,
      area: hospData.area || `${hospData.station || 'Andheri'} East`,
      address: hospData.address || `${hospData.area || hospData.station}, Mumbai`,
      phone: hospData.phone || '+91 22 2800 0000',
      isFamous: Boolean(hospData.isFamous),
      currentLoadPercentage: 50,
      lastUpdatedMinutesAgo: 1,
      schemes: { ayushmanBharat: true, mjpjay: true, cashlessInsurance: true },
      beds: hospData.beds || {
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
      },
      bloodBank: hospData.bloodBank || {
        'O+': 10,
        'O-': 4,
        'A+': 12,
        'A-': 5,
        'B+': 14,
        'B-': 4,
        'AB+': 6,
        'AB-': 2,
      },
      doctors: [],
      ambulances: [],
    };
    setHospitals((prev) => [fullHosp, ...prev]);
    return true;
  };

  // Administrator: Delete hospital from SQL database
  const removeHospital = async (hospitalId: string): Promise<boolean> => {
    try {
      await fetch(`/api/hospitals/${hospitalId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err);
    }
    setHospitals((prev) => prev.filter((h) => h.id !== hospitalId));
    return true;
  };

  // SLA 2-minute countdown timer effect for single requests
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prev) =>
        prev.map((req) => {
          if (req.slaStatus === 'pending_response') {
            if (req.slaRemainingSeconds > 0) {
              return { ...req, slaRemainingSeconds: req.slaRemainingSeconds - 1 };
            } else {
              const fallback =
                hospitals.find((h) => h.id !== req.hospitalId && h.beds.icuAvailable > 0)?.name ||
                'Cooper Municipal Hospital';
              return {
                ...req,
                slaStatus: 'timeout_rerouted',
                fallbackHospitalSuggested: fallback,
                timeline: [
                  ...req.timeline,
                  {
                    time: 'Just now',
                    title: '2-Minute SLA Timeout (Auto-Rerouting)',
                    description: `Primary hospital timed out. Instantly rerouted to ${fallback}.`,
                    role: 'Automated Failover System',
                  },
                ],
              };
            }
          }
          return req;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [hospitals]);

  // Requirement 2: MultiHold Timer and Simulated Concurrent Hospital Responses
  useEffect(() => {
    if (!multiHoldSession) return;

    const timer = setInterval(() => {
      setMultiHoldSession((curr) => {
        if (!curr) return null;

        // Phase 1: Waiting for the 3 hospitals to respond within their 120s window
        if (curr.phase === 'waiting_hospitals') {
          const nextSec = curr.hospitalTimerSeconds - 1;

          // Simulate realistic concurrent hospital nurse triage responses:
          // Hospital 0 accepts after 3s, Hospital 1 accepts after 6s, Hospital 2 accepts after 9s (or declines if high load)
          const elapsed = 120 - nextSec;
          const updatedHospitals = curr.hospitals.map((h, idx) => {
            if (h.status === 'pending') {
              if (idx === 0 && elapsed >= 3) {
                return { ...h, status: 'accepted' as const, confirmedBedNumber: `${curr.bedType.toUpperCase()} Bay #0${idx + 2}` };
              }
              if (idx === 1 && elapsed >= 6) {
                return { ...h, status: 'accepted' as const, confirmedBedNumber: `${curr.bedType.toUpperCase()} Bay #0${idx + 2}` };
              }
              if (idx === 2 && elapsed >= 9) {
                // If 3rd hospital load is very high, test partial accept (or all 3 accept)
                return { ...h, status: 'accepted' as const, confirmedBedNumber: `${curr.bedType.toUpperCase()} Bay #0${idx + 2}` };
              }
            }
            return h;
          });

          const anyAccepted = updatedHospitals.some((h) => h.status === 'accepted');
          const allResponded = updatedHospitals.every((h) => h.status !== 'pending');

          // Once at least one has accepted or all responded: transition to patient_selecting!
          if (elapsed >= 10 || allResponded) {
            if (anyAccepted) {
              return {
                ...curr,
                hospitalTimerSeconds: nextSec,
                hospitals: updatedHospitals,
                phase: 'patient_selecting',
                patientDecisionTimerSeconds: 120, // 2-minute timer starts for patient!
              };
            }
          }

          if (nextSec <= 0) {
            if (anyAccepted) {
              return {
                ...curr,
                hospitalTimerSeconds: 0,
                hospitals: updatedHospitals,
                phase: 'patient_selecting',
                patientDecisionTimerSeconds: 120,
              };
            } else {
              return {
                ...curr,
                phase: 'failed_need_next_iteration',
              };
            }
          }

          return {
            ...curr,
            hospitalTimerSeconds: nextSec,
            hospitals: updatedHospitals,
          };
        }

        // Phase 2: Patient deciding within 2 minutes
        if (curr.phase === 'patient_selecting') {
          const nextPatientSec = curr.patientDecisionTimerSeconds - 1;
          if (nextPatientSec <= 0) {
            // Patient decision timed out -> auto-select first accepted hospital
            const firstAcc = curr.hospitals.find((h) => h.status === 'accepted') || curr.hospitals[0];
            return {
              ...curr,
              patientDecisionTimerSeconds: 0,
              phase: 'confirmed_selecting_ambulance',
              selectedHospitalId: firstAcc.hospitalId,
              selectedHospitalName: firstAcc.hospitalName,
            };
          }
          return {
            ...curr,
            patientDecisionTimerSeconds: nextPatientSec,
          };
        }

        return curr;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [multiHoldSession]);

  // Requirement 2: Start Multi-Hospital Hold Session
  const startMultiHoldSession = (rankedHospitals: Hospital[], bedType: BedType) => {
    // Select top 3 ranked hospitals
    const top3 = rankedHospitals.slice(0, 3);
    const bType = (patientBloodType === 'all' ? 'O+' : patientBloodType) as BloodGroup;

    const mappedResponses: MultiHoldHospitalResponse[] = top3.map((h, idx) => ({
      hospitalId: h.id,
      hospitalName: h.name,
      station: h.station,
      distanceKm: h.stationDistanceKm,
      distanceText: h.stationDistanceText,
      phone: h.phone,
      availableBedsCount: h.beds[bedType === 'icu' ? 'icuAvailable' : bedType === 'trauma' ? 'traumaAvailable' : 'regularAvailable'],
      bloodAvailableUnits: h.bloodBank[bType] || 0,
      status: 'pending',
    }));

    const session: MultiHoldSession = {
      id: `MULTI-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: userSession.name || 'Swara Patil',
      injuryType: selectedInjuryType,
      bloodType: bType,
      bedType,
      hospitals: mappedResponses,
      iterationNumber: 1,
      hospitalTimerSeconds: 120, // 2-minute SLA for hospitals
      patientDecisionTimerSeconds: 120, // 2-minute SLA for patient
      phase: 'waiting_hospitals',
    };

    setMultiHoldSession(session);
  };

  // Requirement 2: Patient confirms one of the accepted hospitals
  const confirmMultiHoldHospital = (hospitalId: string) => {
    if (!multiHoldSession) return;
    const chosen = multiHoldSession.hospitals.find((h) => h.hospitalId === hospitalId);
    if (!chosen) return;

    setMultiHoldSession({
      ...multiHoldSession,
      selectedHospitalId: chosen.hospitalId,
      selectedHospitalName: chosen.hospitalName,
      phase: 'confirmed_selecting_ambulance', // Requirement 3: Prompt ambulance decision once hospital & bed is confirmed!
    });
  };

  // Requirement 3: Ambulance decision (With oxygen or without oxygen)
  const confirmAmbulanceDecision = (needed: boolean, withOxygen: boolean) => {
    if (!multiHoldSession || !multiHoldSession.selectedHospitalId) return;

    const targetHosp = hospitals.find((h) => h.id === multiHoldSession.selectedHospitalId) || hospitals[0];
    const amb = targetHosp.ambulances[0];

    const ambData = needed
      ? {
          needed: true,
          withOxygen,
          assignedVehicle: amb ? amb.vehicleNumber : 'MH-02-ER-9192',
          driverName: amb ? amb.driverName : 'Ramesh Sawant',
          driverPhone: amb ? amb.driverPhone : '+91 98700 11223',
          etaMinutes: withOxygen ? 4 : 5,
        }
      : {
          needed: false,
          withOxygen: false,
        };

    const newReqId = `REQ-${targetHosp.name.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReq: EmergencyRequest = {
      id: newReqId,
      patientName: multiHoldSession.patientName,
      patientAge: 26,
      patientGender: 'Female',
      relativeName: userSession.relativeName || multiHoldSession.patientName,
      relativePhone: userSession.phone || '+91 98201 54321',
      contactPhone: userSession.phone || '+91 98201 54321',
      userRole: 'patient',
      station: targetHosp.station,
      locationAddress: acquiredAddress,
      patientBloodType: multiHoldSession.bloodType,
      injuryType: multiHoldSession.injuryType,
      specialistRequired: SPECIALIST_MAPPING[multiHoldSession.injuryType],
      specialistBooked: true,
      hospitalId: targetHosp.id,
      hospitalName: targetHosp.name,
      bedType: multiHoldSession.bedType,
      allocatedBedNumber: `${multiHoldSession.bedType.toUpperCase()} Bay #02`,
      needAmbulance: needed ? 'yes_hospital' : 'not_needed',
      ambulanceInfo: needed
        ? {
            type: 'hospital_deployed',
            vehicleNumber: ambData.assignedVehicle || 'MH-02-ER-9192',
            driverName: ambData.driverName || 'Ramesh Sawant',
            driverPhone: ambData.driverPhone || '+91 98700 11223',
            currentStage: 'dispatched',
            currentLocationText: `${targetHosp.name} Emergency Bay, navigating to patient (${withOxygen ? 'With Oxygen ALS' : 'Standard BLS'})`,
            etaMinutes: ambData.etaMinutes || 4,
            withOxygen,
          }
        : undefined,
      slaRemainingSeconds: 120,
      slaStatus: 'accepted_held',
      hospitalBloodRequirement: {
        required: true,
        unitsNeeded: 2,
        bloodGroup: multiHoldSession.bloodType,
        status: 'reserved',
        notes: `${targetHosp.name} confirmed bed hold. 2 units ${multiHoldSession.bloodType} pre-reserved.`,
      },
      createdAt: 'Just now',
      updatedAt: 'Just now',
      timeline: [
        {
          time: 'Just now',
          title: `Bed Confirmed & Held at ${targetHosp.name}`,
          description: `Patient finalized choice from multi-hospital hold. Bed Bay #02 locked.`,
          role: 'Patient Choice System',
        },
        ...(needed
          ? [
              {
                time: 'Just now',
                title: `Ambulance Dispatched: ${withOxygen ? 'With Oxygen (ALS)' : 'Without Oxygen (BLS)'}`,
                description: `Vehicle ${ambData.assignedVehicle} assigned with driver ${ambData.driverName}.`,
                role: 'Emergency Dispatcher',
              },
            ]
          : []),
      ],
    };

    setRequests((prev) => [newReq, ...prev]);
    setActiveRequest(newReq);

    // Sync request and confirmed patient record to backend SQLite
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReq),
    }).catch((err) => console.warn('Backend request sync fallback:', err));

    fetch('/api/patient-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: multiHoldSession.patientName,
        patientAge: 26,
        patientGender: 'Female',
        contactPhone: userSession.phone || '+91 98201 54321',
        relativeName: userSession.relativeName || multiHoldSession.patientName,
        relativePhone: userSession.phone || '+91 98201 54321',
        bloodGroup: multiHoldSession.bloodType,
        injuryType: multiHoldSession.injuryType,
        conditionSeverity: 'critical',
        confirmedHospitalId: targetHosp.id,
        confirmedHospitalName: targetHosp.name,
        confirmedBedType: multiHoldSession.bedType,
        confirmedBedNumber: `${multiHoldSession.bedType.toUpperCase()} Bay #02`,
        admissionStatus: 'confirmed_admitted',
        ambulanceVehicleNumber: ambData.assignedVehicle || 'MH-02-ER-9192',
        notes: `Bed confirmed at ${targetHosp.name} via multi-hospital emergency response.`,
      }),
    })
      .then(() => refreshPatientRecords())
      .catch((err) => console.warn('Failed to record patient confirmation:', err));

    setMultiHoldSession(null); // Close session modal
    setActiveView(needed ? 'ambulance_tracker' : 'track_case');
  };

  // Requirement 2: Trigger Next 3 Hospitals Iteration if none accepted or timeout
  const triggerNextIteration = () => {
    if (!multiHoldSession) return;
    const currentIteration = multiHoldSession.iterationNumber;
    const startIndex = currentIteration * 3;
    const next3 = hospitals.slice(startIndex, startIndex + 3);

    const fallback3 = next3.length >= 3 ? next3 : hospitals.slice(0, 3);
    const bType = multiHoldSession.bloodType;

    const mappedResponses: MultiHoldHospitalResponse[] = fallback3.map((h, idx) => ({
      hospitalId: h.id,
      hospitalName: h.name,
      station: h.station,
      distanceKm: h.stationDistanceKm,
      distanceText: h.stationDistanceText,
      phone: h.phone,
      availableBedsCount: h.beds[multiHoldSession.bedType === 'icu' ? 'icuAvailable' : 'regularAvailable'],
      bloodAvailableUnits: h.bloodBank[bType] || 0,
      status: 'pending',
    }));

    setMultiHoldSession({
      ...multiHoldSession,
      iterationNumber: currentIteration + 1,
      hospitals: mappedResponses,
      hospitalTimerSeconds: 120,
      patientDecisionTimerSeconds: 120,
      phase: 'waiting_hospitals',
    });
  };

  const closeMultiHoldModal = () => {
    setMultiHoldSession(null);
  };

  // Requirement 4: Helper to retrieve nearest 3 hospitals for offline display
  const getNearest3OfflineHospitals = (): Hospital[] => {
    // Return the 3 closest hospitals to the patient's selected station or default Andheri
    const userStn = userSession.selectedStation || selectedStation;
    const matchingStation = hospitals.filter((h) => h.station === userStn);
    if (matchingStation.length >= 3) {
      return matchingStation.slice(0, 3);
    }
    return hospitals.slice(0, 3);
  };

  // Login Handlers
  const loginAsEmergency = () => {
    setUserSession({
      isLoggedIn: true,
      role: 'guest',
      name: 'Emergency Caller',
      phone: '+91 99999 11111',
      selectedStation: 'Andheri',
      patientBloodType: 'O+',
    });
    // Record login into SQL database
    fetch('/api/user-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: 'Emergency 1-Tap Caller',
        phone: '+91 99999 11111',
        role: 'guest',
        station: 'Andheri',
      }),
    })
      .then(() => refreshUserLogs())
      .catch((err) => console.warn('Failed to record emergency user log:', err));

    setActiveView('bed_grid');
  };

  const loginAsPatientRelative = (data: {
    relativeName: string;
    patientName: string;
    phone: string;
    bloodType: BloodGroup;
    station: string;
  }) => {
    setUserSession({
      isLoggedIn: true,
      role: 'patient_relative',
      name: data.patientName || 'Swara Patil',
      relativeName: data.relativeName,
      relativePhone: data.phone,
      phone: data.phone,
      patientBloodType: data.bloodType,
      selectedStation: data.station,
    });
    setPatientBloodType(data.bloodType);
    setSelectedStation(data.station);

    // Record login into SQL database
    fetch('/api/user-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: `${data.patientName} (Relative: ${data.relativeName})`,
        phone: data.phone,
        role: 'patient_relative',
        station: data.station,
      }),
    })
      .then(() => refreshUserLogs())
      .catch((err) => console.warn('Failed to record patient login log:', err));

    // Also register patient profile in database patient_records if not present
    fetch('/api/patient-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: data.patientName || 'Swara Patil',
        patientAge: 26,
        patientGender: 'Female',
        contactPhone: data.phone,
        relativeName: data.relativeName,
        relativePhone: data.phone,
        bloodGroup: data.bloodType,
        injuryType: 'emergency',
        conditionSeverity: 'critical',
        admissionStatus: 'pending_confirmation',
        notes: `Patient entered emergency portal from ${data.station} Station area.`,
      }),
    })
      .then(() => refreshPatientRecords())
      .catch((err) => console.warn('Failed to record patient entry:', err));

    setActiveView('bed_grid');
  };

  const loginAsNurse = (data: { hospitalId: string; staffId: string; nurseName: string }) => {
    const hosp = hospitals.find((h) => h.id === data.hospitalId) || hospitals[0];
    setUserSession({
      isLoggedIn: true,
      role: 'nurse',
      name: data.nurseName || 'Sister Sneha (Senior Triage Nurse)',
      phone: hosp.phone,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      selectedStation: hosp.station,
    });

    // Record login into SQL database
    fetch('/api/user-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: data.nurseName || 'Sister Sneha Kadam',
        phone: hosp.phone,
        role: 'nurse',
        hospitalId: hosp.id,
        hospitalName: hosp.name,
        station: hosp.station,
      }),
    })
      .then(() => refreshUserLogs())
      .catch((err) => console.warn('Failed to record nurse login log:', err));

    setActiveView('nurse_dashboard');
  };

  const loginAsDoctor = (hospitalId: string, doctorId: string) => {
    const hosp = hospitals.find((h) => h.id === hospitalId) || hospitals[0];
    const doc = hosp.doctors.find((d) => d.id === doctorId) || hosp.doctors[0];
    setUserSession({
      isLoggedIn: true,
      role: 'doctor',
      name: doc.name,
      phone: doc.phone,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      selectedStation: hosp.station,
    });

    // Record login into SQL database
    fetch('/api/user-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: doc.name,
        phone: doc.phone,
        role: 'doctor',
        hospitalId: hosp.id,
        hospitalName: hosp.name,
        station: hosp.station,
      }),
    })
      .then(() => refreshUserLogs())
      .catch((err) => console.warn('Failed to record doctor login log:', err));

    setActiveView('nurse_dashboard');
  };

  const loginAsAmbulance = (data: {
    driverId: string;
    driverName: string;
    vehicleNumber: string;
    phone: string;
  }) => {
    setUserSession({
      isLoggedIn: true,
      role: 'ambulance_crew',
      name: data.driverName || 'Ramesh Sawant',
      phone: data.phone || '+91 98700 11223',
      selectedStation: 'Andheri',
    });

    // Record login into SQL database
    fetch('/api/user-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: `${data.driverName} (${data.vehicleNumber})`,
        phone: data.phone || '+91 98700 11223',
        role: 'ambulance_crew',
        station: 'Andheri',
      }),
    })
      .then(() => refreshUserLogs())
      .catch((err) => console.warn('Failed to record ambulance driver login log:', err));

    setActiveView('ambulance_tracker');
  };

  const loginAsAdmin = (adminId?: string) => {
    const adminName = adminId ? `Administrator (${adminId})` : 'System Administrator (HealthTech Ops)';
    setUserSession({
      isLoggedIn: true,
      role: 'admin',
      name: adminName,
      phone: '+91 22 2262 0108',
      selectedStation: 'Andheri',
    });

    // Record login into SQL database
    fetch('/api/user-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: adminName,
        phone: '+91 22 2262 0108',
        role: 'admin',
        station: 'Churchgate',
      }),
    })
      .then(() => refreshUserLogs())
      .catch((err) => console.warn('Failed to record admin login log:', err));

    setActiveView('admin');
  };

  const logout = () => {
    setUserSession({
      isLoggedIn: false,
      role: 'guest',
      name: 'Guest User',
      phone: '',
    });
    setActiveView('login');
  };

  // Location SMS Simulation
  const sendLocationSmsToPatient = () => {
    setLocationAccessSent(true);
    setTimeout(() => {
      setPatientGpsAcquired(true);
      setAcquiredAddress('GPS: 19.1136° N, 72.8697° E (Near Andheri Station East, 0.9 km from Seven Hills)');
    }, 1200);
  };

  const triggerBrowserGps = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPatientGpsAcquired(true);
          setAcquiredAddress(
            `GPS Coordinates: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (Andheri West Sector)`
          );
          setSelectedStation('Andheri');
        },
        () => {
          setPatientGpsAcquired(true);
          setAcquiredAddress('GPS Acquired: Andheri Station Flyover Junction (Simulated)');
          setSelectedStation('Andheri');
        }
      );
    } else {
      setPatientGpsAcquired(true);
      setAcquiredAddress('GPS: Andheri Station Area (1.2 km away)');
      setSelectedStation('Andheri');
    }
  };

  // 10-Second Bed Count Updates
  const updateBedCount = (hospitalId: string, bedKey: keyof Hospital['beds'], delta: number) => {
    // Sync to backend SQLite database
    fetch(`/api/hospitals/${hospitalId}/beds`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedType: bedKey, delta }),
    }).catch((err) => console.warn('Backend bed update fallback:', err));

    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id !== hospitalId) return h;
        const currentVal = h.beds[bedKey];
        const newVal = Math.max(0, currentVal + delta);
        return {
          ...h,
          lastUpdatedMinutesAgo: 0,
          beds: {
            ...h.beds,
            [bedKey]: newVal,
          },
        };
      })
    );
  };

  const updateHospitalBloodBank = (hospitalId: string, bloodGroup: BloodGroup, delta: number) => {
    // Sync to backend SQLite database
    fetch(`/api/hospitals/${hospitalId}/blood`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloodGroup, delta }),
    }).catch((err) => console.warn('Backend blood update fallback:', err));

    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id !== hospitalId) return h;
        const cur = h.bloodBank[bloodGroup] || 0;
        return {
          ...h,
          lastUpdatedMinutesAgo: 0,
          bloodBank: {
            ...h.bloodBank,
            [bloodGroup]: Math.max(0, cur + delta),
          },
        };
      })
    );
  };

  // Create Single Bed Hold Request (2-Minute SLA)
  const createBedHoldRequest = (params: {
    hospitalId: string;
    bedType: BedType;
    needAmbulance: 'yes_hospital' | 'yes_any' | 'own_private' | 'not_needed';
    withOxygen?: boolean;
    privateAmbulanceInfo?: { driverName: string; vehicleNumber: string; driverPhone: string };
  }): string => {
    const targetHospital = hospitals.find((h) => h.id === params.hospitalId) || hospitals[0];
    const newId = `REQ-${targetHospital.name.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const specialist = SPECIALIST_MAPPING[selectedInjuryType];

    let ambInfo = undefined;
    if (params.needAmbulance === 'yes_hospital' || params.needAmbulance === 'yes_any') {
      const availAmb = targetHospital.ambulances[0];
      ambInfo = {
        type: params.needAmbulance === 'yes_hospital' ? ('hospital_deployed' as const) : ('108_city' as const),
        vehicleNumber: availAmb ? availAmb.vehicleNumber : 'MH-02-ER-9192',
        driverName: availAmb ? availAmb.driverName : 'Ramesh Sawant',
        driverPhone: availAmb ? availAmb.driverPhone : '+91 98700 11223',
        currentStage: 'dispatched' as const,
        currentLocationText: `${targetHospital.name} Emergency Bay, navigating to patient`,
        etaMinutes: 6,
        withOxygen: params.withOxygen ?? true,
      };
    } else if (params.needAmbulance === 'own_private' && params.privateAmbulanceInfo) {
      ambInfo = {
        type: 'private_call' as const,
        vehicleNumber: params.privateAmbulanceInfo.vehicleNumber,
        driverName: params.privateAmbulanceInfo.driverName,
        driverPhone: params.privateAmbulanceInfo.driverPhone,
        currentStage: 'in_transit_hospital' as const,
        currentLocationText: 'Private ambulance transporting patient to ER bay',
        etaMinutes: 10,
        withOxygen: params.withOxygen ?? false,
      };
    }

    const bloodReqNeeded = selectedInjuryType === 'blood_loss' || selectedInjuryType === 'road_accident';

    const newReq: EmergencyRequest = {
      id: newId,
      patientName: userSession.name || 'Swara Patil',
      patientAge: 26,
      patientGender: 'Female',
      relativeName: userSession.relativeName || userSession.name,
      relativePhone: userSession.relativePhone || userSession.phone,
      contactPhone: userSession.phone || '+91 98201 54321',
      userRole: userSession.role === 'patient_relative' ? 'patient' : 'good_samaritan',
      station: userSession.selectedStation || selectedStation,
      locationAddress: acquiredAddress || 'Western Express Highway, Mumbai',
      patientBloodType: (patientBloodType === 'all' ? 'O+' : patientBloodType) as BloodGroup,
      injuryType: selectedInjuryType,
      specialistRequired: specialist,
      specialistBooked: false,
      hospitalId: targetHospital.id,
      hospitalName: targetHospital.name,
      bedType: params.bedType,
      allocatedBedNumber: `${params.bedType.toUpperCase()} Bay #03`,
      needAmbulance: params.needAmbulance,
      ambulanceInfo: ambInfo,
      slaRemainingSeconds: 120,
      slaStatus: 'pending_response',
      hospitalBloodRequirement: bloodReqNeeded
        ? {
            required: true,
            unitsNeeded: 2,
            bloodGroup: (patientBloodType === 'all' ? 'O+' : patientBloodType) as BloodGroup,
            status: 'reserved',
            notes: `${targetHospital.name} notified for acute blood loss. 2 units ${patientBloodType} held.`,
          }
        : undefined,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      timeline: [
        {
          time: 'Just now',
          title: 'Bed Hold Request Initiated (120s SLA Countdown)',
          description: `Patient requested ${params.bedType.toUpperCase()} bed at ${targetHospital.name}.`,
          role: userSession.name,
        },
      ],
    };

    // Sync to backend SQLite database
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReq),
    }).catch((err) => console.warn('Backend request sync fallback:', err));

    setRequests((prev) => [newReq, ...prev]);
    setActiveRequest(newReq);
    setActiveView('track_case');
    return newId;
  };

  const acceptBedHold = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          slaStatus: 'accepted_held',
          updatedAt: 'Just now',
          timeline: [
            ...req.timeline,
            {
              time: 'Just now',
              title: '2-Minute SLA: Accepted & Bed Held',
              description: `Nurse confirmed bed availability. ${req.allocatedBedNumber || 'Bed'} locked for patient.`,
              role: userSession.name || 'Nurse Station',
            },
          ],
        };
      })
    );
  };

  const rejectBedHold = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const fallback =
          hospitals.find((h) => h.id !== req.hospitalId && h.beds.icuAvailable > 0)?.name ||
          'Cooper Municipal Hospital';
        return {
          ...req,
          slaStatus: 'rejected_rerouted',
          fallbackHospitalSuggested: fallback,
          updatedAt: 'Just now',
          timeline: [
            ...req.timeline,
            {
              time: 'Just now',
              title: 'Hospital Capacity Full (Immediate Rerouting)',
              description: `Nurse marked bay occupied. Auto-rerouted to alternate facility: ${fallback}.`,
              role: 'Triage System',
            },
          ],
        };
      })
    );
  };

  const requestDoctorAvailability = (hospitalId: string, doctorId: string) => {
    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id !== hospitalId) return h;
        return {
          ...h,
          doctors: h.doctors.map((d) => {
            if (d.id !== doctorId) return d;
            return {
              ...d,
              requestedForCase: true,
              requestStatus: 'pending',
            };
          }),
        };
      })
    );

    if (activeRequest && activeRequest.hospitalId === hospitalId) {
      const doc = hospitals.find((h) => h.id === hospitalId)?.doctors.find((d) => d.id === doctorId);
      if (doc) {
        setActiveRequest({
          ...activeRequest,
          doctorRequested: {
            doctorId: doc.id,
            doctorName: doc.name,
            specialty: doc.specialty,
            status: 'pending',
          },
        });
      }
    }
  };

  const respondDoctorAvailability = (hospitalId: string, doctorId: string, accepted: boolean) => {
    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id !== hospitalId) return h;
        return {
          ...h,
          doctors: h.doctors.map((d) => {
            if (d.id !== doctorId) return d;
            return {
              ...d,
              status: accepted ? 'available' : 'in_surgery',
              requestStatus: accepted ? 'accepted' : 'declined',
            };
          }),
        };
      })
    );

    if (activeRequest && activeRequest.doctorRequested?.doctorId === doctorId) {
      setActiveRequest({
        ...activeRequest,
        doctorRequested: {
          ...activeRequest.doctorRequested,
          status: accepted ? 'accepted' : 'declined',
        },
      });
    }
  };

  const deployHospitalAmbulance = (requestId: string, hospitalId: string, withOxygen?: boolean) => {
    const hosp = hospitals.find((h) => h.id === hospitalId) || hospitals[0];
    const amb = hosp.ambulances[0] || {
      vehicleNumber: 'MH-02-ER-9192',
      driverName: 'Ramesh Sawant',
      driverPhone: '+91 98700 11223',
    };

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          needAmbulance: 'yes_hospital',
          ambulanceInfo: {
            type: 'hospital_deployed',
            vehicleNumber: amb.vehicleNumber,
            driverName: amb.driverName,
            driverPhone: amb.driverPhone,
            currentStage: 'dispatched',
            currentLocationText: `${hosp.name} Emergency Bay, siren on (${withOxygen ? 'With Oxygen' : 'Standard'})`,
            etaMinutes: 5,
            withOxygen: withOxygen ?? true,
          },
          updatedAt: 'Just now',
          timeline: [
            ...req.timeline,
            {
              time: 'Just now',
              title: `Hospital Ambulance Deployed: ${amb.vehicleNumber} (${withOxygen ? 'With Oxygen' : 'Without Oxygen'})`,
              description: `Piloted by ${amb.driverName} (${amb.driverPhone}).`,
              role: 'Hospital Nurse Desk',
            },
          ],
        };
      })
    );
  };

  const updateAmbulanceStage = (
    requestId: string,
    stage: 'dispatched' | 'en_route_pickup' | 'arrived_scene' | 'in_transit_hospital' | 'arrived_hospital',
    locationText: string,
    etaMinutes: number
  ) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId || !req.ambulanceInfo) return req;
        const stageTitles = {
          dispatched: 'Ambulance Dispatched',
          en_route_pickup: 'Ambulance En Route to Patient',
          arrived_scene: 'Ambulance Arrived at Scene / Patient Picked Up',
          in_transit_hospital: 'Ambulance in Transit to Hospital ER Bay',
          arrived_hospital: 'Ambulance Arrived at Hospital ER Bay',
        };

        return {
          ...req,
          ambulanceInfo: {
            ...req.ambulanceInfo,
            currentStage: stage,
            currentLocationText: locationText,
            etaMinutes,
          },
          updatedAt: 'Just now',
          timeline: [
            ...req.timeline,
            {
              time: 'Just now',
              title: stageTitles[stage],
              description: `Current location: ${locationText}. ETA: ${etaMinutes} mins.`,
              role: 'GPS Ambulance Telemetry',
            },
          ],
        };
      })
    );
  };

  const resetAllData = () => {
    localStorage.removeItem('bedlink_western_hospitals_v3');
    setHospitals(INITIAL_WESTERN_HOSPITALS);
    setMultiHoldSession(null);
    setActiveView('login');
  };

  return (
    <EmergencyContext.Provider
      value={{
        language,
        setLanguage,
        t,
        userSession,
        loginAsEmergency,
        loginAsPatientRelative,
        loginAsNurse,
        loginAsDoctor,
        loginAsAmbulance,
        logout,
        canAccessNurse,
        canAccessAmbulanceDriver,
        canAccessAdmin,
        loginAsAdmin,
        addHospital,
        removeHospital,
        refreshFromBackend,
        userLoginLogs,
        patientRecords,
        refreshUserLogs,
        refreshPatientRecords,
        dischargePatientRecord,
        activeView,
        setActiveView,
        locationAccessSent,
        patientGpsAcquired,
        acquiredAddress,
        sendLocationSmsToPatient,
        triggerBrowserGps,
        selectedStation,
        setSelectedStation,
        within2KmOnly,
        setWithin2KmOnly,
        patientBloodType,
        setPatientBloodType,
        selectedInjuryType,
        setSelectedInjuryType,
        selectedBedType,
        setSelectedBedType,
        hospitals,
        updateBedCount,
        updateHospitalBloodBank,
        requests,
        activeRequest,
        setActiveRequest,
        createBedHoldRequest,
        acceptBedHold,
        rejectBedHold,
        multiHoldSession,
        startMultiHoldSession,
        confirmMultiHoldHospital,
        confirmAmbulanceDecision,
        triggerNextIteration,
        closeMultiHoldModal,
        isOffline,
        setIsOffline,
        toggleSimulateOffline,
        getNearest3OfflineHospitals,
        requestDoctorAvailability,
        respondDoctorAvailability,
        deployHospitalAmbulance,
        updateAmbulanceStage,
        resetAllData,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) throw new Error('useEmergency must be used within EmergencyProvider');
  return context;
};
