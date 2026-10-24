import React, { useState } from 'react';
import {
  Activity,
  Lock,
  ShieldCheck,
  UserCheck,
  Building2,
  ClipboardList,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import type { AppRole } from '../../types/clinical';

interface LoginViewProps {
  onLogin: (role: AppRole, password: string) => boolean;
}

const ROLE_CARDS: Array<{
  role: AppRole;
  title: string;
  subtitle: string;
  accessSummary: string;
  icon: React.FC<{ className?: string }>;
  badgeColor: string;
}> = [
  {
    role: 'profesional',
    title: 'Profesional / Terapeuta',
    subtitle: 'Equipo Clínico e Interdisciplinario',
    accessSummary:
      'Acceso a Agenda, Pacientes, Diagnósticos, Historia Clínica e Informes IA.',
    icon: UserCheck,
    badgeColor: 'border-teal-500 bg-teal-50/70 text-teal-900',
  },
  {
    role: 'admin',
    title: 'Dirección / Admin',
    subtitle: 'Coordinación General del Centro',
    accessSummary:
      'Acceso total: Clínica, Informes IA, Configuración Horaria, Contraseñas, Auditoría y Backups.',
    icon: Building2,
    badgeColor: 'border-indigo-500 bg-indigo-50/70 text-indigo-900',
  },
  {
    role: 'recepcion',
    title: 'Recepción / Secretaría',
    subtitle: 'Gestión Administrativa de Turnos',
    accessSummary:
      'Acceso exclusivo a Agenda de Turnos, Datos de Tutor e Inasistencias (Sin Historia Clínica).',
    icon: ClipboardList,
    badgeColor: 'border-amber-500 bg-amber-50/70 text-amber-900',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>('profesional');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ok = onLogin(selectedRole, password);
    if (!ok) {
      setError(
        'Contraseña incorrecta para el perfil seleccionado. Verifique la clave asignada.'
      );
      return;
    }
    setPassword('');
  };

  const activeCard = ROLE_CARDS.find((c) => c.role === selectedRole)!;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          {/* Encabezado */}
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
            <div className="p-3 bg-teal-500 text-slate-900 rounded-xl shadow-sm shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Centro Terapéutico — Portal de Inicio
              </h1>
              <p className="text-xs text-slate-500">
                Seleccione su área de trabajo e ingrese la contraseña asignada a su rol
              </p>
            </div>
          </div>

          {/* Selector de Área / Rol */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              1. Seleccione su Perfil de Ingreso
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {ROLE_CARDS.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedRole === card.role;
                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(card.role);
                      setError(null);
                    }}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? `${card.badgeColor} shadow-sm ring-2 ring-offset-1 ring-teal-500/40`
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-5 h-5" />
                      {isSelected && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                          Activo
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs">{card.title}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{card.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle de permisos del rol elegido */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">{activeCard.title}: </span>
              <span>{activeCard.accessSummary}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario de Contraseña Asignada */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Contraseña Asignada a {activeCard.title}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Ingrese la contraseña de ${activeCard.title}...`}
                  className="w-full text-sm p-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Ingresar como {activeCard.title}</span>
            </button>
          </form>

          {/* Cuadro informativo de contraseñas iniciales predefinidas */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">
              Contraseñas predefinidas iniciales (modificables desde Dirección / Admin):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1">
                Profesional: <code className="font-bold text-teal-700">profe2026</code>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1">
                Dirección/Admin: <code className="font-bold text-indigo-700">admin2026</code>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1">
                Recepción: <code className="font-bold text-amber-700">recep2026</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-4">
        Control de Acceso Basado en Roles (RBAC) • Ley 25.326 y Ley 26.529
      </p>
    </div>
  );
};
