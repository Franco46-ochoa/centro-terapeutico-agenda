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
      <div className="lg:col-span-2 paper-sheet p-6 min-h-[500px] lg:min-h-[750px] flex flex-col items-center justify-center text-center">
        <User className="w-10 h-10 mb-3 text-slate-400" strokeWidth={1.4} />
        <p className="text-lg font-serif text-slate-800">Elegí un paciente de la lista</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          {canViewClinical
            ? 'Vas a ver su ficha, sus turnos y su historia clínica.'
            : 'Vas a ver sus turnos, los datos del tutor y las faltas.'}
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
      setFormError(parsed.error.issues[0]?.message || 'Revisá los datos ingresados.');
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
      'La historia clínica no se borra: se archiva y se conserva al menos 10 años (Ley 26.529).\n\n¿Por qué se archiva el legajo? (por ejemplo: alta terapéutica, pase a otra institución)'
    );
    if (reason && reason.trim().length >= 3) {
      onArchiveStudent(student.id, reason.trim());
    }
  };

  const fieldClass =
    'w-full text-sm px-2.5 py-2 bg-[#fffdf7] border border-slate-300 rounded-[3px] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20';

  const ENTRY_STYLE: Record<ClinicalEntryType, { border: string; label: string; text: string }> = {
    Actividad: { border: 'border-l-indigo-500', label: 'Actividad', text: 'text-indigo-700' },
    Evolución: { border: 'border-l-emerald-500', label: 'Evolución', text: 'text-emerald-700' },
    Regresión: { border: 'border-l-rose-500', label: 'Regresión', text: 'text-rose-700' },
    Enmienda: { border: 'border-l-amber-500', label: 'Enmienda', text: 'text-amber-800' },
  };

  const typeTab = (type: ClinicalEntryType, label: string) => (
    <button
      type="button"
      onClick={() => setNewEntry((prev) => ({ ...prev, type }))}
      aria-pressed={newEntry.type === type}
      className={`px-3 py-1 rounded-[3px] text-sm transition cursor-pointer ${
        newEntry.type === type
          ? 'bg-slate-900 text-[#f3ead8] font-semibold'
          : 'text-slate-700 hover:bg-slate-200/70'
      }`}
    >
      {label}
    </button>
  );

  const filterTab = (filter: HistoryFilterTab, label: string, Icon?: typeof FileText) => (
    <button
      type="button"
      onClick={() => setHistoryFilter(filter)}
      aria-pressed={historyFilter === filter}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-sm transition cursor-pointer ${
        historyFilter === filter
          ? 'bg-slate-900 text-[#f3ead8] font-semibold'
          : 'text-slate-700 hover:bg-slate-200/70'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />}
      {label}
    </button>
  );

  return (
    <div className="lg:col-span-2 space-y-5">
      {/* FICHA DEL PACIENTE */}
      <div className="paper-shadow">
        <div className="paper-sheet torn-bottom paper-curl px-6 pt-5 pb-9">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div className="space-y-2.5 min-w-0">
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
                <h2 className="text-3xl leading-tight text-slate-900">{student.name}</h2>
                {canViewClinical ? (
                  <span className="tape-tag text-sm">{student.condition}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                    <Lock className="w-3.5 h-3.5" /> Diagnóstico reservado
                  </span>
                )}
              </div>

              <p className="text-[15px] text-slate-700">
                <span className="font-semibold text-slate-900">{getStudentAgeLabel(student)}</span>
                <span className="text-slate-400 mx-2">|</span>
                Tutor: {student.tutorName}, {student.phone}
              </p>

              {/* Fecha de nacimiento: la edad se recalcula sola */}
              <label
                className={`inline-flex flex-wrap items-center gap-2 text-sm px-2.5 py-1.5 rounded-[3px] ${
                  student.birthDate ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-900'
                }`}
              >
                <Cake className="w-4 h-4 shrink-0" strokeWidth={1.7} />
                <span>
                  {student.birthDate
                    ? `Nació el ${formatDateAR(student.birthDate)}`
                    : 'Cargá la fecha de nacimiento para que la edad se actualice sola'}
                </span>
                <input
                  type="date"
                  aria-label="Fecha de nacimiento"
                  max={new Date().toISOString().split('T')[0]}
                  value={student.birthDate || ''}
                  onChange={(e) => {
                    if (e.target.value) onUpdateBirthDate(student.id, e.target.value);
                  }}
                  className="text-sm bg-[#fffdf7] border border-slate-300 rounded-[3px] px-1.5 py-0.5 outline-none focus:border-teal-600 cursor-pointer"
                />
              </label>

              {/* Turnos semanales */}
              <div className="pt-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-1.5">
                  <Clock className="w-4 h-4 text-slate-500" strokeWidth={1.7} />
                  {assignedSlots.length === 0
                    ? 'Sin turnos asignados'
                    : `${assignedSlots.length} ${assignedSlots.length === 1 ? 'turno' : 'turnos'} por semana`}
                </div>
                {assignedSlots.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {assignedSlots.map((sl) => (
                      <span
                        key={`${sl.day}-${sl.hour}-${sl.professionalId || ''}`}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-[3px] bg-sea text-teal-900 text-sm"
                      >
                        {sl.day} {sl.hour}
                        <button
                          type="button"
                          onClick={() => onRemoveSlot(student.id, sl.day, sl.hour)}
                          title={`Quitar el turno del ${sl.day} a las ${sl.hour}`}
                          aria-label={`Quitar el turno del ${sl.day} a las ${sl.hour}`}
                          className="p-0.5 rounded hover:bg-teal-200 hover:text-rose-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.7} />
                {student.consentSigned
                  ? `Consentimiento firmado${student.consentSignedAt ? ` el ${formatDateAR(student.consentSignedAt)}` : ''}`
                  : 'Falta firmar el consentimiento'}
              </p>

              {student.archivedAt && (
                <p className="flex items-center gap-1.5 text-sm text-amber-900 bg-amber-100 px-2.5 py-1.5 rounded-[3px] w-fit">
                  <Archive className="w-4 h-4" />
                  Archivado el {formatDateAR(student.archivedAt.split('T')[0])}: {student.archiveReason}
                </p>
              )}
            </div>

            {/* Faltas y acciones */}
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`stamp-pill text-sm px-3 py-0.5 ${
                    student.absences >= 3
                      ? 'text-rose-600'
                      : student.absences > 0
                        ? 'text-amber-700'
                        : 'text-emerald-600'
                  }`}
                >
                  {student.absences} {student.absences === 1 ? 'falta' : 'faltas'}
                </span>
                <button
                  type="button"
                  onClick={() => onAddAbsence(student.id)}
                  title="Anotar una falta"
                  className="px-2 py-1 text-sm text-rose-700 border border-rose-300 rounded-[3px] hover:bg-rose-50 cursor-pointer"
                >
                  Anotar falta
                </button>
                <button
                  type="button"
                  onClick={() => onResetAbsences(student.id)}
                  title="Volver el contador de faltas a cero"
                  aria-label="Volver el contador de faltas a cero"
                  className="p-1.5 text-slate-600 border border-slate-300 rounded-[3px] hover:bg-slate-100 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAttendanceLog((v) => !v)}
                  title="Ver el registro de faltas"
                  aria-label="Ver el registro de faltas"
                  aria-expanded={showAttendanceLog}
                  className="p-1.5 text-slate-600 border border-slate-300 rounded-[3px] hover:bg-slate-100 cursor-pointer"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {canViewClinical && (
                  <button
                    type="button"
                    onClick={onGoToReports}
                    className="flex items-center gap-1.5 text-sm bg-teal-700 hover:bg-teal-800 text-[#f6eedd] px-3 py-1.5 rounded-[3px] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" strokeWidth={1.7} />
                    Armar informe
                  </button>
                )}
                {canViewClinical && !student.archivedAt && (
                  <button
                    type="button"
                    onClick={handleRequestArchive}
                    title="Archivar el legajo"
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" strokeWidth={1.7} />
                    Archivar
                  </button>
                )}
              </div>
            </div>
          </div>

          {showAttendanceLog && (
            <div className="mt-5 pt-4 border-t border-dashed border-slate-300">
              <h3 className="text-lg text-slate-900 mb-2">Registro de faltas</h3>
              {student.attendanceHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No hay faltas registradas.</p>
              ) : (
                <ul className="max-h-40 overflow-y-auto divide-y divide-slate-200 text-sm">
                  {student.attendanceHistory.map((att) => (
                    <li key={att.id} className="flex items-center justify-between gap-3 py-1.5">
                      <span>
                        <span className="font-semibold">{formatDateAR(att.date)}</span>{' '}
                        {att.type.replace(/_/g, ' ')}
                        {att.reason ? `: ${att.reason}` : ''}
                      </span>
                      <span className="text-xs text-slate-500 shrink-0">{att.recordedBy}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {!canViewClinical ? (
        <div className="paper-sheet p-8 text-center">
          <Lock className="w-7 h-7 mx-auto mb-2 text-slate-500" strokeWidth={1.5} />
          <h3 className="text-xl text-slate-900">La historia clínica es solo para el profesional</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            Desde recepción podés gestionar turnos, datos del tutor y faltas.
          </p>
        </div>
      ) : (
        <>
          {/* CARGA DE UN NUEVO REGISTRO, sobre papel rayado */}
          <div className="ruled-paper slip-card px-5 pt-4 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-xl text-slate-900 flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-slate-500" strokeWidth={1.6} />
                Nuevo registro
              </h3>
              <div className="flex items-center gap-1 p-1 rounded-md bg-slate-100 border border-slate-200">
                {typeTab('Actividad', 'Actividad')}
                {typeTab('Evolución', 'Evolución')}
                {typeTab('Regresión', 'Regresión')}
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-3 px-3 py-2 border-l-4 border-rose-500 bg-rose-50 text-rose-800 text-sm flex items-center gap-2"
              >
                <FileWarning className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="entry-date" className="block text-sm font-semibold text-slate-700 mb-1">
                    Fecha de la sesión
                  </label>
                  <input
                    id="entry-date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="entry-type" className="block text-sm font-semibold text-slate-700 mb-1">
                    Tipo de registro
                  </label>
                  <select
                    id="entry-type"
                    value={newEntry.type}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, type: e.target.value as ClinicalEntryType })
                    }
                    className={fieldClass}
                  >
                    <option value="Actividad">Actividad</option>
                    <option value="Evolución">Evolución</option>
                    <option value="Regresión">Regresión</option>
                    <option value="Enmienda">Enmienda (corrige un registro anterior)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="entry-title" className="block text-sm font-semibold text-slate-700 mb-1">
                    Título
                  </label>
                  <input
                    id="entry-title"
                    type="text"
                    placeholder={
                      newEntry.type === 'Actividad'
                        ? 'Por ejemplo, encastre de formas'
                        : 'Por ejemplo, sostiene la mirada'
                    }
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              {newEntry.type === 'Enmienda' && student.history.length > 0 && (
                <div>
                  <label htmlFor="entry-amends" className="block text-sm font-semibold text-amber-900 mb-1">
                    Registro que se corrige
                  </label>
                  <select
                    id="entry-amends"
                    value={newEntry.amendsEntryId}
                    onChange={(e) => setNewEntry({ ...newEntry, amendsEntryId: e.target.value })}
                    className={fieldClass}
                  >
                    <option value="">Elegí el registro</option>
                    {student.history.map((h) => (
                      <option key={h.id} value={h.id}>
                        {formatDateAR(h.date)}: {h.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="entry-content" className="block text-sm font-semibold text-slate-700 mb-1">
                  Qué se trabajó y cómo respondió
                </label>
                <textarea
                  id="entry-content"
                  rows={3}
                  placeholder="Materiales, consignas, nivel de apoyo, respuesta del paciente…"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className={`${fieldClass} resize-y leading-7`}
                  required
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-500">Firma: {currentUserName}</span>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-[#f6eedd] text-sm font-semibold px-4 py-2 rounded-[3px] cursor-pointer"
                >
                  <Save className="w-4 h-4" strokeWidth={1.7} />
                  Guardar {newEntry.type.toLowerCase()}
                </button>
              </div>
            </form>
          </div>

          {/* HISTORIA CLÍNICA: notas apiladas */}
          <div className="paper-sheet px-5 pt-4 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-xl text-slate-900">Historia clínica</h3>
              <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-md bg-slate-100 border border-slate-200">
                {filterTab('ALL', `Todo (${student.history.length})`)}
                {filterTab('Actividad', `Actividades (${activitiesCount})`, ClipboardList)}
                {filterTab('Evolución', `Evoluciones (${evolutionsCount})`, TrendingUp)}
                {filterTab('Regresión', `Regresiones (${regressionsCount})`, AlertTriangle)}
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredHistory.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  {historyFilter === 'ALL'
                    ? 'Todavía no hay registros. Cargá el primero arriba.'
                    : 'No hay registros de este tipo.'}
                </p>
              ) : (
                filteredHistory.map((item) => {
                  const style = ENTRY_STYLE[item.type];
                  return (
                    <article
                      key={item.id}
                      className={`slip-card border-l-4 ${style.border} px-4 py-3`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-1">
                        <h4 className="text-[15px] font-semibold text-slate-900">
                          <span className={`${style.text} font-semibold mr-2`}>{style.label}</span>
                          {item.title}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {formatDateAR(item.date)}, {item.authorName}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
