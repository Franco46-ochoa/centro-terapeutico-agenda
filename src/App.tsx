import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ShieldAlert, X, AlertCircle, UserCheck, CalendarDays } from 'lucide-react';
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
import { useAuth, type StaffMember } from './hooks/useAuth';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useRealtimeCenterData } from './hooks/useRealtimeCenterData';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STUDENTS_STORAGE_KEY = 'ct_students_data_v1';
const SCHEDULE_STORAGE_KEY = 'ct_schedule_config_v1';

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

function loadPersistedSchedule(): ScheduleConfig {
  try {
    const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_CONFIG;
    const parsed = ScheduleConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SCHEDULE_CONFIG;
  } catch {
    return DEFAULT_SCHEDULE_CONFIG;
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
    updateStaffPassword,
    removeStaffMember,
  } = useAuth();
  const { isRealtimeConnected } = useRealtimeCenterData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('grid');
  const [students, setStudents] = useState<StudentPatient[]>(() =>
    loadPersistedStudents()
  );
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(() =>
    loadPersistedSchedule()
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    () => loadPersistedStudents()[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] =
    useState<string>('ALL');

  const professionals = useMemo(
    () =>
      staffMembers.filter(
        (m) => (m.role === 'profesional' || m.role === 'admin') && m.active
      ),
    [staffMembers]
  );

  const [assignProfessionalId, setAssignProfessionalId] = useState<string>(
    () => professionals[0]?.id || ''
  );

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
        SCHEDULE_STORAGE_KEY,
        JSON.stringify(scheduleConfig)
      );
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [scheduleConfig]);

  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === STUDENTS_STORAGE_KEY && e.newValue) {
        try {
          setStudents(JSON.parse(e.newValue));
        } catch {
          // Ignorar JSON corrupto
        }
      } else if (e.key === SCHEDULE_STORAGE_KEY && e.newValue) {
        try {
          setScheduleConfig(JSON.parse(e.newValue));
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
      actorName: 'Sistema AppSec',
      actorRole: 'admin',
      action: 'SYSTEM_READY',
      target: 'Centro Terapéutico',
      details: 'Soporte de múltiples turnos semanales por paciente activo.',
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

  // Formulario de Nuevo Paciente
  const [newStudent, setNewStudent] = useState({
    name: '',
    age: '',
    condition: CONDITIONS[0].label as string,
    tutorName: '',
    phone: '',
    consentSigned: false,
    day: '' as DayOfWeek | '',
    hour: '',
    professionalId: professionals[0]?.id || '',
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

  const activeStudents = useMemo(
    () => students.filter((s) => !s.archivedAt),
    [students]
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  const criticalStudents = useMemo(
    () => activeStudents.filter((s) => s.absences >= 3),
    [activeStudents]
  );

  // Busca todos los turnos asignados en ese día y horario entre todos los pacientes activos
  const getStudentsInSlot = useCallback(
    (day: DayOfWeek, hour: string): SlotMatchItem[] => {
      const matches: SlotMatchItem[] = [];
      for (const student of activeStudents) {
        const studentSlots = getStudentSlots(student);
        for (const sl of studentSlots) {
          if (sl.day === day && sl.hour === hour) {
            if (
              selectedProfessionalFilter === 'ALL' ||
              sl.professionalId === selectedProfessionalFilter
            ) {
              matches.push({ student, slotInfo: sl });
            }
          }
        }
      }
      return matches;
    },
    [activeStudents, selectedProfessionalFilter]
  );

  const handleLogin = (staffId: string, passwordInput: string): boolean => {
    const loggedMember = loginWithStaffPassword(staffId, passwordInput);
    if (loggedMember) {
      setActiveTab('grid');
      setShowArchived(false);
      if (loggedMember.role === 'profesional') {
        setSelectedProfessionalFilter(loggedMember.id);
        setAssignProfessionalId(loggedMember.id);
      } else {
        setSelectedProfessionalFilter('ALL');
        setAssignProfessionalId(professionals[0]?.id || '');
      }
      appendAuditLog(
        'LOGIN_SUCCESS',
        loggedMember.fullName,
        `Ingreso autorizado (${loggedMember.specialtyOrLicense})`,
        { name: loggedMember.fullName, role: loggedMember.role }
      );
      return true;
    } else {
      const target = staffMembers.find((s) => s.id === staffId);
      appendAuditLog(
        'LOGIN_FAILED',
        target?.fullName || 'Usuario',
        'Intento fallido de contraseña en pantalla de inicio',
        { name: 'Intento no autenticado', role: target?.role || 'recepcion' }
      );
      return false;
    }
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
    const target = students.find((s) => s.id === studentId);
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
    const target = students.find((s) => s.id === studentId);
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

  // Libera únicamente el turno del día y hora indicados, conservando los otros turnos de la semana
  const handleRemoveFromSlot = (
    studentId: string,
    day: DayOfWeek,
    hour: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const target = students.find((s) => s.id === studentId);
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
    if (target) {
      appendAuditLog(
        'SLOT_RELEASED',
        target.name,
        `Turno liberado: ${day} ${hour} hs`
      );
    }
  };

  const handleArchiveStudent = (studentId: string, reason: string) => {
    if (user.role !== 'admin') return;
    const target = students.find((s) => s.id === studentId);
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
    if (target) {
      appendAuditLog('PATIENT_ARCHIVED', target.name, `Motivo: ${reason}`);
    }
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
      professionalId: newStudent.professionalId,
    });

    if (!parsed.success) {
      setNewStudentError(
        parsed.error.issues[0]?.message || 'Verifique los campos ingresados.'
      );
      return;
    }

    const valid = parsed.data;
    const today = new Date().toISOString().split('T')[0];
    const assignedProf =
      professionals.find((p) => p.id === valid.professionalId) ?? professionals[0];

    const initialSlot: TimeSlotAssignment | null =
      valid.day && valid.hour
        ? {
            day: valid.day as DayOfWeek,
            hour: valid.hour,
            professionalId: assignedProf?.id,
            professionalName: assignedProf?.fullName,
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
      professionalId: assignedProf?.id,
      professionalName: assignedProf?.fullName,
      archivedAt: null,
      attendanceHistory: [],
      history: [],
    };

    setStudents((prev) => [...prev, created]);
    appendAuditLog(
      'PATIENT_CREATED',
      created.name,
      `Alta asignada a ${assignedProf?.fullName || 'Centro'}`
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
      professionalId: professionals[0]?.id || '',
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
    const target = students.find((s) => s.id === studentId);

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

    if (target) {
      appendAuditLog(
        'CLINICAL_ENTRY_ADDED',
        target.name,
        `[${entryData.type}] ${entryData.title}`
      );
    }
  };

  // SUMA un nuevo turno semanal al paciente sin borrarle los turnos de otros días/horas
  const handleAssignToSlot = (studentId: string) => {
    if (!selectedSlot) return;
    const target = students.find((s) => s.id === studentId);
    const chosenProf =
      professionals.find((p) => p.id === assignProfessionalId) ?? professionals[0];

    const newSlotAssignment: TimeSlotAssignment = {
      day: selectedSlot.day,
      hour: selectedSlot.hour,
      professionalId: chosenProf?.id,
      professionalName: chosenProf?.fullName,
    };

    setStudents((prev) =>
      prev.map((s) => {
        const currentSlots = getStudentSlots(s);

        if (s.id === studentId) {
          // Si ya tenía un turno en ese exacto día y hora, actualizar el profesional; si no, agregarlo
          const withoutSameDayHour = currentSlots.filter(
            (sl) => !(sl.day === selectedSlot.day && sl.hour === selectedSlot.hour)
          );
          const updatedSlots = [...withoutSameDayHour, newSlotAssignment];
          return {
            ...s,
            slots: updatedSlots,
            slot: updatedSlots[0] ?? null,
            professionalId: chosenProf?.id ?? s.professionalId,
            professionalName: chosenProf?.fullName ?? s.professionalName,
          };
        }

        // Si otro paciente ocupaba el mismo día, hora y el MISMO profesional, liberar solo ese turno
        if (chosenProf) {
          const filteredOther = currentSlots.filter(
            (sl) =>
              !(
                sl.day === selectedSlot.day &&
                sl.hour === selectedSlot.hour &&
                sl.professionalId === chosenProf.id
              )
          );
          if (filteredOther.length !== currentSlots.length) {
            return {
              ...s,
              slots: filteredOther,
              slot: filteredOther[0] ?? null,
            };
          }
        }
        return s;
      })
    );

    if (target) {
      appendAuditLog(
        'SLOT_ASSIGNED',
        target.name,
        `Turno agregado: ${selectedSlot.day} ${selectedSlot.hour} hs (${
          chosenProf?.fullName || 'General'
        })`
      );
    }
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

  const handleUpdateScheduleConfig = (nextCfg: ScheduleConfig) => {
    if (user.role !== 'admin') return;
    const parsed = ScheduleConfigSchema.safeParse(nextCfg);
    if (!parsed.success) {
      window.alert(parsed.error.issues[0]?.message || 'Configuración horaria inválida.');
      return;
    }
    setScheduleConfig(parsed.data);
    appendAuditLog(
      'SCHEDULE_CONFIG_UPDATED',
      'Parámetros Horarios',
      `${parsed.data.startHour}:00-${parsed.data.endHour}:00 (${parsed.data.slotDuration}m)`
    );
  };

  const handleAddStaff = (memberData: {
    fullName: string;
    specialtyOrLicense: string;
    role: AppRole;
    password: string;
  }): StaffMember | null => {
    const created = addStaffMember(memberData);
    if (created) {
      appendAuditLog(
        'STAFF_ADDED',
        created.fullName,
        `Alta de personal con rol ${created.role} (${created.specialtyOrLicense})`
      );
    }
    return created;
  };

  const handlePasswordChange = (staffId: string, newPass: string): boolean => {
    const target = staffMembers.find((s) => s.id === staffId);
    const ok = updateStaffPassword(staffId, newPass);
    if (ok && target) {
      appendAuditLog(
        'PASSWORD_UPDATED',
        target.fullName,
        `Contraseña actualizada por Dirección/Admin`
      );
    }
    return ok;
  };

  const handleRemoveStaff = (staffId: string): boolean => {
    const target = staffMembers.find((s) => s.id === staffId);
    const ok = removeStaffMember(staffId);
    if (ok && target) {
      appendAuditLog('STAFF_REMOVED', target.fullName, 'Baja de acceso al sistema');
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
        onOpenNewStudentModal={() => {
          setNewStudent((prev) => ({
            ...prev,
            professionalId:
              selectedProfessionalFilter !== 'ALL'
                ? selectedProfessionalFilter
                : professionals[0]?.id || '',
          }));
          setIsStudentModalOpen(true);
        }}
        onLockScreen={lockSession}
        onSignOut={handleLogout}
        isCloudConnected={isRealtimeConnected}
        canInstallPwa={Boolean(deferredPwaPrompt)}
        onInstallPwa={handleInstallPwa}
      />

      {/* ALERTA DE INASISTENCIAS CRÍTICAS */}
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
            professionals={professionals}
            selectedProfessionalFilter={selectedProfessionalFilter}
            onChangeProfessionalFilter={setSelectedProfessionalFilter}
            getStudentsInSlot={getStudentsInSlot}
            onSelectStudent={(id) => {
              setSelectedStudentId(id);
              setActiveTab('students');
            }}
            onAddAbsence={handleAddAbsence}
            onRemoveFromSlot={handleRemoveFromSlot}
            onOpenAssignModal={(day, hour) => {
              setSelectedSlot({ day, hour });
              setAssignProfessionalId(
                selectedProfessionalFilter !== 'ALL'
                  ? selectedProfessionalFilter
                  : professionals[0]?.id || ''
              );
              setIsAssignModalOpen(true);
            }}
          />
        )}

        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PatientDirectory
              students={students}
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
            students={students}
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
            auditLogs={auditLogs}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            staffMembers={staffMembers}
            onAddStaffMember={handleAddStaff}
            onUpdateStaffPassword={handlePasswordChange}
            onRemoveStaffMember={handleRemoveStaff}
          />
        )}
      </main>

      {/* MODAL: ASIGNAR / SUMAR TURNO SEMANAL A UN PACIENTE */}
      {isAssignModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Asignar / Sumar Turno Semanal
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSlot.day} a las {selectedSlot.hour} hs (se suma a los otros
                  días que ya tenga el paciente)
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Profesional a cargo de este turno:</span>
              </label>
              <select
                value={assignProfessionalId}
                onChange={(e) => setAssignProfessionalId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
              >
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.fullName} — {prof.specialtyOrLicense}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-600">
              Selecciona el paciente para sumarle este turno semanal:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeStudents.map((student) => {
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
              })}
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

      {/* MODAL: REGISTRAR NUEVO PACIENTE */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Registrar Nuevo Paciente</h3>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profesional Tratante Asignado
                </label>
                <select
                  value={newStudent.professionalId}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, professionalId: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.fullName} — {prof.specialtyOrLicense}
                    </option>
                  ))}
                </select>
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
        students={students}
        scheduleConfig={scheduleConfig}
        currentUserName={user.fullName}
        onRestoreBackup={(restoredStudents, restoredConfig) => {
          setStudents(restoredStudents);
          setScheduleConfig(restoredConfig);
        }}
        onAuditEvent={appendAuditLog}
      />

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Centro Terapéutico y Agente Clínico IA • © {new Date().getFullYear()}
          </span>
          <span>
            Cumplimiento Técnico Ley 25.326 (Datos Sensibles) y Ley 26.529 (Historia Clínica)
          </span>
        </div>
      </footer>
    </div>
  );
}
