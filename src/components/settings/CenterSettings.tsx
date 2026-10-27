import React, { useState } from 'react';
import {
  Settings,
  AlertTriangle,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  KeyRound,
  Check,
  UserPlus,
  Trash2,
  Users,
  Power,
  Link2,
  UserCog,
  Save,
} from 'lucide-react';
import type {
  AppRole,
  AuditLogItem,
  ScheduleConfig,
  TimeSlotItem,
} from '../../types/clinical';
import type {
  SessionUser,
  StaffMember,
  SubscriptionStatus,
} from '../../hooks/useAuth';

interface CenterSettingsProps {
  scheduleConfig: ScheduleConfig;
  onChangeScheduleConfig: (cfg: ScheduleConfig) => void;
  timeSlots: TimeSlotItem[];
  currentUser: SessionUser;
  workspaceOwnerName: string;
  auditLogs: AuditLogItem[];
  onOpenBackupModal: () => void;
  onUpdateOwnProfile: (changes: {
    fullName: string;
    specialtyOrLicense: string;
    newPassword?: string;
  }) => { ok: boolean; message: string };
  staffMembers: StaffMember[];
  onAddStaffMember: (member: {
    fullName: string;
    specialtyOrLicense: string;
    role: AppRole;
    password: string;
    linkedProfessionalId?: string;
  }) => StaffMember | null;
  onToggleSubscription: (staffId: string) => SubscriptionStatus | null;
  onUpdateStaffPassword: (staffId: string, newPass: string) => boolean;
  onRemoveStaffMember: (staffId: string) => boolean;
}

const ROLE_BADGE_MAP: Record<AppRole, { label: string; style: string }> = {
  profesional: {
    label: 'Profesional Titular',
    style: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  recepcion: {
    label: 'Recepcionista Vinculada',
    style: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  admin: {
    label: 'Admin de Usuarios',
    style: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
};

export const CenterSettings: React.FC<CenterSettingsProps> = ({
  scheduleConfig,
  onChangeScheduleConfig,
  timeSlots,
  currentUser,
  workspaceOwnerName,
  auditLogs,
  onOpenBackupModal,
  onUpdateOwnProfile,
  staffMembers,
  onAddStaffMember,
  onToggleSubscription,
  onUpdateStaffPassword,
  onRemoveStaffMember,
}) => {
  const currentRole = currentUser.role;
  const isAdmin = currentRole === 'admin';
  const isProfesional = currentRole === 'profesional';

  // Estado para Editar Mi Cuenta Personal (Nombre, Matrícula/Cargo y Contraseña)
  const [myFullName, setMyFullName] = useState(currentUser.rawName);
  const [mySpecialty, setMySpecialty] = useState(currentUser.specialtyOrLicense);
  const [myNewPassword, setMyNewPassword] = useState('');
  const [myProfileMsg, setMyProfileMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const professionals = staffMembers.filter(
    (m) => m.role === 'profesional' && m.active
  );

  // Estado para Agregar Nuevo Usuario (Solo Admin)
  const [newFullName, setNewFullName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('profesional');
  const [linkedProfId, setLinkedProfId] = useState<string>(
    professionals[0]?.id || ''
  );
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffStatusMsg, setStaffStatusMsg] = useState<string | null>(null);

  // Estado para Cambiar Contraseña desde Admin
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staffMembers[0]?.id || ''
  );
  const [updatedPassword, setUpdatedPassword] = useState('');

  const showTemporaryMessage = (msg: string) => {
    setStaffStatusMsg(msg);
    setTimeout(() => setStaffStatusMsg(null), 4000);
  };

  const handleSaveOwnProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onUpdateOwnProfile({
      fullName: myFullName,
      specialtyOrLicense: mySpecialty,
      newPassword: myNewPassword.trim() ? myNewPassword : undefined,
    });
    setMyProfileMsg({ ok: res.ok, text: res.message });
    if (res.ok) {
      setMyNewPassword('');
      setTimeout(() => setMyProfileMsg(null), 4000);
    }
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProfId =
      newRole === 'recepcion'
        ? linkedProfId || professionals[0]?.id
        : undefined;

    const created = onAddStaffMember({
      fullName: newFullName,
      specialtyOrLicense: newSpecialty,
      role: newRole,
      password: newStaffPassword,
      linkedProfessionalId: targetProfId,
    });
    if (created) {
      setNewFullName('');
      setNewSpecialty('');
      setNewStaffPassword('');
      setSelectedStaffId(created.id);
      showTemporaryMessage(
        `Usuario creado: ${created.fullName} (${ROLE_BADGE_MAP[created.role].label}).`
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
      {/* 1. MI CUENTA PERSONAL: CAMBIAR NOMBRE Y CONTRASEÑA (VISIBLE PARA TODOS LOS USUARIOS) */}
      <div className="paper-sheet p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-[3px]">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl text-slate-900">Mi cuenta</h2>
            <p className="text-sm text-slate-500">
              Tu nombre es el que usás para entrar y el que firma los registros.
            </p>
          </div>
        </div>

        {myProfileMsg && (
          <div
            className={`p-3 rounded-[3px] border text-xs flex items-center gap-2 font-medium ${
              myProfileMsg.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{myProfileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveOwnProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre y apellido
              </label>
              <input
                type="text"
                required
                value={myFullName}
                onChange={(e) => setMyFullName(e.target.value)}
                placeholder="Ej: Lic. Valeria Méndez"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Especialidad y matrícula
              </label>
              <input
                type="text"
                disabled={currentRole === 'recepcion'}
                value={mySpecialty}
                onChange={(e) => setMySpecialty(e.target.value)}
                placeholder="Ej: Psicopedagogía • M.N. 4821"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nueva contraseña
              </label>
              <input
                type="password"
                minLength={4}
                value={myNewPassword}
                onChange={(e) => setMyNewPassword(e.target.value)}
                placeholder="Dejalo vacío para no cambiarla"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-[3px] flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar cambios</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. PARÁMETROS DEL HORARIO PERSONAL DEL PROFESIONAL (SOLO PARA EL PROFESIONAL, NO PARA ADMIN) */}
      {isProfesional && (
        <div className="paper-sheet p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-[3px]">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl text-slate-900">Mis horarios de atención</h2>
                <p className="text-sm text-slate-500">
                  Hora de inicio y cierre, duración de cada sesión y si atendés los sábados.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Selector de Modalidad: Jornada Corrida vs Turno Mañana y Turno Tarde */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-teal-50/70 rounded-[4px] border border-teal-200 gap-3">
              <div>
                <span className="font-bold text-slate-900 block text-sm">
                  Horario cortado, mañana y tarde
                </span>
                <span className="text-xs text-slate-600">
                  Un bloque a la mañana y otro a la tarde, con una pausa al mediodía.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(scheduleConfig.splitShifts)}
                onChange={(e) =>
                  onChangeScheduleConfig({
                    ...scheduleConfig,
                    splitShifts: e.target.checked,
                    morningEnabled: scheduleConfig.morningEnabled ?? true,
                    morningStartHour: scheduleConfig.morningStartHour ?? 8,
                    morningEndHour: scheduleConfig.morningEndHour ?? 12,
                    afternoonEnabled: scheduleConfig.afternoonEnabled ?? true,
                    afternoonStartHour: scheduleConfig.afternoonStartHour ?? 14,
                    afternoonEndHour: scheduleConfig.afternoonEndHour ?? 20,
                  })
                }
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-slate-300 cursor-pointer shrink-0"
              />
            </div>

            {!scheduleConfig.splitShifts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Empiezo a atender
                  </label>
                  <select
                    value={scheduleConfig.startHour}
                    onChange={(e) => {
                      const nextStart = parseInt(e.target.value, 10);
                      const nextEnd =
                        scheduleConfig.endHour <= nextStart
                          ? Math.min(23, nextStart + 1)
                          : scheduleConfig.endHour;
                      onChangeScheduleConfig({
                        ...scheduleConfig,
                        startHour: nextStart,
                        endHour: nextEnd,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-[3px] text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}:00 hs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Termino de atender
                  </label>
                  <select
                    value={scheduleConfig.endHour}
                    onChange={(e) => {
                      const nextEnd = parseInt(e.target.value, 10);
                      const nextStart =
                        scheduleConfig.startHour >= nextEnd
                          ? Math.max(7, nextEnd - 1)
                          : scheduleConfig.startHour;
                      onChangeScheduleConfig({
                        ...scheduleConfig,
                        startHour: nextStart,
                        endHour: nextEnd,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-[3px] text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}:00 hs
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bloque Turno Mañana */}
                <div className="p-4 rounded-[4px] bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-950">
                      Turno mañana
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-amber-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleConfig.morningEnabled ?? true}
                        onChange={(e) =>
                          onChangeScheduleConfig({
                            ...scheduleConfig,
                            morningEnabled: e.target.checked,
                          })
                        }
                        className="rounded text-teal-600"
                      />
                      <span>Habilitado</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inicio Mañana
                      </label>
                      <select
                        disabled={!(scheduleConfig.morningEnabled ?? true)}
                        value={scheduleConfig.morningStartHour ?? 8}
                        onChange={(e) => {
                          const start = parseInt(e.target.value, 10);
                          const currentEnd = scheduleConfig.morningEndHour ?? 12;
                          onChangeScheduleConfig({
                            ...scheduleConfig,
                            morningStartHour: start,
                            morningEndHour:
                              currentEnd <= start ? Math.min(23, start + 1) : currentEnd,
                          });
                        }}
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-[3px] outline-none disabled:opacity-50"
                      >
                        {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                          <option key={hour} value={hour}>
                            {hour.toString().padStart(2, '0')}:00 hs
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cierre Mañana
                      </label>
                      <select
                        disabled={!(scheduleConfig.morningEnabled ?? true)}
                        value={scheduleConfig.morningEndHour ?? 12}
                        onChange={(e) => {
                          const end = parseInt(e.target.value, 10);
                          const currentStart = scheduleConfig.morningStartHour ?? 8;
                          onChangeScheduleConfig({
                            ...scheduleConfig,
                            morningStartHour:
                              currentStart >= end ? Math.max(7, end - 1) : currentStart,
                            morningEndHour: end,
                          });
                        }}
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-[3px] outline-none disabled:opacity-50"
                      >
                        {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                          <option key={hour} value={hour}>
                            {hour.toString().padStart(2, '0')}:00 hs
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloque Turno Tarde */}
                <div className="p-4 rounded-[4px] bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-indigo-950">
                      Turno tarde
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-indigo-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleConfig.afternoonEnabled ?? true}
                        onChange={(e) =>
                          onChangeScheduleConfig({
                            ...scheduleConfig,
                            afternoonEnabled: e.target.checked,
                          })
                        }
                        className="rounded text-teal-600"
                      />
                      <span>Habilitado</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inicio Tarde
                      </label>
                      <select
                        disabled={!(scheduleConfig.afternoonEnabled ?? true)}
                        value={scheduleConfig.afternoonStartHour ?? 14}
                        onChange={(e) => {
                          const start = parseInt(e.target.value, 10);
                          const currentEnd = scheduleConfig.afternoonEndHour ?? 20;
                          onChangeScheduleConfig({
                            ...scheduleConfig,
                            afternoonStartHour: start,
                            afternoonEndHour:
                              currentEnd <= start ? Math.min(23, start + 1) : currentEnd,
                          });
                        }}
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-[3px] outline-none disabled:opacity-50"
                      >
                        {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                          <option key={hour} value={hour}>
                            {hour.toString().padStart(2, '0')}:00 hs
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cierre Tarde
                      </label>
                      <select
                        disabled={!(scheduleConfig.afternoonEnabled ?? true)}
                        value={scheduleConfig.afternoonEndHour ?? 20}
                        onChange={(e) => {
                          const end = parseInt(e.target.value, 10);
                          const currentStart = scheduleConfig.afternoonStartHour ?? 14;
                          onChangeScheduleConfig({
                            ...scheduleConfig,
                            afternoonStartHour:
                              currentStart >= end ? Math.max(7, end - 1) : currentStart,
                            afternoonEndHour: end,
                          });
                        }}
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-[3px] outline-none disabled:opacity-50"
                      >
                        {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                          <option key={hour} value={hour}>
                            {hour.toString().padStart(2, '0')}:00 hs
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duración de cada sesión
                </label>
                <select
                  value={scheduleConfig.slotDuration}
                  onChange={(e) =>
                    onChangeScheduleConfig({
                      ...scheduleConfig,
                      slotDuration: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-[3px] text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1 hora)</option>
                  <option value={90}>90 minutos (1 h 30 min)</option>
                  <option value={120}>120 minutos (2 horas)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[3px] border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-800 block text-sm">
                    Atiendo los sábados
                  </span>
                  <span className="text-xs text-slate-500">
                    Agrega la columna del sábado en la agenda.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={scheduleConfig.includeSaturday}
                  onChange={(e) =>
                    onChangeScheduleConfig({
                      ...scheduleConfig,
                      includeSaturday: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-[3px] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong>Nota:</strong> Estos horarios se aplican únicamente a la agenda de{' '}
              <strong>{workspaceOwnerName}</strong> ({timeSlots.length} turnos por día).
            </div>
          </div>
        </div>
      )}

      {/* 3. PANEL COMERCIAL DE SUSCRIPCIONES Y RECEPCIONISTAS VINCULADAS (EXCLUSIVO ADMIN DE USUARIOS) */}
      {isAdmin && (
        <div className="paper-sheet p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-[3px]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl text-slate-900">Usuarios y suscripciones</h3>
                <p className="text-xs text-slate-500">
                  Alta de profesionales y de recepcionistas vinculadas a un profesional.
                </p>
              </div>
            </div>
          </div>

          {staffStatusMsg && (
            <div className="p-3 rounded-[3px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{staffStatusMsg}</span>
            </div>
          )}

          {/* Formulario de Alta Comercial */}
          <form
            onSubmit={handleCreateStaff}
            className="bg-slate-50 p-4 rounded-[4px] border border-slate-200 space-y-3"
          >
            <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-teal-600" />
              <span>Dar de Alta Nuevo Profesional o Recepcionista Vinculada</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tipo de Cuenta a Crear
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AppRole)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-800"
                >
                  <option value="profesional">
                    1. Profesional Titular (Agenda Personal Privada)
                  </option>
                  <option value="recepcion">
                    2. Recepcionista Vinculada a un Profesional
                  </option>
                  <option value="admin">
                    3. Administrador de Usuarios / Suscripciones
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombre y Apellido (Usuario con el que ingresará)
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newRole === 'recepcion'
                      ? 'Ej: Lucía Fernández'
                      : 'Ej: Lic. Carla Gómez'
                  }
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {newRole === 'recepcion' ? (
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Vincular exclusivamente al Profesional:</span>
                  </label>
                  <select
                    value={linkedProfId}
                    onChange={(e) => setLinkedProfId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-amber-50 border border-amber-300 rounded-[3px] outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-amber-950"
                  >
                    {professionals.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.fullName} ({prof.specialtyOrLicense})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Especialidad / Matrícula
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Psicopedagogía • M.N. 7412"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Contraseña Inicial Asignada
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  placeholder="Ej: carla2026"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <span className="text-[11px] text-slate-500">
                Luego el usuario podrá cambiar su propio nombre o contraseña desde su
                pestaña &quot;Mi Cuenta&quot;.
              </span>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-[3px] flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear Cuenta</span>
              </button>
            </div>
          </form>

          {/* Listado de Cuentas y Control de Suscripción Activa / Pausada */}
          <div className="space-y-2">
            <h4 className="text-lg font-serif font-semibold text-slate-800">Cuentas</h4>

            <div className="border border-slate-200 rounded-[4px] divide-y divide-slate-200 overflow-hidden">
              {staffMembers.map((member) => {
                const badge = ROLE_BADGE_MAP[member.role];
                const isSelf = member.id === currentUser.id;
                const isPaused = member.subscriptionStatus === 'pausada';

                return (
                  <div
                    key={member.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPaused ? 'bg-rose-50/40' : 'bg-white hover:bg-slate-50'
                    }`}
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
                        {member.role !== 'admin' && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              isPaused
                                ? 'bg-rose-600 text-white'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {isPaused ? 'Suscripción Pausada' : 'Suscripción Activa'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.specialtyOrLicense}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {member.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = onToggleSubscription(member.id);
                            if (nextState) {
                              showTemporaryMessage(
                                `Suscripción de ${member.fullName}: ${nextState.toUpperCase()}`
                              );
                            }
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-bold border transition cursor-pointer ${
                            isPaused
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isPaused ? 'Reactivar' : 'Pausar Abono'}</span>
                        </button>
                      )}

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar la cuenta de ${member.fullName}?`
                              )
                            ) {
                              onRemoveStaffMember(member.id);
                              showTemporaryMessage(
                                `Usuario ${member.fullName} eliminado.`
                              );
                            }
                          }}
                          title="Eliminar usuario"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[3px] transition cursor-pointer"
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

          {/* Blanquear contraseña de un usuario en caso de olvido */}
          <form
            onSubmit={handleSavePassword}
            className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <div className="flex items-center gap-1.5 sm:col-span-3 text-sm font-semibold text-slate-600">
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>Blanquear Contraseña de un Usuario (en caso de olvido)</span>
            </div>

            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              {staffMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({ROLE_BADGE_MAP[m.role].label})
                </option>
              ))}
            </select>

            <input
              type="password"
              required
              minLength={4}
              placeholder="Nueva contraseña temporal..."
              value={updatedPassword}
              onChange={(e) => setUpdatedPassword(e.target.value)}
              className="text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500"
            />

            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-[3px] transition cursor-pointer"
            >
              Restablecer Clave
            </button>
          </form>
        </div>
      )}

      {/* 4. COPIAS DE SEGURIDAD CIFRADAS (PARA PROFESIONAL) Y AUDITORÍA (PARA ADMIN) */}
      {(isProfesional || isAdmin) && (
        <div className="paper-sheet p-6 space-y-5">
          {isProfesional && (
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-[3px]">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl text-slate-900">Copia de seguridad</h3>
                  <p className="text-xs text-slate-500">
                    Guardá o recuperá todos tus pacientes en un archivo protegido con contraseña.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenBackupModal}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-[3px] transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Guardar o recuperar copia</span>
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Bitácora de Auditoría
                  del Sistema
                </span>
                <span>{auditLogs.length} eventos</span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-[3px] divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
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
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
