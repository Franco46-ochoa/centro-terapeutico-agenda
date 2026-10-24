import React, { useState } from 'react';
import {
  Settings,
  AlertTriangle,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  Lock,
  KeyRound,
  Check,
} from 'lucide-react';
import type {
  AppRole,
  AuditLogItem,
  ScheduleConfig,
  TimeSlotItem,
} from '../../types/clinical';

interface CenterSettingsProps {
  scheduleConfig: ScheduleConfig;
  onChangeScheduleConfig: (cfg: ScheduleConfig) => void;
  timeSlots: TimeSlotItem[];
  currentRole: AppRole;
  auditLogs: AuditLogItem[];
  onOpenBackupModal: () => void;
  rolePasswords?: Record<AppRole, string>;
  onUpdateRolePassword?: (role: AppRole, newPass: string) => boolean;
}

export const CenterSettings: React.FC<CenterSettingsProps> = ({
  scheduleConfig,
  onChangeScheduleConfig,
  timeSlots,
  currentRole,
  auditLogs,
  onOpenBackupModal,
  rolePasswords,
  onUpdateRolePassword,
}) => {
  const isAdmin = currentRole === 'admin';
  const [targetRole, setTargetRole] = useState<AppRole>('profesional');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSavedMsg, setPasswordSavedMsg] = useState<string | null>(null);

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRolePassword) return;
    if (onUpdateRolePassword(targetRole, newPassword)) {
      setNewPassword('');
      setPasswordSavedMsg(
        `Contraseña del perfil "${targetRole}" actualizada correctamente.`
      );
      setTimeout(() => setPasswordSavedMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Parámetros del Horario y Agenda
              </h2>
              <p className="text-sm text-slate-500">
                Ajuste la hora de inicio, cierre, duración de cada turno y días laborales.
              </p>
            </div>
          </div>

          {!isAdmin && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium">
              <Lock className="w-3.5 h-3.5" /> Solo lectura (Requiere rol Dirección/Admin)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Hora de Inicio Jornada
            </label>
            <select
              disabled={!isAdmin}
              value={scheduleConfig.startHour}
              onChange={(e) =>
                onChangeScheduleConfig({
                  ...scheduleConfig,
                  startHour: parseInt(e.target.value, 10),
                })
              }
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
            >
              {[6, 7, 8, 9, 10].map((hour) => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00 hs
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Hora de Cierre Jornada
            </label>
            <select
              disabled={!isAdmin}
              value={scheduleConfig.endHour}
              onChange={(e) =>
                onChangeScheduleConfig({
                  ...scheduleConfig,
                  endHour: parseInt(e.target.value, 10),
                })
              }
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
            >
              {[15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00 hs
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Duración del Turno / Módulo
            </label>
            <select
              disabled={!isAdmin}
              value={scheduleConfig.slotDuration}
              onChange={(e) =>
                onChangeScheduleConfig({
                  ...scheduleConfig,
                  slotDuration: parseInt(e.target.value, 10),
                })
              }
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
            >
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos (1 hora)</option>
              <option value={90}>90 minutos (1 h 30 min)</option>
              <option value={120}>120 minutos (2 horas)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="font-semibold text-slate-800 block text-sm">
                Incluir día Sábado
              </span>
              <span className="text-xs text-slate-500">
                Muestra u oculta la columna de sábados en la agenda
              </span>
            </div>
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={scheduleConfig.includeSaturday}
              onChange={(e) =>
                onChangeScheduleConfig({
                  ...scheduleConfig,
                  includeSaturday: e.target.checked,
                })
              }
              className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-slate-300 cursor-pointer disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <strong>Nota:</strong> Al modificar la grilla horaria, la vista recalcula de
            inmediato los módulos disponibles ({timeSlots.length} turnos por día configurados
            actualmente). Los turnos agendados previamente se conservan en su horario original.
          </div>
        </div>
      </div>

      {/* GESTIÓN DE CONTRASEÑAS POR ROL (EXCLUSIVO DIRECCIÓN / ADMIN) */}
      {isAdmin && rolePasswords && onUpdateRolePassword && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Contraseñas de Acceso por Perfil
              </h3>
              <p className="text-xs text-slate-500">
                Defina la clave asignada para Profesional, Dirección/Admin y Recepción.
              </p>
            </div>
          </div>

          {passwordSavedMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4" />
              <span>{passwordSavedMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Profesional</div>
              <div className="font-mono font-bold text-teal-700 mt-1">
                {rolePasswords.profesional}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Dirección / Admin</div>
              <div className="font-mono font-bold text-indigo-700 mt-1">
                {rolePasswords.admin}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Recepción</div>
              <div className="font-mono font-bold text-amber-700 mt-1">
                {rolePasswords.recepcion}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSavePassword}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"
          >
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as AppRole)}
              className="text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="profesional">Cambiar clave: Profesional</option>
              <option value="admin">Cambiar clave: Dirección / Admin</option>
              <option value="recepcion">Cambiar clave: Recepción</option>
            </select>

            <input
              type="text"
              required
              minLength={4}
              placeholder="Nueva contraseña (mín. 4 caracteres)..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            />

            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition cursor-pointer"
            >
              Actualizar Contraseña
            </button>
          </form>
        </div>
      )}

      {/* SECCIÓN DE COPIAS DE SEGURIDAD CIFRADAS Y AUDITORÍA (SOLO ADMIN) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Resguardo Cifrado y Registro de Auditoría (Disposición DNPDP 11/2006)
              </h3>
              <p className="text-xs text-slate-500">
                Exportación e importación protegida con AES-GCM 256 bits y trazabilidad de
                accesos.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={onOpenBackupModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar / Importar Backup Cifrado (.enc.json)</span>
            </button>
          )}
        </div>

        {!isAdmin ? (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>
              El registro de auditoría (`audit_logs`) y las copias de seguridad cifradas están
              restringidos exclusivamente al rol <strong>Dirección / Admin</strong>.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Bitácora Inmutable de Auditoría
                Reciente
              </span>
              <span>{auditLogs.length} eventos</span>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
              {auditLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  Sin eventos registrados en esta sesión.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-bold text-slate-800">[{log.action}]</span>{' '}
                      <span className="text-slate-700">{log.target}</span> —{' '}
                      <span className="text-slate-500">{log.details}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0">
                      {log.actorName} ({log.actorRole}) • {log.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
