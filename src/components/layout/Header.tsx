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
  profesional: 'Profesional',
  admin: 'Administrador',
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
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Marca y Usuario Activo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-teal-500 text-slate-900 p-2 rounded-xl shrink-0 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                {isAdmin
                  ? 'Panel de Suscripciones y Usuarios'
                  : 'Centro Terapéutico'}
              </h1>
              <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-teal-300 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
                {ROLE_LABELS[currentRole]}
              </span>
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                  isCloudConnected
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-slate-800/80 text-amber-300 border-slate-700'
                }`}
              >
                {isCloudConnected ? (
                  <>
                    <Cloud className="w-3 h-3" /> Nube
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3 h-3" /> Guardado Activo
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {currentUserName}
            </p>
          </div>
        </div>

        {/* Pestañas de Navegación Limpias (Sin barra de scroll fea) */}
        <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto justify-start xl:justify-end">
          {/* Contenedor tipo barra segmentada para las vistas principales */}
          {!isAdmin ? (
            <div className="flex flex-wrap items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 gap-1">
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'grid'
                    ? 'bg-teal-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'students'
                    ? 'bg-teal-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pacientes</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === 'students'
                      ? 'bg-slate-900 text-teal-300'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {activeStudentsCount}
                </span>
              </button>

              {isProfesional && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-teal-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Informes IA</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-teal-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configuración</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-500 text-slate-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Usuarios y Suscripciones</span>
              </button>
            </div>
          )}

          {/* Botones de Acción Derecha */}
          <div className="flex items-center gap-1.5 ml-auto xl:ml-1">
            {!isAdmin && (
              <button
                onClick={onOpenNewStudentModal}
                className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo Paciente</span>
              </button>
            )}

            {canInstallPwa && (
              <button
                onClick={onInstallPwa}
                title="Instalar como aplicación en PC o Celular"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instalar</span>
              </button>
            )}

            <button
              onClick={onLockScreen}
              title="Bloquear pantalla (Ctrl + L)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              onClick={onSignOut}
              title="Cerrar sesión / Cambiar de usuario"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-semibold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
