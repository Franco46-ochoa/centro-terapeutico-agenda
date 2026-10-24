import React from 'react';
import {
  Activity,
  Calendar,
  FileText,
  Sparkles,
  Settings,
  UserPlus,
  Lock,
  ShieldCheck,
  Cloud,
  HardDrive,
  Download,
  LogOut,
  Users,
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
  profesional: 'Profesional Titular',
  admin: 'Administrador de Usuarios',
  recepcion: 'Recepción',
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
  const isAdmin = currentRole === 'admin';
  const isProfesional = currentRole === 'profesional';

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
                  {isAdmin
                    ? 'Panel de Administración de Usuarios y Suscripciones'
                    : 'Centro Terapéutico - Agenda & Evolución'}
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
                      <HardDrive className="w-3 h-3" /> Guardado Activo
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
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-teal-300 font-bold">{ROLE_LABELS[currentRole]}</span>
          </div>

          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {/* Agenda y Pacientes: SOLO para Profesional y Recepción (NO para el Administrador de Usuarios) */}
            {!isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('grid')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    activeTab === 'grid'
                      ? 'bg-teal-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> Agenda
                </button>

                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    activeTab === 'students'
                      ? 'bg-teal-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>
                    {isProfesional
                      ? 'Pacientes / Historia Clínica'
                      : 'Pacientes y Turnos'}
                  </span>
                  <span className="bg-teal-800 text-teal-200 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {activeStudentsCount}
                  </span>
                </button>
              </>
            )}

            {/* Informes IA: SOLO para Profesional */}
            {isProfesional && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-teal-600 text-white'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Informes IA
              </button>
            )}

            {/* Configuración / Mi Cuenta / Gestión de Usuarios */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {isAdmin ? (
                <>
                  <Users className="w-4 h-4" />
                  <span>Usuarios y Suscripciones</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span className="hidden md:inline">
                    {currentRole === 'recepcion' ? 'Mi Cuenta' : 'Mi Cuenta / Horarios'}
                  </span>
                </>
              )}
            </button>

            {/* Botón Nuevo Paciente: SOLO para Profesional y Recepción (NO para Admin de Usuarios) */}
            {!isAdmin && (
              <button
                onClick={onOpenNewStudentModal}
                className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold px-3 py-2 rounded-lg text-xs sm:text-sm transition shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Paciente</span>
              </button>
            )}

            {canInstallPwa && (
              <button
                onClick={onInstallPwa}
                title="Instalar como aplicación en PC o Celular"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-2 rounded-lg text-xs transition shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Instalar App</span>
              </button>
            )}

            <button
              onClick={onLockScreen}
              title="Bloquear pantalla (Ctrl + L)"
              className="hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onSignOut}
              title="Cerrar sesión / Cambiar de usuario"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-medium transition cursor-pointer"
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
