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
  UserPlus,
  Trash2,
  Users,
} from 'lucide-react';
import type {
  AppRole,
  AuditLogItem,
  ScheduleConfig,
  TimeSlotItem,
} from '../../types/clinical';
import type { StaffMember } from '../../hooks/useAuth';

interface CenterSettingsProps {
  scheduleConfig: ScheduleConfig;
  onChangeScheduleConfig: (cfg: ScheduleConfig) => void;
  timeSlots: TimeSlotItem[];
  currentRole: AppRole;
  currentUserId: string;
  auditLogs: AuditLogItem[];
  onOpenBackupModal: () => void;
  staffMembers: StaffMember[];
  onAddStaffMember: (member: {
    fullName: string;
    specialtyOrLicense: string;
    role: AppRole;
    password: string;
  }) => StaffMember | null;
  onUpdateStaffPassword: (staffId: string, newPass: string) => boolean;
  onRemoveStaffMember: (staffId: string) => boolean;
}

const ROLE_BADGE_MAP: Record<AppRole, { label: string; style: string }> = {
  profesional: {
    label: 'Profesional / Terapeuta',
    style: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  admin: {
    label: 'Dirección / Admin',
    style: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  recepcion: {
    label: 'Recepción / Secretaría',
    style: 'bg-amber-100 text-amber-800 border-amber-300',
  },
};

export const CenterSettings: React.FC<CenterSettingsProps> = ({
  scheduleConfig,
  onChangeScheduleConfig,
  timeSlots,
  currentRole,
  currentUserId,
  auditLogs,
  onOpenBackupModal,
  staffMembers,
  onAddStaffMember,
  onUpdateStaffPassword,
  onRemoveStaffMember,
}) => {
  const isAdmin = currentRole === 'admin';

  // Estado para Agregar Nuevo Personal
  const [newFullName, setNewFullName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('profesional');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffStatusMsg, setStaffStatusMsg] = useState<string | null>(null);

  // Estado para Cambiar Contraseña de un Usuario Existente
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staffMembers[0]?.id || ''
  );
  const [updatedPassword, setUpdatedPassword] = useState('');

  const showTemporaryMessage = (msg: string) => {
    setStaffStatusMsg(msg);
    setTimeout(() => setStaffStatusMsg(null), 4000);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const created = onAddStaffMember({
      fullName: newFullName,
      specialtyOrLicense: newSpecialty,
      role: newRole,
      password: newStaffPassword,
    });
    if (created) {
      setNewFullName('');
      setNewSpecialty('');
      setNewStaffPassword('');
      setSelectedStaffId(created.id);
      showTemporaryMessage(
        `Personal agregado: ${created.fullName} (${ROLE_BADGE_MAP[created.role].label}).`
      );
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    if (onUpdateStaffPassword(selectedStaffId, updatedPassword)) {
      const target = staffMembers.find((s) => s.id === selectedStaffId);
      setUpdatedPassword('');
      showTemporaryMessage(
        `Contraseña de ${target?.fullName || 'usuario'} actualizada correctamente.`
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. PARÁMETROS DEL HORARIO Y AGENDA */}
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

      {/* 2. GESTIÓN DE PERSONAL Y CONTRASEÑAS INDIVIDUALES (EXCLUSIVO DIRECCIÓN / ADMIN) */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Gestión de Personal y Contraseñas ({staffMembers.length} integrantes)
                </h3>
                <p className="text-xs text-slate-500">
                  Agregue profesionales, recepcionistas o directivos con su propia clave y
                  matrícula para firmar en la Historia Clínica.
                </p>
              </div>
            </div>
          </div>

          {staffStatusMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{staffStatusMsg}</span>
            </div>
          )}

          {/* Formulario para Agregar Nuevo Integrante del Personal */}
          <form
            onSubmit={handleCreateStaff}
            className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-teal-600" />
              <span>Agregar Nuevo Integrante al Equipo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Carla Gómez"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Especialidad / Matrícula / Cargo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fonoaudiología • M.N. 7412"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Área / Nivel de Acceso
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AppRole)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="profesional">Profesional (Acceso Clínico)</option>
                  <option value="recepcion">Recepción (Solo Turnos/Faltas)</option>
                  <option value="admin">Dirección / Admin (Acceso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Contraseña Asignada
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  placeholder="Ej: carla2026"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Guardar Nuevo Personal</span>
              </button>
            </div>
          </form>

          {/* Listado del Personal Registrado */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Personal Activo y Claves de Ingreso
            </h4>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
              {staffMembers.map((member) => {
                const badge = ROLE_BADGE_MAP[member.role];
                const isSelf = member.id === currentUserId;
                return (
                  <div
                    key={member.id}
                    className="p-3.5 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {member.fullName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-semibold">
                            Sesión actual
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.specialtyOrLicense}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                        <span className="text-slate-500 mr-1.5">Clave:</span>
                        <code className="font-mono font-bold text-slate-900">
                          {member.password}
                        </code>
                      </div>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Dar de baja a ${member.fullName} del acceso al sistema?`
                              )
                            ) {
                              onRemoveStaffMember(member.id);
                              showTemporaryMessage(
                                `Usuario ${member.fullName} dado de baja.`
                              );
                            }
                          }}
                          title="Dar de baja a este usuario"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cambiar contraseña de cualquier integrante */}
          <form
            onSubmit={handleSavePassword}
            className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <div className="flex items-center gap-1.5 sm:col-span-3 text-xs font-bold uppercase tracking-wider text-slate-600">
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>Cambiar Contraseña de un Usuario Existente</span>
            </div>

            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              {staffMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({ROLE_BADGE_MAP[m.role].label})
                </option>
              ))}
            </select>

            <input
              type="text"
              required
              minLength={4}
              placeholder="Nueva contraseña (mín. 4 caracteres)..."
              value={updatedPassword}
              onChange={(e) => setUpdatedPassword(e.target.value)}
              className="text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />

            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition cursor-pointer"
            >
              Actualizar Clave
            </button>
          </form>
        </div>
      )}

      {/* 3. SECCIÓN DE COPIAS DE SEGURIDAD CIFRADAS Y AUDITORÍA (SOLO ADMIN) */}
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
              El registro de auditoría (`audit_logs`), la gestión de personal y las copias de
              seguridad cifradas están restringidos exclusivamente al rol{' '}
              <strong>Dirección / Admin</strong>.
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
