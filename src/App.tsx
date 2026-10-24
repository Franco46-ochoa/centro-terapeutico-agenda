import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ShieldAlert, X, AlertCircle, CalendarDays } from 'lucide-react';
import {
  CONDITIONS,
  DAYS_OF_WEEK,
  INITIAL_STUDENTS,
  getStudentSlots,
  type AppRole,
  type AuditLogItem,
  type ClinicalEntryType,
  type DayOfWeek,
  type ScheduleConfig,
  type StudentPatient,
  type TimeSlotAssignment,
  type TimeSlotItem,
} from './types/clinical';
import { NewStudentSchema, ScheduleConfigSchema } from './schemas/clinical.schema';
import { Header, type ActiveTab } from './components/layout/Header';
import { ScheduleGrid, type SlotMatchItem } from './components/schedule/ScheduleGrid';
import { PatientDirectory } from './components/patients/PatientDirectory';
import { ClinicalDossier } from './components/patients/ClinicalDossier';
import { AiReportGenerator } from './components/reports/AiReportGenerator';
import { CenterSettings } from './components/settings/CenterSettings';
import { EncryptedBackupModal } from './components/settings/EncryptedBackupModal';
import { IdleLockOverlay } from './components/auth/IdleLockOverlay';
import { LoginView } from './components/auth/LoginView';
import {
  useAuth,
  type LoginResult,
  type StaffMember,
  type SubscriptionStatus,
} from './hooks/useAuth';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useRealtimeCenterData } from './hooks/useRealtimeCenterData';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STUDENTS_STORAGE_KEY = 'ct_students_data_v2';
const SCHEDULES_BY_PROF_KEY = 'ct_schedules_by_prof_v2';

const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  startHour: 9,
  endHour: 18,
  slotDuration: 60,
  includeSaturday: false,
};

function loadPersistedStudents(): StudentPatient[] {
  try {
    const raw = window.localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (!raw) return INITIAL_STUDENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STUDENTS;
  } catch {
    return INITIAL_STUDENTS;
  }
}

function loadSchedulesMap(): Record<string, ScheduleConfig> {
  try {
    const raw = window.localStorage.getItem(SCHEDULES_BY_PROF_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export default function App() {
  const {
    user,
    isLocked,
    staffMembers,
    loginWithStaffPassword,
    logout,
    lockSession,
    unlockSession,
    addStaffMember,
    toggleSubscriptionStatus,
    updateStaffPassword,
    removeStaffMember,
  } = useAuth();
  const { isRealtimeConnected } = useRealtimeCenterData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('grid');
  const [students, setStudents] = useState<StudentPatient[]>(() =>
    loadPersistedStudents()
  );
  const [schedulesByProf, setSchedulesByProf] = useState<
    Record<string, ScheduleConfig>
  >(() => loadSchedulesMap());

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // El ID del consultorio activo:
  // - Para un Profesional es su propio ID.
  // - Para una Recepcionista es el ID del Profesional al que fue vinculada.
  const activeWorkspaceId = user?.workspaceOwnerId || 'staff_profe_1';
  const activeWorkspaceName = user?.workspaceOwnerName || 'Mi Consultorio';

  const scheduleConfig: ScheduleConfig = useMemo(() => {
    return schedulesByProf[activeWorkspaceId] || DEFAULT_SCHEDULE_CONFIG;
  }, [schedulesByProf, activeWorkspaceId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [students]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SCHEDULES_BY_PROF_KEY,
        JSON.stringify(schedulesByProf)
      );
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [schedulesByProf]);

  // Sincronización instantánea entre ventanas/pestañas (ej. Profesional y su Recepcionista vinculada)
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === STUDENTS_STORAGE_KEY && e.newValue) {
        try {
          setStudents(JSON.parse(e.newValue));
        } catch {
          // Ignorar JSON corrupto
        }
      } else if (e.key === SCHEDULES_BY_PROF_KEY && e.newValue) {
        try {
          setSchedulesByProf(JSON.parse(e.newValue));
        } catch {
          // Ignorar JSON corrupto
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: 'aud_init',
      timestamp: new Date().toLocaleTimeString('es-AR'),
      actorName: 'Sistema SaaS',
      actorRole: 'admin',
      action: 'SYSTEM_READY',
      target: 'Plataforma de Agendas Personales',
      details: 'Aislamiento estricto por Profesional y Recepcionista vinculada activo.',
    },
  ]);

  // Modales
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: DayOfWeek;
    hour: string;
  } | null>(null);

  const [deferredPwaPrompt, setDeferredPwaPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPwaPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPwaPrompt) return;
    await deferredPwaPrompt.prompt();
    setDeferredPwaPrompt(null);
  };

  const appendAuditLog = useCallback(
    (
      action: string,
      target: string,
      details: string,
      overrideActor?: { name: string; role: AppRole }
    ) => {
      setAuditLogs((prev) => [
        {
          id: 'aud_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toLocaleTimeString('es-AR'),
          actorName: overrideActor?.name ?? user?.fullName ?? 'Usuario',
          actorRole: overrideActor?.role ?? user?.role ?? 'recepcion',
          action,
          target,
          details,
        },
        ...prev,
      ]);
    },
    [user?.fullName, user?.role]
  );

  useIdleTimeout({
    timeoutMs: 10 * 60 * 1000,
    backgroundMobileTimeoutMs: 60 * 1000,
    enabled: Boolean(user),
    onIdle: () => {
      lockSession();
      appendAuditLog(
        'SESSION_LOCKED',
        'Pantalla de Consultorio',
        'Bloqueo preventivo de seguridad'
      );
    },
  });

  // Formulario de Nuevo Paciente (Siempre se crea dentro del consultorio del Profesional activo)
  const [newStudent, setNewStudent] = useState({
    name: '',
    age: '',
    condition: CONDITIONS[0].label as string,
    tutorName: '',
    phone: '',
    consentSigned: false,
    day: '' as DayOfWeek | '',
    hour: '',
  });
  const [newStudentError, setNewStudentError] = useState<string | null>(null);

  const timeSlots = useMemo<TimeSlotItem[]>(() => {
    const slots: TimeSlotItem[] = [];
    const startMins = scheduleConfig.startHour * 60;
    const endMins = scheduleConfig.endHour * 60;
    const duration = scheduleConfig.slotDuration;

    for (let time = startMins; time < endMins; time += duration) {
      const startH = Math.floor(time / 60)
        .toString()
        .padStart(2, '0');
      const startM = (time % 60).toString().padStart(2, '0');
      const endTime = time + duration;
      const endH = Math.floor(endTime / 60)
        .toString()
        .padStart(2, '0');
      const endM = (endTime % 60).toString().padStart(2, '0');

      slots.push({
        id: `${startH}:${startM}`,
        label: `${startH}:${startM} - ${endH}:${endM}`,
      });
    }
    return slots;
  }, [scheduleConfig]);

  const activeDays = useMemo<DayOfWeek[]>(() => {
    return scheduleConfig.includeSaturday
      ? DAYS_OF_WEEK
      : DAYS_OF_WEEK.filter((d) => d !== 'Sábado');
  }, [scheduleConfig.includeSaturday]);

  /**
   * AISLAMIENTO ESTRICTO DE PACIENTES POR PROFESIONAL:
   * - Cada Profesional (y su Recepcionista vinculada) SOLO ve los pacientes donde
   *   `student.professionalId === activeWorkspaceId`.
   * - Nunca ve pacientes ni turnos de otro profesional.
   */
  const workspaceStudents = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') {
      return students;
    }
    return students.filter((s) => s.professionalId === activeWorkspaceId);
  }, [students, user, activeWorkspaceId]);

  const activeStudents = useMemo(
    () => workspaceStudents.filter((s) => !s.archivedAt),
    [workspaceStudents]
  );

  const selectedStudent = useMemo(
    () => workspaceStudents.find((s) => s.id === selectedStudentId),
    [workspaceStudents, selectedStudentId]
  );

  const criticalStudents = useMemo(
    () => activeStudents.filter((s) => s.absences >= 3),
    [activeStudents]
  );

  // Busca todos los turnos asignados en ese día y horario EXCLUSIVAMENTE dentro del consultorio activo
  const getStudentsInSlot = useCallback(
    (day: DayOfWeek, hour: string): SlotMatchItem[] => {
      const matches: SlotMatchItem[] = [];
      for (const student of activeStudents) {
        const studentSlots = getStudentSlots(student);
        for (const sl of studentSlots) {
          if (sl.day === day && sl.hour === hour) {
            matches.push({ student, slotInfo: sl });
          }
        }
      }
      return matches;
    },
    [activeStudents]
  );

  const handleLogin = (staffId: string, passwordInput: string): LoginResult => {
    const res = loginWithStaffPassword(staffId, passwordInput);
    if (res.ok) {
      const loggedMember = res.member;
      // Si entra el Admin de Usuarios, abrir directamente la pestaña de Configuración/Suscripciones
      setActiveTab(loggedMember.role === 'admin' ? 'settings' : 'grid');
      setShowArchived(false);

      const ownerId =
        loggedMember.role === 'recepcion'
          ? loggedMember.linkedProfessionalId || 'staff_profe_1'
          : loggedMember.id;
      const firstPatient = students.find(
        (s) => s.professionalId === ownerId && !s.archivedAt
      );
      setSelectedStudentId(firstPatient?.id ?? null);

      appendAuditLog(
        'LOGIN_SUCCESS',
        loggedMember.fullName,
        `Ingreso autorizado (${loggedMember.specialtyOrLicense})`,
        { name: loggedMember.fullName, role: loggedMember.role }
      );
    } else {
      const target = staffMembers.find((s) => s.id === staffId);
      appendAuditLog(
        'LOGIN_REJECTED',
        target?.fullName || 'Usuario',
        res.message,
        { name: 'Intento bloqueado', role: target?.role || 'recepcion' }
      );
    }
    return res;
  };

  const handleLogout = () => {
    if (user) {
      appendAuditLog('LOGOUT', user.fullName, 'Cierre de sesión manual');
    }
    setActiveTab('grid');
    logout();
  };

  if (!user) {
    return <LoginView staffMembers={staffMembers} onLogin={handleLogin} />;
  }

  const handleAddAbsence = (studentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = workspaceStudents.find((s) => s.id === studentId);
    if (!target) return;

    const today = new Date().toISOString().split('T')[0];
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          absences: s.absences + 1,
          attendanceHistory: [
            {
              id: 'att_' + Date.now(),
              date: today,
              type: 'ausente_injustificado',
              reason: 'Inasistencia registrada en agenda',
              recordedBy: user.fullName,
              createdAt: new Date().toISOString(),
            },
            ...s.attendanceHistory,
          ],
        };
      })
    );
    appendAuditLog(
      'ABSENCE_RECORDED',
      target.name,
      `Inasistencia contabilizada (Total: ${target.absences + 1})`
    );
  };

  const handleResetAbsences = (studentId: string) => {
    const target = workspaceStudents.find((s) => s.id === studentId);
    if (!target) return;
    const today = new Date().toISOString().split('T')[0];

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          absences: 0,
          attendanceHistory: [
            {
              id: 'att_' + Date.now(),
              date: today,
              type: 'reinicio_ciclo',
              reason: 'Reinicio de contador de faltas',
              recordedBy: user.fullName,
              createdAt: new Date().toISOString(),
            },
            ...s.attendanceHistory,
          ],
        };
      })
    );
    appendAuditLog('ABSENCE_RESET', target.name, 'Reinicio de contador de faltas a 0');
  };

  const handleRemoveFromSlot = (
    studentId: string,
    day: DayOfWeek,
    hour: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const target = workspaceStudents.find((s) => s.id === studentId);
    if (!target) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const remaining = getStudentSlots(s).filter(
          (sl) => !(sl.day === day && sl.hour === hour)
        );
        return {
          ...s,
          slots: remaining,
          slot: remaining[0] ?? null,
        };
      })
    );
    appendAuditLog(
      'SLOT_RELEASED',
      target.name,
      `Turno liberado: ${day} ${hour} hs`
    );
  };

  const handleArchiveStudent = (studentId: string, reason: string) => {
    if (user.role === 'recepcion') return;
    const target = workspaceStudents.find((s) => s.id === studentId);
    if (!target) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              slot: null,
              slots: [],
              archivedAt: new Date().toISOString(),
              archiveReason: reason,
            }
          : s
      )
    );
    appendAuditLog('PATIENT_ARCHIVED', target.name, `Motivo: ${reason}`);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setNewStudentError(null);

    const parsed = NewStudentSchema.safeParse({
      name: newStudent.name,
      age: newStudent.age,
      condition: newStudent.condition,
      tutorName: newStudent.tutorName,
      phone: newStudent.phone,
      consentSigned: newStudent.consentSigned,
      day: newStudent.day,
      hour: newStudent.hour,
      professionalId: activeWorkspaceId,
    });

    if (!parsed.success) {
      setNewStudentError(
        parsed.error.issues[0]?.message || 'Verifique los campos ingresados.'
      );
      return;
    }

    const valid = parsed.data;
    const today = new Date().toISOString().split('T')[0];

    const initialSlot: TimeSlotAssignment | null =
      valid.day && valid.hour
        ? {
            day: valid.day as DayOfWeek,
            hour: valid.hour,
            professionalId: activeWorkspaceId,
            professionalName: activeWorkspaceName,
          }
        : null;

    const created: StudentPatient = {
      id: 'p_' + Date.now(),
      name: valid.name,
      age: valid.age,
      condition: valid.condition,
      tutorName: valid.tutorName,
      phone: valid.phone,
      consentSigned: valid.consentSigned,
      consentSignedAt: today,
      absences: 0,
      slot: initialSlot,
      slots: initialSlot ? [initialSlot] : [],
      professionalId: activeWorkspaceId,
      professionalName: activeWorkspaceName,
      archivedAt: null,
      attendanceHistory: [],
      history: [],
    };

    setStudents((prev) => [...prev, created]);
    setSelectedStudentId(created.id);
    appendAuditLog(
      'PATIENT_CREATED',
      created.name,
      `Alta en agenda de ${activeWorkspaceName}`
    );

    setNewStudent({
      name: '',
      age: '',
      condition: CONDITIONS[0].label,
      tutorName: '',
      phone: '',
      consentSigned: false,
      day: '',
      hour: '',
    });
    setIsStudentModalOpen(false);
  };

  const handleAddClinicalEntry = (
    studentId: string,
    entryData: {
      date: string;
      type: ClinicalEntryType;
      title: string;
      content: string;
      amendsEntryId?: string;
    }
  ) => {
    if (user.role === 'recepcion') return;
    const target = workspaceStudents.find((s) => s.id === studentId);
    if (!target) return;

    const createdEntry = {
      id: 'h_' + Date.now(),
      date: entryData.date,
      type: entryData.type,
      title: entryData.title,
      content: entryData.content,
      authorName: user.fullName,
      authorRole: user.role,
      createdAt: new Date().toISOString(),
      amendsEntryId: entryData.amendsEntryId,
    };

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, history: [createdEntry, ...s.history] } : s
      )
    );

    appendAuditLog(
      'CLINICAL_ENTRY_ADDED',
      target.name,
      `[${entryData.type}] ${entryData.title}`
    );
  };

  // Suma el turno a la lista de turnos semanales del paciente dentro de la agenda de este profesional
  const handleAssignToSlot = (studentId: string) => {
    if (!selectedSlot) return;
    const target = workspaceStudents.find((s) => s.id === studentId);
    if (!target) return;

    const newSlotAssignment: TimeSlotAssignment = {
      day: selectedSlot.day,
      hour: selectedSlot.hour,
      professionalId: activeWorkspaceId,
      professionalName: activeWorkspaceName,
    };

    setStudents((prev) =>
      prev.map((s) => {
        if (s.professionalId !== activeWorkspaceId) return s;

        const currentSlots = getStudentSlots(s);

        if (s.id === studentId) {
          const withoutSameDayHour = currentSlots.filter(
            (sl) => !(sl.day === selectedSlot.day && sl.hour === selectedSlot.hour)
          );
          const updatedSlots = [...withoutSameDayHour, newSlotAssignment];
          return {
            ...s,
            slots: updatedSlots,
            slot: updatedSlots[0] ?? null,
          };
        }

        // Si otro paciente del MISMO profesional tenía ese horario, liberar solo ese horario
        const filteredOther = currentSlots.filter(
          (sl) => !(sl.day === selectedSlot.day && sl.hour === selectedSlot.hour)
        );
        if (filteredOther.length !== currentSlots.length) {
          return {
            ...s,
            slots: filteredOther,
            slot: filteredOther[0] ?? null,
          };
        }
        return s;
      })
    );

    appendAuditLog(
      'SLOT_ASSIGNED',
      target.name,
      `Turno asignado: ${selectedSlot.day} ${selectedSlot.hour} hs (${activeWorkspaceName})`
    );
    setIsAssignModalOpen(false);
    setSelectedSlot(null);
  };

  const handleSaveAiReportToHistory = (
    studentId: string,
    reportTitle: string,
    content: string
  ) => {
    handleAddClinicalEntry(studentId, {
      date: new Date().toISOString().split('T')[0],
      type: 'Evolución',
      title: reportTitle,
      content,
    });
    window.alert(
      'El informe validado fue incorporado como asiento firme en la Historia Clínica.'
    );
  };

  // Cada profesional puede editar su propio horario personal
  const handleUpdateScheduleConfig = (nextCfg: ScheduleConfig) => {
    if (user.role === 'recepcion') return;
    const parsed = ScheduleConfigSchema.safeParse(nextCfg);
    if (!parsed.success) {
      window.alert(parsed.error.issues[0]?.message || 'Configuración horaria inválida.');
      return;
    }
    setSchedulesByProf((prev) => ({
      ...prev,
      [activeWorkspaceId]: parsed.data,
    }));
    appendAuditLog(
      'SCHEDULE_CONFIG_UPDATED',
      activeWorkspaceName,
      `${parsed.data.startHour}:00-${parsed.data.endHour}:00 (${parsed.data.slotDuration}m)`
    );
  };

  const handleAddStaff = (memberData: {
    fullName: string;
    specialtyOrLicense: string;
    role: AppRole;
    password: string;
    linkedProfessionalId?: string;
  }): StaffMember | null => {
    const created = addStaffMember(memberData);
    if (created) {
      appendAuditLog(
        'USER_CREATED',
        created.fullName,
        `Rol: ${created.role} (${created.specialtyOrLicense})`
      );
    }
    return created;
  };

  const handleToggleSub = (staffId: string): SubscriptionStatus | null => {
    const target = staffMembers.find((s) => s.id === staffId);
    const nextState = toggleSubscriptionStatus(staffId);
    if (nextState && target) {
      appendAuditLog(
        'SUBSCRIPTION_CHANGED',
        target.fullName,
        `Estado de suscripción: ${nextState.toUpperCase()}`
      );
    }
    return nextState;
  };

  const handlePasswordChange = (staffId: string, newPass: string): boolean => {
    const target = staffMembers.find((s) => s.id === staffId);
    const ok = updateStaffPassword(staffId, newPass);
    if (ok && target) {
      appendAuditLog(
        'PASSWORD_UPDATED',
        target.fullName,
        'Contraseña actualizada por Administrador de Usuarios'
      );
    }
    return ok;
  };

  const handleRemoveStaff = (staffId: string): boolean => {
    const target = staffMembers.find((s) => s.id === staffId);
    const ok = removeStaffMember(staffId);
    if (ok && target) {
      appendAuditLog('USER_REMOVED', target.fullName, 'Baja de cuenta en el sistema');
    }
    return ok;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <IdleLockOverlay
        isLocked={isLocked}
        userName={user.fullName}
        onUnlock={unlockSession}
        onSwitchUser={handleLogout}
      />

      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (user.role === 'recepcion' && (tab === 'reports' || tab === 'settings')) {
            return;
          }
          setActiveTab(tab);
          if (tab === 'reports' && !selectedStudentId && activeStudents.length > 0) {
            setSelectedStudentId(activeStudents[0].id);
          }
        }}
        activeStudentsCount={activeStudents.length}
        currentRole={user.role}
        currentUserName={user.fullName}
        onOpenNewStudentModal={() => setIsStudentModalOpen(true)}
        onLockScreen={lockSession}
        onSignOut={handleLogout}
        isCloudConnected={isRealtimeConnected}
        canInstallPwa={Boolean(deferredPwaPrompt)}
        onInstallPwa={handleInstallPwa}
      />

      {/* ALERTA DE INASISTENCIAS CRÍTICAS (Solo de los pacientes de este profesional) */}
      {criticalStudents.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3 text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Alerta de Inasistencias (3 o más): </span>
                {criticalStudents.map((s) => `${s.name} (${s.absences} faltas)`).join(', ')}.
                <span className="ml-1 text-rose-700">
                  Prioridad para revisión de vacante o liberación del turno.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-semibold text-rose-900 underline hover:text-rose-950 shrink-0"
            >
              Gestionar Pacientes
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'grid' && (
          <ScheduleGrid
            activeDays={activeDays}
            timeSlots={timeSlots}
            scheduleConfig={scheduleConfig}
            currentRole={user.role}
            workspaceOwnerName={activeWorkspaceName}
            getStudentsInSlot={getStudentsInSlot}
            onSelectStudent={(id) => {
              setSelectedStudentId(id);
              setActiveTab('students');
            }}
            onAddAbsence={handleAddAbsence}
            onRemoveFromSlot={handleRemoveFromSlot}
            onOpenAssignModal={(day, hour) => {
              setSelectedSlot({ day, hour });
              setIsAssignModalOpen(true);
            }}
          />
        )}

        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PatientDirectory
              students={workspaceStudents}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentRole={user.role}
              showArchived={showArchived}
              onToggleShowArchived={setShowArchived}
            />

            <ClinicalDossier
              student={selectedStudent}
              currentRole={user.role}
              currentUserName={user.fullName}
              onAddAbsence={handleAddAbsence}
              onResetAbsences={handleResetAbsences}
              onRemoveSlot={handleRemoveFromSlot}
              onArchiveStudent={handleArchiveStudent}
              onAddClinicalEntry={handleAddClinicalEntry}
              onGoToReports={() => setActiveTab('reports')}
            />
          </div>
        )}

        {activeTab === 'reports' && user.role !== 'recepcion' && (
          <AiReportGenerator
            students={workspaceStudents}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            currentUserName={user.fullName}
            onSaveReportToHistory={handleSaveAiReportToHistory}
          />
        )}

        {activeTab === 'settings' && user.role !== 'recepcion' && (
          <CenterSettings
            scheduleConfig={scheduleConfig}
            onChangeScheduleConfig={handleUpdateScheduleConfig}
            timeSlots={timeSlots}
            currentRole={user.role}
            currentUserId={user.id}
            workspaceOwnerName={activeWorkspaceName}
            auditLogs={auditLogs}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            staffMembers={staffMembers}
            onAddStaffMember={handleAddStaff}
            onToggleSubscription={handleToggleSub}
            onUpdateStaffPassword={handlePasswordChange}
            onRemoveStaffMember={handleRemoveStaff}
          />
        )}
      </main>

      {/* MODAL: ASIGNAR / SUMAR TURNO SEMANAL EN LA AGENDA DEL PROFESIONAL */}
      {isAssignModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Asignar / Sumar Turno Semanal
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSlot.day} a las {selectedSlot.hour} hs • Agenda de{' '}
                  <strong>{activeWorkspaceName}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecciona uno de los pacientes de <strong>{activeWorkspaceName}</strong>{' '}
              para sumarle este horario semanal:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeStudents.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  Aún no hay pacientes registrados en esta agenda. Usá el botón &quot;Nuevo
                  Paciente&quot; primero.
                </div>
              ) : (
                activeStudents.map((student) => {
                  const currentSlots = getStudentSlots(student);
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleAssignToSlot(student.id)}
                      className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {student.name}
                          </span>
                          {currentSlots.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded shrink-0">
                              <CalendarDays className="w-2.5 h-2.5" />
                              {currentSlots.length}{' '}
                              {currentSlots.length === 1 ? 'turno' : 'turnos'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {currentSlots.length > 0
                            ? `Actuales: ${currentSlots
                                .map((sl) => `${sl.day.slice(0, 3)} ${sl.hour}`)
                                .join(', ')}`
                            : 'Sin turnos asignados aún'}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-teal-600 group-hover:underline shrink-0">
                        + Sumar Turno
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO PACIENTE EN LA AGENDA PERSONAL */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Registrar Nuevo Paciente</h3>
                <p className="text-xs text-slate-500">
                  Cartera privada de: <strong>{activeWorkspaceName}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {newStudentError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{newStudentError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo del Paciente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tomás M. Ramírez"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Edad (años)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={99}
                    placeholder="Ej: 8"
                    value={newStudent.age}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, age: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condición / Diagnóstico
                  </label>
                  <select
                    value={newStudent.condition}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, condition: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.id} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Padre / Madre / Tutor Legal
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Laura Ramírez (Madre)"
                    value={newStudent.tutorName}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, tutorName: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 11-2233-4455"
                    value={newStudent.phone}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, phone: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Asignar Primer Turno (Luego podés sumarle más desde la grilla)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newStudent.day}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        day: e.target.value as DayOfWeek | '',
                      })
                    }
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="">-- Día --</option>
                    {activeDays.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={newStudent.hour}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, hour: e.target.value })
                    }
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="">-- Horario --</option>
                    {timeSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} hs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-teal-50/70 border border-teal-200 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newStudent.consentSigned}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, consentSigned: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span>
                  Confirmo que el tutor legal suscribió el{' '}
                  <strong>Consentimiento Informado (Ley 25.326 / Ley 26.529)</strong> para
                  el tratamiento confidencial de datos clínicos del menor.
                </span>
              </label>

              <div className="pt-3 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BACKUP CIFRADO AES-GCM 256 */}
      <EncryptedBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        students={workspaceStudents}
        scheduleConfig={scheduleConfig}
        currentUserName={user.fullName}
        onRestoreBackup={(restoredStudents, restoredConfig) => {
          setStudents(restoredStudents);
          setSchedulesByProf((prev) => ({
            ...prev,
            [activeWorkspaceId]: restoredConfig,
          }));
        }}
        onAuditEvent={appendAuditLog}
      />

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Agenda Clínica Personal por Suscripción • © {new Date().getFullYear()}
          </span>
          <span>
            Cumplimiento Técnico Ley 25.326 (Datos Sensibles) y Ley 26.529 (Historia Clínica)
          </span>
        </div>
      </footer>
    </div>
  );
}
