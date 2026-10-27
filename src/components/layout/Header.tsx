import React from 'react';
import {
  Calendar,
  Users,
  BrainCircuit,
  Settings,
  UserPlus,
  Lock,
  LogOut,
  Download,
  Cloud,
  CloudUpload,
  CloudOff,
  type LucideIcon,
} from 'lucide-react';
import type { AppRole } from '../../types/clinical';
import { EcgLogo } from '../ui/EcgLogo';
import { NotificationBell, type AppNotification } from './NotificationBell';

export type ActiveTab = 'grid' | 'students' | 'reports' | 'settings';
export type SyncStatus = 'sincronizado' | 'sincronizando' | 'sin-conexion';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeStudentsCount: number;
  todayAppointmentsCount: number;
  currentRole: AppRole;
  currentUserName: string;
  onOpenNewStudentModal: () => void;
  onLockScreen: () => void;
  onSignOut: () => void;
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  onForceSync: () => void;
  notifications: AppNotification[];
  onSelectNotification: (n: AppNotification) => void;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
}

const SYNC_META: Record<SyncStatus, { icon: LucideIcon; label: string }> = {
  sincronizado: { icon: Cloud, label: 'Datos guardados en la nube' },
  sincronizando: { icon: CloudUpload, label: 'Guardando en la nube…' },
  'sin-conexion': { icon: CloudOff, label: 'Sin conexión: los cambios se guardan en este equipo' },
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  count?: number;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex items-center gap-1.5 px-2.5 pt-1.5 pb-2 text-sm transition cursor-pointer ${
      active ? 'text-white ink-underline' : 'text-[#d9ccb3] hover:text-white'
    }`}
  >
    <Icon className="w-[18px] h-[18px]" strokeWidth={1.6} />
    <span>{label}</span>
    {typeof count === 'number' && (
      <span className="min-w-5 h-5 px-1.5 rounded-full bg-white/10 text-[11px] leading-5 text-center text-[#f1e8d6]">
        {count}
      </span>
    )}
  </button>
);

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeStudentsCount,
  todayAppointmentsCount,
  currentRole,
  currentUserName,
  onOpenNewStudentModal,
  onLockScreen,
  onSignOut,
  syncStatus,
  lastSyncAt,
  onForceSync,
  notifications,
  onSelectNotification,
  canInstallPwa,
  onInstallPwa,
}) => {
  const isAdmin = currentRole === 'admin';
  const isProfesional = currentRole === 'profesional';
  const sync = SYNC_META[syncStatus];
  const SyncIcon = sync.icon;
  const syncTitle = lastSyncAt
    ? `${sync.label}. Última sincronización: ${lastSyncAt.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })}. Tocá para sincronizar ahora.`
    : `${sync.label}. Tocá para sincronizar ahora.`;

  return (
    <header className="bg-slate-900 text-[#f1e8d6] sticky top-0 z-30 shadow-[0_2px_0_rgba(0,0,0,0.25)] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {/* Marca */}
        <div className="flex items-center gap-3 min-w-0">
          <EcgLogo className="w-14 h-8 text-[#c9a978] shrink-0" />
          <div className="min-w-0 leading-tight">
            <div className="brand-wordmark text-xl sm:text-2xl text-[#f3ead8] truncate">
              {isAdmin ? 'Administración' : 'Centro Terapéutico'}
            </div>
            <div className="text-xs text-[#b9a98d] truncate">{currentUserName}</div>
          </div>
        </div>

        {/* Navegación y acciones */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {!isAdmin && (
            <NotificationBell
              notifications={notifications}
              onSelect={onSelectNotification}
            />
          )}

          <button
            type="button"
            onClick={onForceSync}
            title={syncTitle}
            aria-label={syncTitle}
            className={`p-2 rounded-md hover:bg-white/5 transition cursor-pointer ${
              syncStatus === 'sin-conexion'
                ? 'text-rose-300'
                : syncStatus === 'sincronizando'
                  ? 'text-amber-200'
                  : 'text-[#e9dfcb] hover:text-white'
            }`}
          >
            <SyncIcon className="w-5 h-5" strokeWidth={1.6} />
          </button>

          <nav className="flex flex-wrap items-center" aria-label="Secciones">
            {isAdmin ? (
              <NavItem
                active
                onClick={() => setActiveTab('settings')}
                icon={Users}
                label="Usuarios y suscripciones"
              />
            ) : (
              <>
                <NavItem
                  active={activeTab === 'grid'}
                  onClick={() => setActiveTab('grid')}
                  icon={Calendar}
                  label="Agenda"
                  count={todayAppointmentsCount}
                />
                <NavItem
                  active={activeTab === 'students'}
                  onClick={() => setActiveTab('students')}
                  icon={Users}
                  label="Pacientes"
                  count={activeStudentsCount}
                />
                {isProfesional && (
                  <NavItem
                    active={activeTab === 'reports'}
                    onClick={() => setActiveTab('reports')}
                    icon={BrainCircuit}
                    label="Informes IA"
                  />
                )}
                <NavItem
                  active={activeTab === 'settings'}
                  onClick={() => setActiveTab('settings')}
                  icon={Settings}
                  label="Configuración"
                />
              </>
            )}
          </nav>

          {!isAdmin && (
            <button
              type="button"
              onClick={onOpenNewStudentModal}
              className="ml-1 flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-slate-900 bg-[#f1e6cf] hover:bg-[#f8efdc] border border-[#d8c49c] rounded-[3px_6px_4px_5px] shadow-[0_2px_0_rgba(0,0,0,0.25)] transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" strokeWidth={1.8} />
              <span>Nuevo paciente</span>
            </button>
          )}

          {canInstallPwa && (
            <button
              type="button"
              onClick={onInstallPwa}
              title="Instalar la app en este equipo"
              aria-label="Instalar la app en este equipo"
              className="p-2 rounded-md text-[#e9dfcb] hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <Download className="w-5 h-5" strokeWidth={1.6} />
            </button>
          )}

          <button
            type="button"
            onClick={onLockScreen}
            title="Bloquear pantalla (Ctrl + L)"
            aria-label="Bloquear pantalla"
            className="p-2 rounded-md text-[#e9dfcb] hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <Lock className="w-5 h-5" strokeWidth={1.6} />
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title="Salir"
            aria-label="Salir"
            className="p-2 rounded-md text-[#e9dfcb] hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </header>
  );
};
