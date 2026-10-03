import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { LANGUAGES } from '../data/translations';
import { WESTERN_LINE_STATIONS } from '../data/westernLineHospitals';
import { BloodGroup } from '../types';
import {
  ShieldAlert,
  Zap,
  Globe2,
  MapPin,
  Send,
  Droplet,
  CheckCircle2,
  Building2,
  Truck,
  Stethoscope,
  ArrowRight,
  Compass,
  HeartHandshake,
  Lock,
  UserCheck,
  KeyRound,
  IdCard,
  Database,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    loginAsEmergency,
    loginAsPatientRelative,
    loginAsNurse,
    loginAsAmbulance,
    loginAsAdmin,
    locationAccessSent,
    patientGpsAcquired,
    acquiredAddress,
    sendLocationSmsToPatient,
    triggerBrowserGps,
    hospitals,
  } = useEmergency();

  // Active Login Mode Tab: 'patient' | 'nurse' | 'ambulance' | 'admin'
  const [activeLoginTab, setActiveLoginTab] = useState<'patient' | 'nurse' | 'ambulance' | 'admin'>('patient');

  // Patient / Relative Form State
  const [relativeName, setRelativeName] = useState('Aarti Patil');
  const [patientName, setPatientName] = useState('Swara Patil');
  const [patientPhone, setPatientPhone] = useState('+91 98201 54321');
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup>('O+');
  const [selectedStation, setSelectedStation] = useState('Andheri');

  // Nurse Login Form State
  const [selectedHospitalId, setSelectedHospitalId] = useState('seven-hills');
  const [nurseStaffId, setNurseStaffId] = useState('NS-7H-104');
  const [nurseName, setNurseName] = useState('Sister Sneha Kadam');
  const [nursePin, setNursePin] = useState('123456');

  // Ambulance Driver Login Form State
  const [driverBadgeId, setDriverBadgeId] = useState('AMB-108-9192');
  const [driverName, setDriverName] = useState('Ramesh Sawant');
  const [vehicleNumber, setVehicleNumber] = useState('MH-02-ER-9192');
  const [driverPhone, setDriverPhone] = useState('+91 98700 11223');
  const [driverPin, setDriverPin] = useState('7711');

  // Administrator Form State
  const [adminId, setAdminId] = useState('ADM-OPS-01');
  const [adminPin, setAdminPin] = useState('admin123');

  const bloodGroups: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsPatientRelative({
      relativeName: relativeName.trim() || 'Relative',
      patientName: patientName.trim() || 'Swara Patil',
      phone: patientPhone.trim() || '+91 98201 54321',
      bloodType: selectedBlood,
      station: selectedStation,
    });
  };

  const handleNurseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsNurse({
      hospitalId: selectedHospitalId,
      staffId: nurseStaffId.trim() || 'NS-7H-104',
      nurseName: nurseName.trim() || 'Sister Sneha Kadam',
    });
  };

  const handleAmbulanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsAmbulance({
      driverId: driverBadgeId.trim() || 'AMB-108-9192',
      driverName: driverName.trim() || 'Ramesh Sawant',
      vehicleNumber: vehicleNumber.trim() || 'MH-02-ER-9192',
      phone: driverPhone.trim() || '+91 98700 11223',
    });
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsAdmin(adminId.trim() || 'ADM-OPS-01');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between">
      {/* Top Header & Language Bar */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-bold text-slate-900 tracking-tight text-sm">BedLink</span>
            <span className="text-xs text-slate-400 hidden sm:inline">| Western Railway Emergency Network</span>
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span className="text-[11px] text-slate-500 font-medium hidden md:inline">Language:</span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  language === lang.code
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Login Interface Container */}
      <div className="max-w-3xl mx-auto px-4 py-8 w-full space-y-6 flex-1">
        {/* Title & Introduction */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Mumbai Western Line: Virar to Churchgate Critical Hospital Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('appTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            {t('appSubtitle')} · Access-controlled emergency beds, nurse triage, and ambulance dispatch.
          </p>
        </div>

        {/* 1. EMERGENCY 1-TAP LOGIN: DIRECT ACCESS FOR CRITICAL PATIENTS */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-2xl p-5 sm:p-6 text-white shadow-xl shadow-rose-600/15 text-center relative overflow-hidden">
          <div className="max-w-lg mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold">
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              Life-Threatening Emergency? Immediate Direct Access
            </div>
            <h2 className="text-lg sm:text-xl font-bold">1-Tap Emergency Bed Availability Radar</h2>
            <p className="text-xs text-rose-100">
              Zero login friction. Instantly view nearby available ICU beds, trauma bays, and ventilators within 2 km of your location.
            </p>
            <div>
              <button
                type="button"
                onClick={loginAsEmergency}
                className="w-full sm:w-auto px-8 py-3 bg-white text-rose-700 hover:bg-rose-50 font-bold text-sm rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <span>{t('emergencyLogin')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. DEDICATED ROLE LOGIN TABS (PATIENT vs NURSE vs AMBULANCE) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab Selector Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveLoginTab('patient')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeLoginTab === 'patient'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-rose-600" />
              <span>Patient / Relative</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLoginTab('nurse')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeLoginTab === 'nurse'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Hospital Nurse</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLoginTab('ambulance')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeLoginTab === 'ambulance'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Ambulance (108)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLoginTab('admin')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeLoginTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Database className="w-4 h-4 text-purple-600" />
              <span>SQL Administrator</span>
            </button>
          </div>

          {/* TAB 1: PATIENT / RELATIVE PORTAL */}
          {activeLoginTab === 'patient' && (
            <form onSubmit={handlePatientSubmit} className="p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {t('patientRelativeLogin')}
                </h3>
                <p className="text-xs text-slate-500">
                  Register patient details to get blood group-matched hospitals and ambulance tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('relativeName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={relativeName}
                    onChange={(e) => setRelativeName(e.target.value)}
                    placeholder="e.g. Aarti Patil"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('patientName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Swara Patil"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('phone')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+91 98201 54321"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Patient Location SMS & GPS */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    Patient Live GPS Location
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerBrowserGps}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      {t('detectGps')}
                    </button>
                    <button
                      type="button"
                      onClick={sendLocationSmsToPatient}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t('sendLocationSms')}
                    </button>
                  </div>
                </div>

                {locationAccessSent && (
                  <div className="text-xs p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <strong>Location Acquired:</strong> {acquiredAddress}
                    </div>
                  </div>
                )}
              </div>

              {/* Blood Type Selection */}
              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
                    {t('selectBloodType')}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Selected: {selectedBlood}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-xs">
                  {bloodGroups.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedBlood(grp)}
                      className={`py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                        selectedBlood === grp
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nearest Railway Station */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nearest Western Line Railway Station
                </label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                >
                  {WESTERN_LINE_STATIONS.filter((s) => s !== 'All Stations (Virar to Churchgate)').map((st) => (
                    <option key={st} value={st}>
                      {st} Station
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Patient Portal & Find Matched Beds</span>
                <ArrowRight className="w-4 h-4 text-rose-400" />
              </button>
            </form>
          )}

          {/* TAB 2: HOSPITAL NURSE STATION LOGIN */}
          {activeLoginTab === 'nurse' && (
            <form onSubmit={handleNurseSubmit} className="p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Clinical Staff Access
                  </span>
                  <span className="text-xs text-slate-500">Emergency & Triage Wing</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Hospital Nurse & Triage Station Authentication
                </h3>
                <p className="text-xs text-slate-500">
                  Authorized access for 10-second bed updates, 2-minute SLA bed holding, and doctor availability requests.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Your Hospital Facility *
                  </label>
                  <select
                    value={selectedHospitalId}
                    onChange={(e) => setSelectedHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.station} - {h.stationDistanceKm} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nurse Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={nurseName}
                      onChange={(e) => setNurseName(e.target.value)}
                      placeholder="e.g. Sister Sneha Kadam"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hospital Clinical Staff ID *
                    </label>
                    <div className="relative">
                      <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={nurseStaffId}
                        onChange={(e) => setNurseStaffId(e.target.value)}
                        placeholder="e.g. NS-7H-104"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nurse Station Security PIN / Passcode *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={nursePin}
                      onChange={(e) => setNursePin(e.target.value)}
                      placeholder="Enter 6-digit staff PIN"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <span>Demo Staff Credentials Pre-filled: <strong>Sister Sneha (Seven Hills Hospital)</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHospitalId('seven-hills');
                      setNurseName('Sister Sneha Kadam');
                      setNurseStaffId('NS-7H-104');
                      setNursePin('123456');
                    }}
                    className="text-[11px] font-bold text-emerald-700 underline cursor-pointer"
                  >
                    Quick Autofill
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Authenticate & Open Hospital Nurse Station</span>
              </button>
            </form>
          )}

          {/* TAB 3: 108 & HOSPITAL AMBULANCE DRIVER LOGIN */}
          {activeLoginTab === 'ambulance' && (
            <form onSubmit={handleAmbulanceSubmit} className="p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    108 Emergency Dispatch Access
                  </span>
                  <span className="text-xs text-slate-500">Ambulance Pilot Console</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Ambulance Driver & Paramedic Crew Authentication
                </h3>
                <p className="text-xs text-slate-500">
                  Authorized login for live GPS telemetry, navigation to accident scene, and hospital ER ramp handoff.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driver / Pilot Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Ramesh Sawant"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driver Badge ID *
                    </label>
                    <div className="relative">
                      <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={driverBadgeId}
                        onChange={(e) => setDriverBadgeId(e.target.value)}
                        placeholder="e.g. AMB-108-9192"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vehicle Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. MH-02-ER-9192"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driver Contact Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+91 98700 11223"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Driver Dispatch Passcode *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={driverPin}
                      onChange={(e) => setDriverPin(e.target.value)}
                      placeholder="Enter 4-digit driver passcode"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                  <span>Demo Driver Credentials: <strong>Ramesh Sawant (MH-02-ER-9192 ALS)</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setDriverName('Ramesh Sawant');
                      setDriverBadgeId('AMB-108-9192');
                      setVehicleNumber('MH-02-ER-9192');
                      setDriverPhone('+91 98700 11223');
                      setDriverPin('7711');
                    }}
                    className="text-[11px] font-bold text-blue-700 underline cursor-pointer"
                  >
                    Quick Autofill
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Authenticate & Open Ambulance Driver Console</span>
              </button>
            </form>
          )}

          {/* TAB 4: SQL DATABASE ADMINISTRATOR LOGIN */}
          {activeLoginTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    Database Administrator Access
                  </span>
                  <span className="text-xs text-slate-500">Central HealthTech Operations</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Hospital Directory & SQL Database Portal Authentication
                </h3>
                <p className="text-xs text-slate-500">
                  Authorized access for adding or deleting hospital facilities, managing bed capacities, and running SQL database operations.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Administrator Officer ID *
                    </label>
                    <div className="relative">
                      <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        placeholder="e.g. ADM-OPS-01"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Admin Security Passcode *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        placeholder="Enter admin passcode"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                  <span>Demo Admin Credentials: <strong>ADM-OPS-01 (Full SQL Permissions)</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminId('ADM-OPS-01');
                      setAdminPin('admin123');
                    }}
                    className="text-[11px] font-bold text-purple-700 underline cursor-pointer"
                  >
                    Quick Autofill
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4 text-purple-400" />
                <span>Authenticate & Open SQL Administrator Portal</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Clean Production Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        BedLink Emergency Medical Network · Mumbai Metropolitan Region · 24/7 Central Hotline: 108
      </footer>
    </div>
  );
};
