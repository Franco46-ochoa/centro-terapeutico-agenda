import { z } from 'zod';

const sanitizeText = (val: string) =>
  val.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

export const DayOfWeekSchema = z.enum([
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]);

export const ClinicalEntryTypeSchema = z.enum([
  'Evolución',
  'Actividad',
  'Regresión',
  'Enmienda',
]);

export const TimeSlotAssignmentSchema = z.object({
  day: DayOfWeekSchema,
  hour: z.string(),
  professionalId: z.string().optional(),
  professionalName: z.string().optional(),
});

export const NewStudentSchema = z.object({
  name: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres.')
        .max(120, 'El nombre no puede superar los 120 caracteres.')
    ),
  age: z.coerce
    .number()
    .int('La edad debe ser un número entero.')
    .min(0, 'La edad no puede ser negativa.')
    .max(99, 'La edad máxima permitida es 99 años.'),
  condition: z.string().min(2, 'Seleccione una condición o diagnóstico válido.'),
  tutorName: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(2, 'Ingrese el nombre del tutor responsable.')
        .max(120, 'El nombre del tutor es demasiado largo.')
    ),
  phone: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .regex(
          /^[0-9+\-\s()]{6,25}$/,
          'Ingrese un teléfono válido (ej: 11-4589-1234).'
        )
    ),
  consentSigned: z.boolean().refine((val) => val === true, {
    message:
      'Es obligatorio confirmar el Consentimiento Informado del tutor legal (Ley 25.326 / Ley 26.529).',
  }),
  day: z.union([DayOfWeekSchema, z.literal('')]).optional(),
  hour: z
    .string()
    .regex(/^([0-2][0-9]:[0-5][0-9])?$/, 'Formato de hora inválido.')
    .optional(),
  professionalId: z.string().optional(),
});

export const ClinicalEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato requerido YYYY-MM-DD).'),
  type: ClinicalEntryTypeSchema,
  title: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(3, 'El título debe tener al menos 3 caracteres.')
        .max(160, 'El título no puede exceder los 160 caracteres.')
    ),
  content: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(5, 'El detalle clínico debe tener al menos 5 caracteres.')
        .max(10000, 'El detalle clínico no puede exceder los 10.000 caracteres.')
    ),
  amendsEntryId: z.string().optional(),
});

export const ScheduleConfigSchema = z
  .object({
    startHour: z.number().int().min(6).max(20),
    endHour: z.number().int().min(8).max(23),
    slotDuration: z.union([
      z.literal(30),
      z.literal(45),
      z.literal(60),
      z.literal(90),
      z.literal(120),
    ]),
    includeSaturday: z.boolean(),
  })
  .refine((cfg) => cfg.endHour > cfg.startHour, {
    message: 'La hora de cierre debe ser posterior a la hora de inicio.',
  });

export const BackupPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  exportedBy: z.string(),
  scheduleConfig: ScheduleConfigSchema,
  students: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(120),
      age: z.number().int().min(0).max(99),
      condition: z.string(),
      tutorName: z.string(),
      phone: z.string(),
      consentSigned: z.boolean(),
      consentSignedAt: z.string().optional(),
      absences: z.number().int().min(0),
      slot: TimeSlotAssignmentSchema.nullable(),
      slots: z.array(TimeSlotAssignmentSchema).optional(),
      professionalId: z.string().optional(),
      professionalName: z.string().optional(),
      archivedAt: z.string().nullable().optional(),
      archiveReason: z.string().nullable().optional(),
      attendanceHistory: z
        .array(
          z.object({
            id: z.string(),
            date: z.string(),
            type: z.enum([
              'presente',
              'ausente_injustificado',
              'ausente_justificado',
              'reinicio_ciclo',
            ]),
            reason: z.string().optional(),
            recordedBy: z.string(),
            createdAt: z.string(),
          })
        )
        .default([]),
      history: z.array(
        z.object({
          id: z.string(),
          date: z.string(),
          type: ClinicalEntryTypeSchema,
          title: z.string(),
          content: z.string(),
          authorName: z.string(),
          authorRole: z.enum(['admin', 'profesional', 'recepcion']),
          createdAt: z.string(),
          amendsEntryId: z.string().optional(),
          isAiGenerated: z.boolean().optional(),
        })
      ),
    })
  ),
});
