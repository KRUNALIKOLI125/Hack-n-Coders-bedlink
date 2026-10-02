import React from 'react';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { BedAvailabilityView } from './components/BedAvailabilityView';
import { NurseDashboardPS } from './components/NurseDashboardPS';
import { AmbulanceTrackerView } from './components/AmbulanceTrackerView';
import { AmbulanceDriverDashboard } from './components/AmbulanceDriverDashboard';
import { MultiHoldConfirmModal } from './components/MultiHoldConfirmModal';
import { OfflineEmergencyModal } from './components/OfflineEmergencyModal';
import { AdministratorView } from './components/AdministratorView';
import { ShieldAlert, Lock, RotateCcw, Truck, Building2, ArrowRight, Database } from 'lucide-react';

const AccessDeniedBanner: React.FC<{ message: string; targetRole: string }> = ({ message, targetRole }) => {
  const { setActiveView, logout } = useEmergency();

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border-2 border-rose-300 shadow-md text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
        <Lock className="w-7 h-7" />
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded">
          Access Restricted
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-2">Authorized {targetRole} Access Only</h2>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setActiveView('bed_grid')}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          Return to Bed Availability
        </button>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          Switch to Staff Login
        </button>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const {
    activeView,
    setActiveView,
    userSession,
    canAccessNurse,
    canAccessAmbulanceDriver,
    canAccessAdmin,
    resetAllData,
    requests,
  } = useEmergency();

  if (activeView === 'login') {
    return (
      <>
        <LoginPage />
        <OfflineEmergencyModal />
      </>
    );
  }

  const activeCase = requests[0];
  const isPatient = userSession.role === 'patient_relative' || userSession.role === 'guest';
  const isDriver = userSession.role === 'ambulance_crew';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Informational notification strip for active case */}
      {activeCase && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-rose-300">Active Western Line Case:</span>
              <span className="text-slate-200">
                <strong>{activeCase.patientName}</strong> ({activeCase.hospitalName}) · Blood Type: {activeCase.patientBloodType} · {activeCase.bedType.toUpperCase()} Bay
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isPatient && (
                <button
                  type="button"
                  onClick={() => setActiveView('track_case')}
                  className="text-xs font-bold text-rose-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Track My Ambulance
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {canAccessNurse && (
                <button
                  type="button"
                  onClick={() => setActiveView('nurse_dashboard')}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-rose-400" />
                  Seven Hills Nurse Desk
                </button>
              )}
              {isDriver && (
                <button
                  type="button"
                  onClick={() => setActiveView('ambulance_tracker')}
                  className="text-xs font-bold text-blue-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Driver Console
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header with Role-Based Navigation */}
      <Header />

      {/* Main View Area with Strict RBAC Guards */}
      <main className="flex-1">
        {activeView === 'bed_grid' && <BedAvailabilityView />}

        {activeView === 'nurse_dashboard' && (
          canAccessNurse ? (
            <NurseDashboardPS />
          ) : (
            <AccessDeniedBanner
              targetRole="Hospital Staff & Nurse"
              message="You are currently signed in as a Patient. The Nurse Triage Station and 10-second bed modification controls are strictly reserved for verified hospital staff."
            />
          )
        )}

        {(activeView === 'ambulance_tracker' || activeView === 'track_case') && (
          isDriver ? (
            <AmbulanceDriverDashboard />
          ) : (
            <AmbulanceTrackerView />
          )
        )}

        {activeView === 'admin' && (
          canAccessAdmin ? (
            <AdministratorView />
          ) : (
            <AccessDeniedBanner
              targetRole="Network Administrator"
              message="You are not authenticated as an Administrator. Access to the Hospital Master Directory, facility creation/deletion, and SQL console is restricted to authorized operations personnel."
            />
          )
        )}
      </main>

      {/* Requirement 2 & 3: Multi-Hospital Hold & Confirm Modal */}
      <MultiHoldConfirmModal />

      {/* Requirement 4: Offline Emergency Modal (Displays 3 Nearest Hospitals with Phone Numbers) */}
      <OfflineEmergencyModal />

      {/* Clean Production Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">BedLink Emergency Network</span>
            <span>·</span>
            <span>Western Railway: Virar ⇄ Churchgate</span>
            <span>·</span>
            <span>Emergency Ambulance Dispatch: 108</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetAllData}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo Records
            </button>
            <span>© 2026 Mumbai Emergency Medical Services</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <EmergencyProvider>
      <MainLayout />
    </EmergencyProvider>
  );
}
