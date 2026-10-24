export type AppRole = 'admin' | 'profesional' | 'recepcion';

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export type ClinicalEntryType = 'Evolución' | 'Actividad' | 'Regresión' | 'Enmienda';

export type AttendanceEventType =
  | 'presente'
  | 'ausente_injustificado'
  | 'ausente_justificado'
  | 'reinicio_ciclo';

export interface TimeSlotAssignment {
  day: DayOfWeek;
  hour: string;
  professionalId?: string;
  professionalName?: string;
}

export interface ClinicalHistoryEntry {
  id: string;
  date: string;
  type: ClinicalEntryType;
  title: string;
  content: string;
  authorName: string;
  authorRole: AppRole;
  createdAt: string;
  amendsEntryId?: string;
  isAiGenerated?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  type: AttendanceEventType;
  reason?: string;
  recordedBy: string;
  createdAt: string;
}

export interface StudentPatient {
  id: string;
  name: string;
  age: number;
  condition: string;
  tutorName: string;
  phone: string;
  consentSigned: boolean;
  consentSignedAt?: string;
  absences: number;
  slot: TimeSlotAssignment | null;
  slots?: TimeSlotAssignment[];
  professionalId?: string;
  professionalName?: string;
  history: ClinicalHistoryEntry[];
  attendanceHistory: AttendanceRecord[];
  archivedAt?: string | null;
  archiveReason?: string | null;
}

export interface ScheduleConfig {
  startHour: number;
  endHour: number;
  slotDuration: number;
  includeSaturday: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: AppRole;
  action: string;
  target: string;
  details: string;
}

export interface TimeSlotItem {
  id: string;
  label: string;
}

/**
 * Helper que devuelve siempre la lista de turnos semanales de un paciente,
 * migrando automáticamente si solo tenía un único `slot` antiguo.
 */
export function getStudentSlots(student: StudentPatient): TimeSlotAssignment[] {
  if (Array.isArray(student.slots) && student.slots.length > 0) {
    return student.slots.map((sl) => ({
      ...sl,
      professionalId: sl.professionalId ?? student.professionalId,
      professionalName: sl.professionalName ?? student.professionalName,
    }));
  }
  if (student.slot) {
    return [
      {
        day: student.slot.day,
        hour: student.slot.hour,
        professionalId: student.slot.professionalId ?? student.professionalId,
        professionalName: student.slot.professionalName ?? student.professionalName,
      },
    ];
  }
  return [];
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const CONDITIONS = [
  {
    id: 'tea',
    label: 'Trastorno del Espectro Autista (TEA)',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'down',
    label: 'Síndrome de Down',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    id: 'tdah',
    label: 'TDAH',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    id: 'pc',
    label: 'Parálisis Cerebral',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  {
    id: 'rd',
    label: 'Retraso del Desarrollo',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    id: 'otro',
    label: 'Otro / En Evaluación',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
] as const;

export function getConditionColor(conditionLabel: string): string {
  const found = CONDITIONS.find((c) => c.label === conditionLabel);
  return found ? found.color : 'bg-gray-100 text-gray-800 border-gray-300';
}

export const INITIAL_STUDENTS: StudentPatient[] = [
  {
    id: 'p1',
    name: 'Mateo González',
    age: 7,
    condition: 'Trastorno del Espectro Autista (TEA)',
    tutorName: 'María González (Madre)',
    phone: '11-4589-1234',
    consentSigned: true,
    consentSignedAt: '2026-02-15',
    absences: 2,
    slot: {
      day: 'Lunes',
      hour: '09:00',
      professionalId: 'staff_profe_1',
      professionalName: 'Lic. Valeria Méndez',
    },
    slots: [
      {
        day: 'Lunes',
        hour: '09:00',
        professionalId: 'staff_profe_1',
        professionalName: 'Lic. Valeria Méndez',
      },
      {
        day: 'Jueves',
        hour: '09:00',
        professionalId: 'staff_profe_2',
        professionalName: 'Lic. Juan Ignacio Pérez',
      },
    ],
    professionalId: 'staff_profe_1',
    professionalName: 'Lic. Valeria Méndez',
    archivedAt: null,
    attendanceHistory: [
      {
        id: 'att_1',
        date: '2026-03-05',
        type: 'ausente_injustificado',
        reason: 'Sin aviso previo',
        recordedBy: 'Recepción Central',
        createdAt: '2026-03-05T09:10:00Z',
      },
      {
        id: 'att_2',
        date: '2026-03-19',
        type: 'ausente_injustificado',
        reason: 'Malestar estomacal informado sobre la hora',
        recordedBy: 'Recepción Central',
        createdAt: '2026-03-19T09:05:00Z',
      },
    ],
    history: [
      {
        id: 'h1',
        date: '2026-03-02',
        type: 'Evolución',
        title: 'Avance en comunicación SAAC',
        content:
          'Mateo logró utilizar el pictograma de "quiero agua" de forma espontánea en 4 ocasiones durante la sesión de juego libre.',
        authorName: 'Lic. Valeria Méndez (M.N. 4821)',
        authorRole: 'profesional',
        createdAt: '2026-03-02T10:00:00Z',
      },
      {
        id: 'h2',
        date: '2026-03-09',
        type: 'Actividad',
        title: 'Integración Sensorial',
        content:
          'Trabajo en hamaca sensorial y estimulación propioceptiva. Toleró texturas rugosas (plastilina de arena) por 10 minutos.',
        authorName: 'Lic. Valeria Méndez (M.N. 4821)',
        authorRole: 'profesional',
        createdAt: '2026-03-09T10:00:00Z',
      },
      {
        id: 'h3',
        date: '2026-03-16',
        type: 'Regresión',
        title: 'Hipersensibilidad auditiva',
        content:
          'Episodio de sobrecarga sensorial por ruido externo brusco. Requirió 15 min de autorregulación con auriculares de atenuación.',
        authorName: 'Lic. Valeria Méndez (M.N. 4821)',
        authorRole: 'profesional',
        createdAt: '2026-03-16T10:00:00Z',
      },
      {
        id: 'h4',
        date: '2026-03-23',
        type: 'Evolución',
        title: 'Interacción con pares',
        content:
          'Participó de una ronda compartida realizando turnos de espera con apoyo visual.',
        authorName: 'Lic. Valeria Méndez (M.N. 4821)',
        authorRole: 'profesional',
        createdAt: '2026-03-23T10:00:00Z',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Sofía Benítez',
    age: 9,
    condition: 'Síndrome de Down',
    tutorName: 'Carlos Benítez (Padre)',
    phone: '11-6321-7788',
    consentSigned: true,
    consentSignedAt: '2026-02-10',
    absences: 0,
    slot: {
      day: 'Miércoles',
      hour: '14:00',
      professionalId: 'staff_profe_1',
      professionalName: 'Lic. Valeria Méndez',
    },
    slots: [
      {
        day: 'Miércoles',
        hour: '14:00',
        professionalId: 'staff_profe_1',
        professionalName: 'Lic. Valeria Méndez',
      },
    ],
    professionalId: 'staff_profe_1',
    professionalName: 'Lic. Valeria Méndez',
    archivedAt: null,
    attendanceHistory: [],
    history: [
      {
        id: 'h21',
        date: '2026-03-04',
        type: 'Actividad',
        title: 'Grafo-motricidad fina',
        content:
          'Realizó trazado de líneas punteadas y recortado de figuras geométricas simples con tijera adaptada.',
        authorName: 'Lic. Valeria Méndez (M.N. 4821)',
        authorRole: 'profesional',
        createdAt: '2026-03-04T15:00:00Z',
      },
      {
        id: 'h22',
        date: '2026-03-11',
        type: 'Evolución',
        title: 'Comprensión de consignas',
        content:
          'Completó rutina de 3 pasos sin necesidad de modelado físico, siguiendo la agenda visual.',
        authorName: 'Lic. Valeria Méndez (M.N. 4821)',
        authorRole: 'profesional',
        createdAt: '2026-03-11T15:00:00Z',
      },
      {
        id: 'h23',
        date: '2026-03-18',
        type: 'Evolución',
        title: 'Autonomía en higiene',
        content:
          'Logra lavarse y secarse las manos antes de la merienda con supervisión indirecta.',
        authorName: 'Lic. Valeria Méndez (M.N. 4821)',
        authorRole: 'profesional',
        createdAt: '2026-03-18T15:00:00Z',
      },
    ],
  },
  {
    id: 'p3',
    name: 'Lucas Martínez',
    age: 6,
    condition: 'TDAH',
    tutorName: 'Laura Martínez (Madre)',
    phone: '11-9988-4422',
    consentSigned: true,
    consentSignedAt: '2026-02-18',
    absences: 3,
    slot: {
      day: 'Viernes',
      hour: '11:00',
      professionalId: 'staff_profe_2',
      professionalName: 'Lic. Juan Ignacio Pérez',
    },
    slots: [
      {
        day: 'Martes',
        hour: '11:00',
        professionalId: 'staff_profe_1',
        professionalName: 'Lic. Valeria Méndez',
      },
      {
        day: 'Viernes',
        hour: '11:00',
        professionalId: 'staff_profe_2',
        professionalName: 'Lic. Juan Ignacio Pérez',
      },
    ],
    professionalId: 'staff_profe_2',
    professionalName: 'Lic. Juan Ignacio Pérez',
    archivedAt: null,
    attendanceHistory: [
      {
        id: 'att_31',
        date: '2026-02-27',
        type: 'ausente_injustificado',
        reason: 'Ausencia sin aviso',
        recordedBy: 'Recepción Central',
        createdAt: '2026-02-27T11:15:00Z',
      },
      {
        id: 'att_32',
        date: '2026-03-13',
        type: 'ausente_injustificado',
        reason: 'Inconveniente de traslado',
        recordedBy: 'Recepción Central',
        createdAt: '2026-03-13T11:10:00Z',
      },
      {
        id: 'att_33',
        date: '2026-03-20',
        type: 'ausente_injustificado',
        reason: 'Tercera falta acumulada en el mes',
        recordedBy: 'Recepción Central',
        createdAt: '2026-03-20T11:10:00Z',
      },
    ],
    history: [
      {
        id: 'h31',
        date: '2026-02-20',
        type: 'Actividad',
        title: 'Control inhibitorio',
        content:
          'Juegos de mesa tipo "Simón Dice" y "Semáforo". Muestra dificultad para respetar la pausa de detención.',
        authorName: 'Lic. Juan Ignacio Pérez (M.N. 9104)',
        authorRole: 'profesional',
        createdAt: '2026-02-20T12:00:00Z',
      },
      {
        id: 'h32',
        date: '2026-03-06',
        type: 'Regresión',
        title: 'Inatención marcada',
        content:
          'Muestra inquietud motora severa. No logra finalizar tareas breves de menos de 5 minutos de duración.',
        authorName: 'Lic. Juan Ignacio Pérez (M.N. 9104)',
        authorRole: 'profesional',
        createdAt: '2026-03-06T12:00:00Z',
      },
    ],
  },
  {
    id: 'p4',
    name: 'Camila Rojas',
    age: 11,
    condition: 'Parálisis Cerebral',
    tutorName: 'Aníbal Rojas (Padre)',
    phone: '11-2233-5566',
    consentSigned: true,
    consentSignedAt: '2026-02-12',
    absences: 1,
    slot: {
      day: 'Martes',
      hour: '16:00',
      professionalId: 'staff_profe_2',
      professionalName: 'Lic. Juan Ignacio Pérez',
    },
    slots: [
      {
        day: 'Martes',
        hour: '16:00',
        professionalId: 'staff_profe_2',
        professionalName: 'Lic. Juan Ignacio Pérez',
      },
    ],
    professionalId: 'staff_profe_2',
    professionalName: 'Lic. Juan Ignacio Pérez',
    archivedAt: null,
    attendanceHistory: [
      {
        id: 'att_41',
        date: '2026-03-17',
        type: 'ausente_justificado',
        reason: 'Control médico programado',
        recordedBy: 'Recepción Central',
        createdAt: '2026-03-17T16:00:00Z',
      },
    ],
    history: [
      {
        id: 'h41',
        date: '2026-03-03',
        type: 'Actividad',
        title: 'Posicionamiento y comunicación',
        content:
          'Uso de bipedestador e interacción mediante pulsador en tablet para causa-efecto.',
        authorName: 'Lic. Juan Ignacio Pérez (M.N. 9104)',
        authorRole: 'profesional',
        createdAt: '2026-03-03T17:00:00Z',
      },
      {
        id: 'h42',
        date: '2026-03-10',
        type: 'Evolución',
        title: 'Mayor control cefálico',
        content:
          'Sostiene mirada fija en pantalla interactiva por lapsos continuos de 30 segundos.',
        authorName: 'Lic. Juan Ignacio Pérez (M.N. 9104)',
        authorRole: 'profesional',
        createdAt: '2026-03-10T17:00:00Z',
      },
    ],
  },
];
