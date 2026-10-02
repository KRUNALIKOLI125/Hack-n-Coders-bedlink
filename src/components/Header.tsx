import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { LANGUAGES } from '../data/translations';
import { Globe2, LogOut, Building2, Truck, HeartHandshake, ShieldAlert, WifiOff, Wifi, Database } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    userSession,
    logout,
    language,
    setLanguage,
    isOffline,
    toggleSimulateOffline,
  } = useEmergency();

  const isPatientOrGuest = userSession.role === 'patient_relative' || userSession.role === 'guest';
  const isNurseOrDoctor = userSession.role === 'nurse' || userSession.role === 'doctor';
  const isAmbulanceCrew = userSession.role === 'ambulance_crew';
  const isAdmin = userSession.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView(isAdmin ? 'admin' : isNurseOrDoctor ? 'nurse_dashboard' : isAmbulanceCrew ? 'ambulance_tracker' : 'bed_grid')}
              className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              BedLink
            </button>
            <span className="hidden md:inline text-xs text-slate-400 font-medium">
              Western Line Emergency Grid
            </span>
          </div>

          {/* Zone 2: Role-Restricted Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-3 text-xs font-semibold">
            {/* Administrator: Hospital Master Directory & SQL Console */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('admin')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'admin'
                      ? 'text-rose-700 bg-rose-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hospital Directory (SQL)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('bed_grid')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeView === 'bed_grid'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Public Bed Radar
                </button>
              </>
            )}

            {/* Patients and Guests: ONLY Bed Grid and Read-Only Case Tracker */}
            {isPatientOrGuest && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('bed_grid')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeView === 'bed_grid'
                      ? 'text-rose-700 bg-rose-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bed Availability
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('track_case')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeView === 'track_case' || activeView === 'ambulance_tracker'
                      ? 'text-rose-700 bg-rose-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Emergency Tracker
                </button>
              </>
            )}

            {/* Hospital Nurses & Doctors: Nurse Dashboard & Network Grid */}
            {isNurseOrDoctor && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('nurse_dashboard')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeView === 'nurse_dashboard'
                      ? 'text-emerald-800 bg-emerald-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nurse Triage Station (10s SLA)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('bed_grid')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeView === 'bed_grid'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Network Bed Grid
                </button>
              </>
            )}

            {/* Ambulance Drivers: Dedicated Driver Console & ER Porticos */}
            {isAmbulanceCrew && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('ambulance_tracker')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeView === 'ambulance_tracker'
                      ? 'text-blue-800 bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ambulance Driver Console
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('bed_grid')}
                  className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    activeView === 'bed_grid'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hospital ER Ramps
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Offline Mode Toggle, Language, and Session Actions */}
          <div className="flex items-center gap-2">
            {/* Offline Test Toggle / Status */}
            <button
              type="button"
              onClick={toggleSimulateOffline}
              title={isOffline ? 'Offline Mode Active. Click to simulate Online.' : 'Simulate Offline Mode (3 Nearby Hospital Fallback)'}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isOffline
                  ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Offline Mode Active</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline text-[11px]">Online</span>
                </>
              )}
            </button>

            {/* Quick Language Dropdown */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                aria-label="Select Language"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Authenticated User Status Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right text-xs">
                <span className="font-bold text-slate-900 block leading-tight">
                  {userSession.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 capitalize">
                  {userSession.role === 'admin'
                    ? 'SQL Administrator'
                    : userSession.role === 'nurse'
                    ? `${userSession.hospitalName || 'Seven Hills'} · Nurse`
                    : userSession.role === 'ambulance_crew'
                    ? '108 Ambulance Pilot'
                    : 'Patient / Relative'}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Log out and switch role"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
