import React, { useState, useMemo } from 'react';
import {
  Clock,
  RotateCcw,
  Sparkles,
  Archive,
  Plus,
  Save,
  User,
  Lock,
  ShieldCheck,
  FileWarning,
  History,
  X,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  FileText,
  Cake,
} from 'lucide-react';
import {
  formatDateAR,
  getConditionColor,
  getStudentAgeLabel,
  getStudentSlots,
  type AppRole,
  type ClinicalEntryType,
  type DayOfWeek,
  type StudentPatient,
} from '../../types/clinical';
import { ClinicalEntrySchema } from '../../schemas/clinical.schema';

interface ClinicalDossierProps {
  student: StudentPatient | undefined;
  currentRole: AppRole;
  currentUserName: string;
  onAddAbsence: (studentId: string) => void;
  onResetAbsences: (studentId: string) => void;
  onRemoveSlot: (studentId: string, day: DayOfWeek, hour: string) => void;
  onArchiveStudent: (studentId: string, reason: string) => void;
  onUpdateBirthDate: (studentId: string, birthDate: string) => void;
  onAddClinicalEntry: (
    studentId: string,
    entry: {
      date: string;
      type: ClinicalEntryType;
      title: string;
      content: string;
      amendsEntryId?: string;
    }
  ) => void;
  onGoToReports: () => void;
}

type HistoryFilterTab = 'ALL' | 'Actividad' | 'Evolución' | 'Regresión' | 'Enmienda';

export const ClinicalDossier: React.FC<ClinicalDossierProps> = ({
  student,
  currentRole,
  currentUserName,
  onAddAbsence,
  onResetAbsences,
  onRemoveSlot,
  onArchiveStudent,
  onUpdateBirthDate,
  onAddClinicalEntry,
  onGoToReports,
}) => {
  const canViewClinical = currentRole === 'admin' || currentRole === 'profesional';

  const [newEntry, setNewEntry] = useState<{
    type: ClinicalEntryType;
    title: string;
    content: string;
    date: string;
    amendsEntryId: string;
  }>({
    type: 'Actividad',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    amendsEntryId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showAttendanceLog, setShowAttendanceLog] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilterTab>('ALL');

  const filteredHistory = useMemo(() => {
    if (!student) return [];
    if (historyFilter === 'ALL') return student.history;
    return student.history.filter((h) => h.type === historyFilter);
  }, [student, historyFilter]);

  if (!student) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[500px] lg:min-h-[750px] flex flex-col items-center justify-center text-center text-slate-400">
        <User className="w-12 h-12 mb-3 text-slate-300" />
        <p className="font-medium text-slate-600">Selecciona un paciente de la lista</p>
        <p className="text-xs text-slate-400 mt-1">
          {canViewClinical
            ? 'Podrás consultar su diagnóstico, sus actividades individuales, su historial clínico y generar informes de IA.'
            : 'Podrás gestionar sus turnos semanales asignados, datos de contacto del tutor e inasistencias.'}
        </p>
      </div>
    );
  }

  const assignedSlots = getStudentSlots(student);
  const activitiesCount = student.history.filter((h) => h.type === 'Actividad').length;
  const evolutionsCount = student.history.filter((h) => h.type === 'Evolución').length;
  const regressionsCount = student.history.filter((h) => h.type === 'Regresión').length;

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = ClinicalEntrySchema.safeParse({
      date: newEntry.date,
      type: newEntry.type,
      title: newEntry.title,
      content: newEntry.content,
      amendsEntryId: newEntry.amendsEntryId || undefined,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || 'Datos inválidos.');
      return;
    }

    onAddClinicalEntry(student.id, parsed.data);
    setNewEntry({
      type: newEntry.type,
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      amendsEntryId: '',
    });
  };

  const handleRequestArchive = () => {
    const reason = window.prompt(
      'Ley 26.529 (Art. 18): Las historias clínicas no se destruyen, se archivan con conservación legal mínima de 10 años.\n\nIndique el motivo de archivo del legajo (ej. Alta terapéutica, Pase de institución):'
    );
    if (reason && reason.trim().length >= 3) {
      onArchiveStudent(student.id, reason.trim());
    }
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[750px] flex flex-col">
      <div className="flex-1 flex flex-col space-y-6">
        {/* ENCABEZADO DEL PACIENTE */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
              {canViewClinical ? (
                <span
                  className={`px-2.5 py-1 rounded text-xs font-medium border ${getConditionColor(
                    student.condition
                  )}`}
                >
                  {student.condition}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
                  <Lock className="w-3 h-3" /> Diagnóstico Protegido (Ley 25.326)
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500">
              <strong className="text-slate-700">{getStudentAgeLabel(student)}</strong> •
              Tutor Responsable: {student.tutorName} ({student.phone})
            </p>

            {/* FECHA DE NACIMIENTO: la edad se recalcula sola a partir de este dato */}
            <div
              className={`flex flex-wrap items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border w-fit ${
                student.birthDate
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <Cake className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">
                {student.birthDate
                  ? `Nacimiento: ${formatDateAR(student.birthDate)}`
                  : 'Cargue la fecha de nacimiento para que la edad se actualice sola:'}
              </span>
              <input
                type="date"
                aria-label="Fecha de nacimiento"
                max={new Date().toISOString().split('T')[0]}
                value={student.birthDate || ''}
                onChange={(e) => {
                  if (e.target.value) onUpdateBirthDate(student.id, e.target.value);
                }}
                className="text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* LISTA DE TURNOS SEMANALES DEL PACIENTE */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Turnos Semanales ({assignedSlots.length}{' '}
                  {assignedSlots.length === 1 ? 'sesión' : 'sesiones'} por semana):
                </span>
              </div>

              {assignedSlots.length === 0 ? (
                <span className="inline-block text-xs text-slate-400 italic">
                  Sin turnos asignados en la grilla semanal.
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {assignedSlots.map((sl) => (
                    <span
                      key={`${sl.day}-${sl.hour}-${sl.professionalId || ''}`}
                      className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-900 text-xs px-2.5 py-1 rounded-lg font-medium"
                    >
                      <strong>
                        {sl.day} {sl.hour} hs
                      </strong>
                      <button
                        type="button"
                        onClick={() => onRemoveSlot(student.id, sl.day, sl.hour)}
                        title={`Quitar turno del ${sl.day} ${sl.hour} hs`}
                        className="p-0.5 hover:bg-teal-200/70 rounded text-teal-700 hover:text-rose-700 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 text-xs text-emerald-700 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                Consentimiento Informado:{' '}
                {student.consentSigned
                  ? `Firmado (${student.consentSignedAt || 'Vigente'})`
                  : 'Pendiente de firma'}
              </span>
            </div>

            {student.archivedAt && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded">
                <Archive className="w-3.5 h-3.5" />
                <span>
                  Legajo archivado el {student.archivedAt.split('T')[0]} — Motivo:{' '}
                  {student.archiveReason}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end space-y-2 shrink-0">
            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Inasistencias:</span>
              <span
                className={`text-sm font-black px-2 py-0.5 rounded ${
                  student.absences >= 3
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {student.absences}
              </span>

              <button
                onClick={() => onAddAbsence(student.id)}
                title="Registrar Inasistencia Auditable"
                className="p-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded text-xs font-bold cursor-pointer"
              >
                +1 Falta
              </button>

              <button
                onClick={() => onResetAbsences(student.id)}
                title="Reiniciar contador de faltas (queda registrado en auditoría)"
                className="p-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowAttendanceLog((v) => !v)}
                title="Ver bitácora de asistencias y faltas"
                className="p-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded text-xs cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {canViewClinical && (
                <button
                  onClick={onGoToReports}
                  className="flex items-center space-x-1 text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Informe IA</span>
                </button>
              )}

              {canViewClinical && !student.archivedAt && (
                <button
                  onClick={handleRequestArchive}
                  className="flex items-center gap-1 p-1.5 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 cursor-pointer"
                  title="Archivar Legajo (Conservación Legal Ley 26.529)"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archivar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BITÁCORA AUDITABLE DE INASISTENCIAS */}
        {showAttendanceLog && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Registro Auditable de Inasistencias y Reinicios ({student.attendanceHistory.length})
            </h4>
            {student.attendanceHistory.length === 0 ? (
              <p className="text-xs text-slate-400">Sin eventos de inasistencia registrados.</p>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs">
                {student.attendanceHistory.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-slate-200"
                  >
                    <span>
                      <strong>{att.date}</strong> — {att.type.replace('_', ' ')}
                      {att.reason ? `: ${att.reason}` : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">{att.recordedBy}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN CLÍNICA: BLOQUEADA PARA RECEPCIÓN (RBAC) */}
        {!canViewClinical ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-700 mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Historia Clínica y Actividades Restringidas por Rol (Ley 25.326 / Ley 26.529)
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              El perfil de <strong>Recepción</strong> solo tiene acceso a datos administrativos,
              asignación de múltiples turnos semanales y control de asistencia. El diagnóstico,
              las actividades individuales y las evoluciones clínicas son de acceso exclusivo del
              profesional titular.
            </p>
          </div>
        ) : (
          <>
            {/* FORMULARIO PARA CARGAR ACTIVIDAD INDIVIDUAL, EVOLUCIÓN O REGRESIÓN */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>
                    Cargar Actividad Individual / Evolución en Historia Clínica
                  </span>
                </h4>

                {/* Botones rápidos para elegir tipo de carga */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewEntry((prev) => ({ ...prev, type: 'Actividad' }))}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      newEntry.type === 'Actividad'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    + Actividad Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntry((prev) => ({ ...prev, type: 'Evolución' }))}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      newEntry.type === 'Evolución'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    + Evolución
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntry((prev) => ({ ...prev, type: 'Regresión' }))}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      newEntry.type === 'Regresión'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    + Regresión
                  </button>
                </div>
              </div>

              {formError && (
                <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <FileWarning className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitEntry} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Fecha de la Sesión
                    </label>
                    <input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Categoría del Registro
                    </label>
                    <select
                      value={newEntry.type}
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          type: e.target.value as ClinicalEntryType,
                        })
                      }
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    >
                      <option value="Actividad">Actividad Individual / Ejercicio</option>
                      <option value="Evolución">Evolución / Avance Clínico</option>
                      <option value="Regresión">Regresión / Dificultad Observada</option>
                      <option value="Enmienda">Enmienda / Nota Aclaratoria (Ley 26.529)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Título de la {newEntry.type}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        newEntry.type === 'Actividad'
                          ? 'Ej: Motricidad fina con bloques'
                          : 'Ej: Avance en atención conjunta'
                      }
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                {newEntry.type === 'Enmienda' && student.history.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-amber-800 mb-1">
                      Asiento clínico que se rectifica / aclara:
                    </label>
                    <select
                      value={newEntry.amendsEntryId}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, amendsEntryId: e.target.value })
                      }
                      className="w-full text-xs p-2 bg-amber-50 border border-amber-300 rounded-lg outline-none"
                    >
                      <option value="">-- Seleccione el registro a enmendar --</option>
                      {student.history.map((h) => (
                        <option key={h.id} value={h.id}>
                          [{h.date}] {h.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Descripción Detallada de la {newEntry.type}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalle los ejercicios realizados, materiales utilizados, respuesta del paciente y observaciones clínicas..."
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    required
                  ></textarea>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400">
                    Profesional firmante: <strong>{currentUserName}</strong>
                  </span>
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar {newEntry.type}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* PESTAÑAS DE FILTRO: HISTORIAL COMPLETO vs ACTIVIDADES INDIVIDUALES vs EVOLUCIONES */}
            <div className="flex-1 flex flex-col space-y-3">
              <div className="space-y-2.5 border-b border-slate-200 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Historia Clínica y Actividades de {student.name}</span>
                </h4>

                <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      historyFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todo ({student.history.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistoryFilter('Actividad')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      historyFilter === 'Actividad'
                        ? 'bg-white text-indigo-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-indigo-700'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Actividades ({activitiesCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistoryFilter('Evolución')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      historyFilter === 'Evolución'
                        ? 'bg-white text-emerald-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Evoluciones ({evolutionsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistoryFilter('Regresión')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      historyFilter === 'Regresión'
                        ? 'bg-white text-rose-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-rose-700'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Regresiones ({regressionsCount})</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No hay registros en la categoría seleccionada. Usá el formulario de arriba
                    para cargar una nueva {historyFilter === 'ALL' ? 'entrada' : historyFilter}.
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        item.type === 'Evolución'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : item.type === 'Regresión'
                            ? 'bg-rose-50/50 border-rose-200'
                            : item.type === 'Actividad'
                              ? 'bg-indigo-50/40 border-indigo-200'
                              : 'bg-amber-50/60 border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              item.type === 'Evolución'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.type === 'Regresión'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.type === 'Actividad'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {item.type === 'Actividad' ? 'Actividad Individual' : item.type}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {item.date} • {item.authorName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
