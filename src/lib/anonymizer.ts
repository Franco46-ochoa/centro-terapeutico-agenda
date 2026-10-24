import type { StudentPatient } from '../types/clinical';

export const PATIENT_PLACEHOLDER = '{{PACIENTE}}';

/**
 * Reemplaza nombres propios del menor, datos del tutor, teléfonos y posibles DNIs
 * por marcadores anónimos antes de transmitir el contexto a un servicio externo de IA.
 */
export function pseudonymizeClinicalText(
  text: string,
  patientFullName: string,
  tutorName: string
): string {
  let sanitized = text;

  const tokens = [
    ...patientFullName.split(/\s+/),
    ...tutorName.replace(/[()]/g, '').split(/\s+/),
  ].filter((t) => t.length >= 3);

  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sanitized = sanitized.replace(new RegExp(escaped, 'gi'), PATIENT_PLACEHOLDER);
  }

  // Redactar teléfonos y números de documento (7-8 dígitos)
  sanitized = sanitized.replace(
    /\b\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4}\b/g,
    '[TELÉFONO_REDACTADO]'
  );
  sanitized = sanitized.replace(/\b\d{7,8}\b/g, '[DNI_REDACTADO]');

  return sanitized;
}

/**
 * Rehidrata localmente el marcador {{PACIENTE}} con el nombre real del alumno
 * únicamente en la pantalla del profesional autorizado.
 */
export function rehydrateClinicalReport(
  anonymizedReport: string,
  patientFullName: string
): string {
  return anonymizedReport.replace(/\{\{PACIENTE\}\}/g, patientFullName);
}

/**
 * Genera un borrador estructurado local sin enviar datos a terceros cuando
 * la Edge Function de Supabase no está configurada o sin conexión.
 */
export function buildStructuredLocalReport(
  student: StudentPatient,
  reportType: string,
  period: string,
  authorName: string
): string {
  const evolutions = student.history.filter((h) => h.type === 'Evolución');
  const activities = student.history.filter((h) => h.type === 'Actividad');
  const regressions = student.history.filter((h) => h.type === 'Regresión');

  return `### ${reportType.toUpperCase()}
**Paciente / Alumno:** ${student.name} | **Edad:** ${student.age} años
**Diagnóstico de Referencia:** ${student.condition}
**Período Evaluado:** ${period}
**Profesional Interviniente:** ${authorName}

---

### 1. Resumen de Objetivos e Intervenciones Terapéuticas
Durante el período ${period}, ${student.name} registró ${student.absences} inasistencia(s). Se llevaron adelante intervenciones orientadas a la autorregulación sensorial, comunicación funcional y fortalecimiento de la autonomía en actividades de la vida diaria.
${
  activities.length > 0
    ? activities.map((a) => `- **${a.title} (${a.date}):** ${a.content}`).join('\n')
    : '- Se sostuvieron actividades estructuradas dentro del encuadre terapéutico habitual.'
}

### 2. Análisis de Evoluciones y Avances Observados
${
  evolutions.length > 0
    ? evolutions.map((h) => `- **${h.title} (${h.date}):** ${h.content}`).join('\n')
    : '- Se observa progresiva adaptación a las rutinas y consignas del espacio terapéutico.'
}

### 3. Desafíos o Regresiones Registradas y Estrategias de Afrontamiento
${
  regressions.length > 0
    ? regressions.map((h) => `- **${h.title} (${h.date}):** ${h.content}`).join('\n')
    : '- No se registraron regresiones ni episodios de desregulación severa en el período evaluado.'
}

### 4. Conclusiones y Recomendaciones para la Familia y Equipo Interdisciplinario
- Sostener el uso de apoyos visuales y anticipación de rutinas en el hogar y la escuela.
- Mantener comunicación fluida con el equipo de orientación escolar y familia.
- Garantizar la continuidad y regularidad en la asistencia para consolidar los logros alcanzados.

---
*AVISO LEGAL (Ley 26.529 / Ley 25.326): Borrador clínico asistido. Requiere revisión, validación y firma del profesional tratante antes de su entrega.*`;
}
