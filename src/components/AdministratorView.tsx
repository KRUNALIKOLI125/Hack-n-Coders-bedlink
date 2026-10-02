import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { WESTERN_LINE_STATIONS } from '../data/westernLineHospitals.ts';
import { Hospital, BedType, BloodGroup, PatientRecord, UserLoginLog } from '../types.ts';
import {
  Building2,
  Plus,
  Trash2,
  Database,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Table,
  Server,
  FileCode,
  Check,
  X,
  Search,
  MapPin,
  Phone,
  Bed,
  Droplet,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users,
  UserCheck,
  HeartPulse,
  Clock,
  LogIn,
  LogOut,
  Eye,
  FileText,
  Stethoscope,
  Truck,
  Activity,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export const AdministratorView: React.FC = () => {
  const {
    hospitals,
    addHospital,
    removeHospital,
    refreshFromBackend,
    requests,
    userLoginLogs,
    patientRecords,
    refreshUserLogs,
    refreshPatientRecords,
    dischargePatientRecord,
  } = useEmergency();

  // Active Admin Sub-Tab: 'patients' is default as requested for patient admission/discharge tracking
  const [activeTab, setActiveTab] = useState<'patients' | 'user_logs' | 'hospitals' | 'sql_console' | 'audit_log'>('patients');

  // Search & Filters for Hospitals
  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('All');

  // Search & Filters for Patient Registry
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState<'all' | 'admitted' | 'discharged'>('all');

  // Search & Filters for User Login Audit Logs
  const [userLogSearch, setUserLogSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Add Hospital Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Delete Confirmation Modal state
  const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Patient Discharge Modal state
  const [patientToDischarge, setPatientToDischarge] = useState<PatientRecord | null>(null);
  const [dischargeSummaryText, setDischargeSummaryText] = useState('');
  const [attendingDoctorInput, setAttendingDoctorInput] = useState('');
  const [isDischarging, setIsDischarging] = useState(false);
  const [dischargeSuccessMessage, setDischargeSuccessMessage] = useState('');

  // Patient Dossier View Modal state
  const [viewingPatient, setViewingPatient] = useState<PatientRecord | null>(null);

  // Add Hospital Form Fields
  const [newName, setNewName] = useState('');
  const [newStation, setNewStation] = useState('Andheri');
  const [newDistanceKm, setNewDistanceKm] = useState('1.2');
  const [newArea, setNewArea] = useState('Andheri East, S.V. Road');
  const [newAddress, setNewAddress] = useState('Near Railway Colony, Andheri, Mumbai 400069');
  const [newPhone, setNewPhone] = useState('+91 22 2820 4000');
  const [newIsFamous, setNewIsFamous] = useState(false);

  // Beds Initial Counts
  const [traumaAvail, setTraumaAvail] = useState(3);
  const [icuAvail, setIcuAvail] = useState(8);
  const [ventilatorAvail, setVentilatorAvail] = useState(4);
  const [oxygenAvail, setOxygenAvail] = useState(15);
  const [burnsAvail, setBurnsAvail] = useState(2);
  const [regularAvail, setRegularAvail] = useState(25);

  // Blood Units
  const [bloodOPos, setBloodOPos] = useState(12);
  const [bloodONeg, setBloodONeg] = useState(4);
  const [bloodAPos, setBloodAPos] = useState(10);
  const [bloodBPos, setBloodBPos] = useState(15);
  const [bloodABPos, setBloodABPos] = useState(6);

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState(
    'SELECT id, patient_name, confirmed_hospital_name, confirmed_bed_number, login_time, confirmation_time, admission_status, discharge_time FROM patient_records ORDER BY login_time DESC LIMIT 10;'
  );
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [selectedSqlTable, setSelectedSqlTable] = useState('patient_records');

  // Stats State
  const [dbStats, setDbStats] = useState<{
    totalHospitals: number;
    totalRequests: number;
    totalUserLogs?: number;
    totalPatients?: number;
    activePatients?: number;
    dischargedPatients?: number;
    icu: { total: number; available: number };
    trauma: { total: number; available: number };
    totalBloodUnits: number;
    dbEngine: string;
    dbFileSizeKb: number;
    schemaFile: string;
  } | null>(null);

  // Fetch live stats from backend
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch admin stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    refreshUserLogs();
    refreshPatientRecords();
  }, [hospitals, requests]);

  // Execute custom SQL in console
  const handleExecuteSql = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    setIsExecutingSql(true);
    setSqlError(null);
    try {
      const res = await fetch('/api/admin/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setSqlResult(data.result);
      } else {
        setSqlError(data.error || 'SQL query failed');
        setSqlResult(null);
      }
    } catch (err: any) {
      setSqlError(err.message || 'Network error executing SQL');
      setSqlResult(null);
    } finally {
      setIsExecutingSql(false);
    }
  };

  // Quick Table Query
  const handleSelectTable = (tbl: string) => {
    setSelectedSqlTable(tbl);
    const q = `SELECT * FROM ${tbl} LIMIT 15;`;
    setSqlQuery(q);
    handleExecuteSql(q);
  };

  // Format Date Helper
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '—', full: '—', relative: '' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return { date: dateStr, time: '', full: dateStr, relative: '' };
      }
      const full = d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // Relative calculation
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.round(diffMs / 60000);
      let relative = '';
      if (diffMins < 1) relative = 'Just now';
      else if (diffMins < 60) relative = `${diffMins}m ago`;
      else if (diffMins < 1440) relative = `${Math.round(diffMins / 60)}h ago`;
      else relative = `${Math.round(diffMins / 1440)}d ago`;

      return { date, time, full, relative };
    } catch {
      return { date: dateStr, time: '', full: dateStr, relative: '' };
    }
  };

  // Handle Add Hospital Submission
  const handleAddHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const dist = parseFloat(newDistanceKm) || 1.0;
      const success = await addHospital({
        name: newName.trim(),
        station: newStation,
        stationDistanceKm: dist,
        stationDistanceText: `${dist} km from ${newStation} Station`,
        area: newArea.trim() || `${newStation} West`,
        address: newAddress.trim() || `${newStation}, Mumbai`,
        phone: newPhone.trim() || '+91 22 2800 0000',
        isFamous: newIsFamous,
        beds: {
          traumaAvailable: traumaAvail,
          traumaTotal: traumaAvail + 4,
          icuAvailable: icuAvail,
          icuTotal: icuAvail + 12,
          ventilatorAvailable: ventilatorAvail,
          ventilatorTotal: ventilatorAvail + 6,
          oxygenAvailable: oxygenAvail,
          oxygenTotal: oxygenAvail + 15,
          burnsAvailable: burnsAvail,
          burnsTotal: burnsAvail + 4,
          regularAvailable: regularAvail,
          regularTotal: regularAvail + 20,
        },
        bloodBank: {
          'O+': bloodOPos,
          'O-': bloodONeg,
          'A+': bloodAPos,
          'A-': 4,
          'B+': bloodBPos,
          'B-': 3,
          'AB+': bloodABPos,
          'AB-': 2,
        },
      });

      if (success) {
        setFormSuccessMessage(`Hospital "${newName}" saved into SQL database successfully!`);
        setTimeout(() => {
          setFormSuccessMessage('');
          setIsAddModalOpen(false);
          setNewName('');
        }, 1200);
        await refreshFromBackend();
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to add hospital:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Hospital
  const confirmDeleteHospital = async () => {
    if (!hospitalToDelete) return;
    setIsDeleting(true);
    try {
      await removeHospital(hospitalToDelete.id);
      setHospitalToDelete(null);
      await refreshFromBackend();
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete hospital:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Patient Discharge
  const handleOpenDischargeModal = (patient: PatientRecord) => {
    setPatientToDischarge(patient);
    setAttendingDoctorInput(patient.attendingDoctor || 'Dr. Emergency Attending Physician');
    setDischargeSummaryText(
      `Patient vitals stabilized. Emergency treatment completed in ${patient.confirmedBedNumber || 'ward'}. Approved for safe discharge with medication review.`
    );
    setDischargeSuccessMessage('');
  };

  const handleConfirmDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToDischarge) return;

    setIsDischarging(true);
    try {
      const ok = await dischargePatientRecord(
        patientToDischarge.id,
        dischargeSummaryText,
        attendingDoctorInput
      );
      if (ok) {
        setDischargeSuccessMessage(`Patient ${patientToDischarge.patientName} discharged and recorded in SQL database!`);
        await refreshPatientRecords();
        await fetchStats();
        setTimeout(() => {
          setPatientToDischarge(null);
          setDischargeSuccessMessage('');
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to discharge patient:', err);
    } finally {
      setIsDischarging(false);
    }
  };

  // Reset database
  const handleResetDb = async () => {
    if (!window.confirm('Reset the SQL database to initial seed data? Custom records will be replaced.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) {
        await refreshFromBackend();
        await refreshUserLogs();
        await refreshPatientRecords();
        await fetchStats();
        alert('SQL Database successfully restored to default Western Line seed records.');
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  // Filtered Patient Records
  const filteredPatients = patientRecords.filter((p) => {
    const query = patientSearch.toLowerCase();
    const matchesSearch =
      p.patientName.toLowerCase().includes(query) ||
      (p.confirmedHospitalName && p.confirmedHospitalName.toLowerCase().includes(query)) ||
      p.contactPhone.includes(query) ||
      p.bloodGroup.toLowerCase().includes(query) ||
      p.injuryType.toLowerCase().includes(query);

    const isAdmitted = p.admissionStatus === 'confirmed_admitted' || p.admissionStatus === 'under_treatment';
    const isDischarged = p.admissionStatus === 'discharged';

    const matchesStatus =
      patientStatusFilter === 'all'
        ? true
        : patientStatusFilter === 'admitted'
        ? isAdmitted
        : isDischarged;

    return matchesSearch && matchesStatus;
  });

  // Filtered User Login Logs
  const filteredUserLogs = userLoginLogs.filter((log) => {
    const query = userLogSearch.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(query) ||
      (log.phone && log.phone.includes(query)) ||
      (log.hospitalName && log.hospitalName.toLowerCase().includes(query)) ||
      (log.station && log.station.toLowerCase().includes(query));

    const matchesRole = userRoleFilter === 'all' || log.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered hospitals list
  const filteredHospitals = hospitals.filter((h) => {
    const matchSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.station.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStation = stationFilter === 'All' || h.station === stationFilter;
    return matchSearch && matchStation;
  });

  const admittedPatientsCount = patientRecords.filter(
    (p) => p.admissionStatus === 'confirmed_admitted' || p.admissionStatus === 'under_treatment'
  ).length;

  const dischargedPatientsCount = patientRecords.filter((p) => p.admissionStatus === 'discharged').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Administrator & SQL Engine Status */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Node.js Backend & SQL Database Administrator Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Patient Admissions, Login Audit & Hospital Database
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time persistent SQLite database records: audit user authentication sessions, track patient intake timestamps, monitor which hospital confirmed their emergency bed, and verify exact discharge dates with clinical summaries.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                refreshFromBackend();
                refreshUserLogs();
                refreshPatientRecords();
                fetchStats();
              }}
              title="Refresh database records"
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync DB</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Hospital</span>
            </button>

            <button
              type="button"
              onClick={handleResetDb}
              title="Reset database to default seed dataset"
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Seed</span>
            </button>
          </div>
        </div>

        {/* Database Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Records</span>
            <span className="text-lg font-black text-white font-mono">{dbStats?.totalPatients || patientRecords.length}</span>
            <span className="text-[10px] text-purple-400 block mt-0.5">Tracked in Database</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Currently Admitted</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {admittedPatientsCount}
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Confirmed in Wards</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Discharged Records</span>
            <span className="text-lg font-black text-blue-400 font-mono">
              {dischargedPatientsCount}
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5">With Clinical Notes</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">User Login Logs</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {dbStats?.totalUserLogs || userLoginLogs.length}
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Audited Sessions</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">SQL Hospitals</span>
            <span className="text-lg font-black text-rose-300 font-mono">
              {dbStats?.totalHospitals || hospitals.length}
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Western Line Grid</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Database Storage</span>
            <span className="text-lg font-black text-purple-300 font-mono">
              {dbStats?.dbFileSizeKb || 88} KB
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5">bedlink.sqlite</span>
          </div>
        </div>
      </div>

      {/* Admin Section Tabs with Rich Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('patients')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'patients'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-purple-600" />
          <span>Patient Admissions & Discharge Registry</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
            {patientRecords.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('user_logs')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'user_logs'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <LogIn className="w-4 h-4 text-blue-600" />
          <span>User Login & Access Audit Logs</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
            {userLoginLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hospitals')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'hospitals'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-rose-600" />
          <span>Hospitals & Beds ({hospitals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('sql_console');
            if (!sqlResult) handleExecuteSql();
          }}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sql_console'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-600" />
          <span>SQL Database Console & Schema</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_log')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'audit_log'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-600" />
          <span>Live SLA Requests ({requests.length})</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: PATIENT ADMISSIONS, CONFIRMATION & DISCHARGE REGISTRY */}
      {/* ============================================================= */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          {/* Top Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient name, phone, confirmed hospital, condition..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Filter Status:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPatientStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    patientStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({patientRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPatientStatusFilter('admitted')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    patientStatusFilter === 'admitted'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Admitted ({admittedPatientsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPatientStatusFilter('discharged')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    patientStatusFilter === 'discharged'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Discharged ({dischargedPatientsCount})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => refreshPatientRecords()}
                className="p-2 text-slate-600 hover:text-purple-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Patient Registry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Patient Registry Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Patient Profile & Contact</th>
                    <th className="px-4 py-3">Login / Intake Time</th>
                    <th className="px-4 py-3">Confirmed Hospital & Bay</th>
                    <th className="px-4 py-3">Confirmation Time</th>
                    <th className="px-4 py-3">Discharge Status & Time</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((pat) => {
                    const loginTime = formatDateTime(pat.loginTime);
                    const confirmTime = formatDateTime(pat.confirmationTime);
                    const dischargeTime = formatDateTime(pat.dischargeTime);
                    const isAdmitted = pat.admissionStatus === 'confirmed_admitted' || pat.admissionStatus === 'under_treatment';
                    const isDischarged = pat.admissionStatus === 'discharged';

                    return (
                      <tr key={pat.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Patient Profile */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {pat.patientName}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded">
                                {pat.bloodGroup}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {pat.patientAge}y · {pat.patientGender}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{pat.contactPhone}</span>
                              {pat.relativeName && (
                                <span className="text-slate-400">· Rel: {pat.relativeName}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {pat.id}
                            </div>
                          </div>
                        </td>

                        {/* 2. When did they Login */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block text-[11px]">
                              {loginTime.full}
                            </span>
                            {loginTime.relative && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                <Clock className="w-2.5 h-2.5" />
                                {loginTime.relative}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Which Hospital they were Confirmed at */}
                        <td className="px-4 py-3.5">
                          {pat.confirmedHospitalName ? (
                            <div className="space-y-1">
                              <span className="font-bold text-slate-900 block text-xs">
                                {pat.confirmedHospitalName}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono font-bold text-[10px] border border-blue-200">
                                <Bed className="w-3 h-3 text-blue-600" />
                                {pat.confirmedBedNumber || `${(pat.confirmedBedType || 'bay').toUpperCase()} Bay`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                              Pending Facility Hold
                            </span>
                          )}
                        </td>

                        {/* 4. When did Hospital Confirm */}
                        <td className="px-4 py-3.5">
                          {pat.confirmationTime ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block text-[11px]">
                                {confirmTime.full}
                              </span>
                              {confirmTime.relative && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Confirmed {confirmTime.relative}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Awaiting response</span>
                          )}
                        </td>

                        {/* 5. When did they Discharge */}
                        <td className="px-4 py-3.5">
                          {isDischarged ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] bg-purple-100 text-purple-800 border border-purple-300">
                                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                Discharged
                              </span>
                              <div className="text-[11px] font-semibold text-slate-800">
                                {dischargeTime.full}
                              </div>
                              {pat.dischargeSummary && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 max-w-xs italic" title={pat.dischargeSummary}>
                                  "{pat.dischargeSummary}"
                                </p>
                              )}
                            </div>
                          ) : isAdmitted ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Admitted / In Care
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Currently Under Active Care
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Triage Phase</span>
                          )}
                        </td>

                        {/* 6. Action Buttons */}
                        <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                          {isAdmitted && (
                            <button
                              type="button"
                              onClick={() => handleOpenDischargeModal(pat)}
                              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Discharge Patient</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewingPatient(pat)}
                            className="px-2 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Dossier</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPatients.length === 0 && (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <HeartPulse className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-xs">No patient records match the selected filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: USER LOGIN & ACCESS AUDIT LOGS */}
      {/* ============================================================= */}
      {activeTab === 'user_logs' && (
        <div className="space-y-4">
          {/* Top Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userLogSearch}
                  onChange={(e) => setUserLogSearch(e.target.value)}
                  placeholder="Search user name, phone, hospital, station..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase">User Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-hidden"
              >
                <option value="all">All Roles ({userLoginLogs.length})</option>
                <option value="nurse">Hospital Nurse</option>
                <option value="patient_relative">Patient / Relative</option>
                <option value="ambulance_crew">Ambulance Pilot (108)</option>
                <option value="doctor">Emergency Doctor</option>
                <option value="admin">Administrator</option>
                <option value="guest">1-Tap Emergency Caller</option>
              </select>

              <button
                type="button"
                onClick={() => refreshUserLogs()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          {/* User Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User & Contact</th>
                    <th className="px-4 py-3">Authenticated Role</th>
                    <th className="px-4 py-3">Facility / Station Assignment</th>
                    <th className="px-4 py-3">Login Timestamp (When did they login)</th>
                    <th className="px-4 py-3">Session Status</th>
                    <th className="px-4 py-3">IP / Client Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUserLogs.map((log) => {
                    const loginTime = formatDateTime(log.loginTimestamp);

                    const roleBadge = () => {
                      switch (log.role) {
                        case 'nurse':
                          return <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">Nurse Station</span>;
                        case 'patient_relative':
                          return <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-rose-100 text-rose-800 border border-rose-300">Patient / Relative</span>;
                        case 'ambulance_crew':
                          return <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-blue-100 text-blue-800 border border-blue-300">Ambulance Pilot</span>;
                        case 'doctor':
                          return <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-teal-100 text-teal-800 border border-teal-300">Specialist Doctor</span>;
                        case 'admin':
                          return <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-purple-100 text-purple-800 border border-purple-300">SQL Administrator</span>;
                        default:
                          return <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-slate-100 text-slate-700">Guest Caller</span>;
                      }
                    };

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block text-xs">
                              {log.userName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {log.phone || 'No phone supplied'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {log.id}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {roleBadge()}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800 block text-[11px]">
                            {log.hospitalName || (log.station ? `${log.station} Sector` : 'Western Line Grid')}
                          </span>
                          {log.station && (
                            <span className="text-[10px] text-slate-400">
                              Nearest: {log.station} Station
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block text-[11px]">
                              {loginTime.full}
                            </span>
                            {loginTime.relative && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                {loginTime.relative}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {log.status === 'active' ? 'Active Session' : log.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-[11px] font-mono text-slate-500">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUserLogs.length === 0 && (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-xs">No login logs match the current search filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: HOSPITALS MANAGEMENT (ADD & DELETE) */}
      {/* ============================================================= */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          {/* Search & Station Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospital name, station, area..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Station:</label>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-hidden"
              >
                <option value="All">All Western Line Stations</option>
                {WESTERN_LINE_STATIONS.filter((s) => !s.includes('All')).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hospital</span>
              </button>
            </div>
          </div>

          {/* Hospitals Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Hospital Facility</th>
                    <th className="px-4 py-3">Station & Distance</th>
                    <th className="px-4 py-3">Available Beds</th>
                    <th className="px-4 py-3">O+ Blood Stock</th>
                    <th className="px-4 py-3">Emergency Contact</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHospitals.map((hosp) => (
                    <tr key={hosp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Building2 className="w-4 h-4 text-rose-600" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block leading-snug">
                              {hosp.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{hosp.area}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 block">{hosp.station} Station</span>
                        <span className="text-[11px] text-slate-500 font-mono">{hosp.stationDistanceKm} km</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-mono font-bold text-[11px]">
                            Trauma: {hosp.beds.traumaAvailable}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-[11px]">
                            ICU: {hosp.beds.icuAvailable}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                            Vent: {hosp.beds.ventilatorAvailable}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {hosp.bloodBank['O+'] || 0} Units
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-slate-800 text-[11px] block">{hosp.phone}</span>
                        <span className="text-[10px] text-emerald-600 font-medium">24/7 Casualty Desk</span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setHospitalToDelete(hosp)}
                          title={`Delete ${hosp.name} from database`}
                          className="px-2.5 py-1.5 text-rose-700 hover:text-white hover:bg-rose-600 rounded-lg transition-colors border border-rose-200 hover:border-rose-600 flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredHospitals.length === 0 && (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-semibold text-xs">No hospitals match your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: LIVE SQL DATABASE CONSOLE & TABLE EXPLORER */}
      {/* ============================================================= */}
      {activeTab === 'sql_console' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">Interactive SQL Terminal & Query Runner</h3>
                <span className="text-[11px] text-slate-400 font-mono">SQLite (bedlink.sqlite)</span>
              </div>

              {/* Quick Table Switcher */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="text-slate-400 text-[11px]">Table:</span>
                {['patient_records', 'user_login_logs', 'hospitals', 'doctors', 'ambulances', 'emergency_requests'].map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => handleSelectTable(tbl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      selectedSqlTable === tbl
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Query Textarea */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Enter SQL statement (e.g. SELECT * FROM patient_records;)"
                className="w-full p-3 bg-slate-950 font-mono text-xs text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Execute native SQLite DDL / DML commands against the active backend.
                </span>

                <button
                  type="button"
                  onClick={() => handleExecuteSql()}
                  disabled={isExecutingSql}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isExecutingSql ? 'Running...' : 'Execute SQL'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {sqlError && (
              <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{sqlError}</span>
              </div>
            )}

            {/* SQL Result Table */}
            {sqlResult && sqlResult.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Query returned <strong>{sqlResult.length} row(s)</strong>:</span>
                </div>

                <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-xl bg-slate-950/90">
                  <table className="w-full text-left font-mono text-[11px] text-slate-300">
                    <thead className="bg-slate-800/90 text-slate-400 border-b border-slate-700 sticky top-0">
                      <tr>
                        {Object.keys(sqlResult[0]).map((col) => (
                          <th key={col} className="px-3 py-2 font-bold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {sqlResult.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/80">
                          {Object.values(row).map((val: any, cidx) => (
                            <td key={cidx} className="px-3 py-2 whitespace-nowrap">
                              {typeof val === 'boolean'
                                ? val ? 'true' : 'false'
                                : typeof val === 'object' && val !== null
                                ? JSON.stringify(val)
                                : String(val ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: EMERGENCY SLA REQUESTS AUDIT LOG */}
      {/* ============================================================= */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live Emergency Requests & SLA Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Audit log of all 2-minute SLA bed bookings, blood reservations, and ambulance deployments.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {requests.length} Records in Database
            </span>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      {req.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{req.patientName}</h4>
                    <span className="text-slate-500 font-semibold">({req.hospitalName})</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    req.slaStatus === 'accepted_held'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : req.slaStatus === 'pending_response'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {req.slaStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 text-[11px] pt-1">
                  <div>Station: <strong>{req.station}</strong></div>
                  <div>Blood Group: <strong className="text-rose-700">{req.patientBloodType}</strong></div>
                  <div>Bed Assigned: <strong>{req.allocatedBedNumber || `${req.bedType.toUpperCase()} Bay`}</strong></div>
                  <div>Ambulance: <strong>{req.ambulanceInfo?.vehicleNumber || 'Private Arrival'}</strong></div>
                </div>

                {req.timeline && req.timeline.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                    Latest Activity: <strong>{req.timeline[req.timeline.length - 1].title}</strong> (
                    {req.timeline[req.timeline.length - 1].time})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: PATIENT DISCHARGE MODAL */}
      {/* ============================================================= */}
      {patientToDischarge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Hospital Patient Discharge Recording</h3>
                  <span className="text-[11px] text-slate-400">Save discharge confirmation to SQL database</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPatientToDischarge(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDischarge} className="p-6 space-y-4 text-xs text-slate-800">
              {dischargeSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{dischargeSuccessMessage}</span>
                </div>
              )}

              {/* Patient Details Summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {patientToDischarge.patientName}
                  </span>
                  <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                    Blood: {patientToDischarge.bloodGroup}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] flex flex-wrap gap-x-3 gap-y-1">
                  <span>Hospital: <strong>{patientToDischarge.confirmedHospitalName || 'Western Line Facility'}</strong></span>
                  <span>Bed: <strong>{patientToDischarge.confirmedBedNumber || 'Active Bay'}</strong></span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  Intake Login: {formatDateTime(patientToDischarge.loginTime).full}
                </div>
              </div>

              {/* Attending Physician */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Attending Physician / Discharging Doctor *
                </label>
                <input
                  type="text"
                  required
                  value={attendingDoctorInput}
                  onChange={(e) => setAttendingDoctorInput(e.target.value)}
                  placeholder="e.g. Dr. Anita Deshmukh (Vascular & Trauma Surgeon)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Clinical Discharge Notes / Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Clinical Discharge Summary & Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={dischargeSummaryText}
                  onChange={(e) => setDischargeSummaryText(e.target.value)}
                  placeholder="Clinical observations, vitals post-stabilization, post-care instructions..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 text-xs"
                />

                {/* Quick Presets */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'Post-cardiac PCI intervention complete. Hemodynamically stable, discharged home.',
                      'Trauma resuscitation & orthopedic stabilization complete. Discharged with cast.',
                      'Mechanical ventilation weaning successful. SpO2 normal on room air, discharged.',
                      'Transferred to general step-down rehabilitation ward in stable condition.',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDischargeSummaryText(preset)}
                        className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        {preset.slice(0, 42)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirmation Notice */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 space-y-0.5">
                <span className="font-bold block">SQL Database Persistence:</span>
                <span>Submitting this form updates <code>discharge_time = datetime('now')</code> and sets <code>admission_status = 'discharged'</code> in the database.</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPatientToDischarge(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDischarging}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isDischarging ? 'Recording Discharge...' : 'Confirm & Save Discharge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: PATIENT DOSSIER VIEW MODAL */}
      {/* ============================================================= */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                <h3 className="font-extrabold text-sm sm:text-base">Patient Medical Lifecycle Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPatient(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              {/* Header Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{viewingPatient.patientName}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">Registry ID: {viewingPatient.id}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-mono font-bold text-rose-800 bg-rose-100 border border-rose-300 text-xs">
                    Blood Group: {viewingPatient.bloodGroup}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                  <div>Age / Gender: <strong>{viewingPatient.patientAge} yrs, {viewingPatient.patientGender}</strong></div>
                  <div>Contact: <strong className="font-mono">{viewingPatient.contactPhone}</strong></div>
                  <div>Relative: <strong>{viewingPatient.relativeName || 'Self Registered'}</strong></div>
                </div>
              </div>

              {/* Complete Chronological Lifecycle Card */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  Chronological Admission & Discharge Lifecycle
                </h5>

                <div className="space-y-2.5 border-l-2 border-slate-200 pl-4 ml-2">
                  {/* Step 1: Login & Intake */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                    <span className="font-bold text-slate-900 text-xs block">1. Patient Login & Emergency Intake</span>
                    <span className="text-slate-600 text-[11px] block">{formatDateTime(viewingPatient.loginTime).full}</span>
                    <span className="text-[10px] text-slate-400">Registered from emergency triage intake form.</span>
                  </div>

                  {/* Step 2: Confirmed Hospital */}
                  <div className="relative pt-1">
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <span className="font-bold text-slate-900 text-xs block">
                      2. Confirmed Hospital: {viewingPatient.confirmedHospitalName || 'Pending'}
                    </span>
                    <span className="text-slate-600 text-[11px] block">
                      Bed: <strong>{viewingPatient.confirmedBedNumber || 'Ward Bay'}</strong> · Confirmed: {formatDateTime(viewingPatient.confirmationTime).full}
                    </span>
                    {viewingPatient.attendingDoctor && (
                      <span className="text-[11px] text-slate-600 block">
                        Attending Doctor: <strong>{viewingPatient.attendingDoctor}</strong>
                      </span>
                    )}
                  </div>

                  {/* Step 3: Discharge */}
                  <div className="relative pt-1">
                    <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      viewingPatient.admissionStatus === 'discharged' ? 'bg-purple-600' : 'bg-amber-400 animate-pulse'
                    }`} />
                    <span className="font-bold text-slate-900 text-xs block">
                      3. Discharge Status: {viewingPatient.admissionStatus === 'discharged' ? 'Discharged' : 'Currently Admitted'}
                    </span>
                    {viewingPatient.admissionStatus === 'discharged' ? (
                      <div className="space-y-1 mt-1 bg-purple-50 p-3 rounded-xl border border-purple-200">
                        <span className="text-purple-900 font-bold block text-[11px]">
                          Discharge Timestamp: {formatDateTime(viewingPatient.dischargeTime).full}
                        </span>
                        {viewingPatient.dischargeSummary && (
                          <p className="text-purple-800 text-[11px] leading-relaxed">
                            <strong>Summary:</strong> {viewingPatient.dischargeSummary}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold inline-block mt-0.5">
                        Patient currently occupying bed in facility
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewingPatient(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: ADD NEW HOSPITAL MODAL */}
      {/* ============================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-extrabold text-base">Add New Hospital Facility to SQL Database</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHospitalSubmit} className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              {formSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  1. Facility Identification & Western Line Location
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hospital Facility Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Holy Family Hospital"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nearest Railway Station *
                    </label>
                    <select
                      value={newStation}
                      onChange={(e) => setNewStation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    >
                      {WESTERN_LINE_STATIONS.filter((s) => !s.includes('All')).map((st) => (
                        <option key={st} value={st}>
                          {st} Station
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Distance from Station (km) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newDistanceKm}
                      onChange={(e) => setNewDistanceKm(e.target.value)}
                      placeholder="e.g. 1.2"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Area / Suburb *
                    </label>
                    <input
                      type="text"
                      required
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      placeholder="e.g. Bandra West, St. Andrew Rd"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      24/7 Emergency Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91 22 2642 1234"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Bed Capacity */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  2. Initial Available Bed Inventory
                </h4>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Trauma Bays</label>
                    <input
                      type="number"
                      min={0}
                      value={traumaAvail}
                      onChange={(e) => setTraumaAvail(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ICU Beds</label>
                    <input
                      type="number"
                      min={0}
                      value={icuAvail}
                      onChange={(e) => setIcuAvail(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ventilators</label>
                    <input
                      type="number"
                      min={0}
                      value={ventilatorAvail}
                      onChange={(e) => setVentilatorAvail(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Oxygen HDU</label>
                    <input
                      type="number"
                      min={0}
                      value={oxygenAvail}
                      onChange={(e) => setOxygenAvail(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Burns Units</label>
                    <input
                      type="number"
                      min={0}
                      value={burnsAvail}
                      onChange={(e) => setBurnsAvail(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Regular Beds</label>
                    <input
                      type="number"
                      min={0}
                      value={regularAvail}
                      onChange={(e) => setRegularAvail(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Blood Bank Stock */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  3. Initial Blood Bank Stock (Units)
                </h4>

                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">O+ Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={bloodOPos}
                      onChange={(e) => setBloodOPos(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-center font-mono font-bold text-rose-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">O- Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={bloodONeg}
                      onChange={(e) => setBloodONeg(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-center font-mono font-bold text-rose-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">A+ Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={bloodAPos}
                      onChange={(e) => setBloodAPos(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-center font-mono font-bold text-rose-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">B+ Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={bloodBPos}
                      onChange={(e) => setBloodBPos(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-center font-mono font-bold text-rose-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">AB+ Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={bloodABPos}
                      onChange={(e) => setBloodABPos(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-center font-mono font-bold text-rose-800"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save Hospital to SQL Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: CONFIRM DELETE HOSPITAL */}
      {/* ============================================================= */}
      {hospitalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Delete Hospital Record?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to permanently delete <strong>{hospitalToDelete.name}</strong> ({hospitalToDelete.station}) from the SQL database?
              </p>
              <p className="text-[11px] text-rose-600 mt-2 bg-rose-50 p-2 rounded-xl border border-rose-200">
                This will also cascade delete all linked doctor schedules and ambulance dispatch records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHospitalToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteHospital}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete from SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
