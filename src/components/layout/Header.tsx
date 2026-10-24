import React from 'react';
import {
  Activity,
  Calendar,
  User,
  Sparkles,
  Settings,
  UserPlus,
  Lock,
  ShieldCheck,
  Cloud,
  HardDrive,
  Download,
  LogOut,
} from 'lucide-react';
import type { AppRole } from '../../types/clinical';

export type ActiveTab = 'grid' | 'students' | 'reports' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeStudentsCount: number;
  currentRole: AppRole;
  currentUserName: string;
  onOpenNewStudentModal: () => void;
  onLockScreen: () => void;
  onSignOut: () => void;
  isCloudConnected: boolean;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
}

const ROLE_LABELS: Record<AppRole, string> = {
  profesional: 'Profesional Clínico',
  admin: 'Dirección / Admin',
  recepcion: 'Recepción (Administrativo)',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeStudentsCount,
  currentRole,
  currentUserName,
  onOpenNewStudentModal,
  onLockScreen,
  onSignOut,
  isCloudConnected,
  canInstallPwa,
  onInstallPwa,
}) => {
  const canViewClinical = currentRole === 'admin' || currentRole === 'profesional';
  const canViewSettings = currentRole === 'admin' || currentRole === 'profesional';

  return (
    <header className="bg-slate-900 text-slate-100 p-3 sm:p-4 sticky top-0 z-30 shadow-md no-print">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center justify-between w-full lg:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 text-slate-900 p-2 rounded-lg shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold tracking-tight">
                  Centro Terapéutico - Agenda &amp; Evolución
                </h1>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isCloudConnected
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-slate-800 text-amber-300 border-slate-700'
                  }`}
                >
                  {isCloudConnected ? (
                    <>
                      <Cloud className="w-3 h-3" /> Nube Realtime
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-3 h-3" /> Modo Local Seguro
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sesión activa: <strong className="text-slate-200">{currentUserName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={onLockScreen}
              title="Bloqueo rápido de pantalla (Ctrl + L)"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-200 border border-slate-700"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={onSignOut}
              title="Cambiar usuario / Salir"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Insignia fija de Rol (No permite cambiar sin contraseña) */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Perfil:</span>
            <span className="text-teal-300 font-bold">{ROLE_LABELS[currentRole]}</span>
          </div>

          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'grid'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" /> Agenda
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'students'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <User className="w-4 h-4" /> Pacientes
              <span className="bg-teal-800 text-teal-200 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {activeStudentsCount}
              </span>
            </button>

            {/* Pestaña Informes IA: Solo visible para Profesional y Dirección/Admin */}
            {canViewClinical && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 ${
                  activeTab === 'reports'
                    ? 'bg-teal-600 text-white'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Informes IA
              </button>
            )}

            {/* Pestaña Configuración: Oculta para Recepción */}
            {canViewSettings && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-teal-600 text-white'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Configuración</span>
              </button>
            )}

            <button
              onClick={onOpenNewStudentModal}
              className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold px-3 py-2 rounded-lg text-xs sm:text-sm transition shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Paciente</span>
            </button>

            {canInstallPwa && (
              <button
                onClick={onInstallPwa}
                title="Instalar como aplicación en PC o Celular"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-2 rounded-lg text-xs transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Instalar App</span>
              </button>
            )}

            <button
              onClick={onLockScreen}
              title="Bloquear pantalla (Ctrl + L)"
              className="hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onSignOut}
              title="Cerrar sesión / Cambiar de usuario"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
