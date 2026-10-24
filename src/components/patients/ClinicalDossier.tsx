import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  getConditionColor,
  type AppRole,
  type ClinicalEntryType,
  type StudentPatient,
} from '../../types/clinical';
import { ClinicalEntrySchema } from '../../schemas/clinical.schema';

interface ClinicalDossierProps {
  student: StudentPatient | undefined;
  currentRole: AppRole;
  currentUserName: string;
  onAddAbsence: (studentId: string) => void;
  onResetAbsences: (studentId: string) => void;
  onArchiveStudent: (studentId: string, reason: string) => void;
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

export const ClinicalDossier: React.FC<ClinicalDossierProps> = ({
  student,
  currentRole,
  currentUserName,
  onAddAbsence,
  onResetAbsences,
  onArchiveStudent,
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
    type: 'Evolución',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    amendsEntryId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showAttendanceLog, setShowAttendanceLog] = useState(false);

  if (!student) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[500px] lg:min-h-[750px] flex flex-col items-center justify-center text-center text-slate-400">
        <User className="w-12 h-12 mb-3 text-slate-300" />
        <p className="font-medium text-slate-600">Selecciona un paciente de la lista</p>
        <p className="text-xs text-slate-400 mt-1">
          {canViewClinical
            ? 'Podrás consultar su diagnóstico, registrar evoluciones inmutables y generar informes de IA.'
            : 'Podrás gestionar su turno asignado, datos de contacto del tutor e inasistencias.'}
        </p>
      </div>
    );
  }

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
      type: 'Evolución',
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
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

            <p className="text-sm text-slate-500 mt-1">
              {student.age} años • Tutor Responsable: {student.tutorName} ({student.phone})
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Turno:{' '}
                  {student.slot
                    ? `${student.slot.day} a las ${student.slot.hour} hs`
                    : 'Sin horario asignado'}
                </span>
              </div>

              <div className="flex items-center space-x-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  Consentimiento Informado:{' '}
                  {student.consentSigned
                    ? `Firmado (${student.consentSignedAt || 'Vigente'})`
                    : 'Pendiente de firma'}
                </span>
              </div>
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

          <div className="flex flex-col items-start md:items-end space-y-2">
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
                className="p-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded text-xs font-bold"
              >
                +1 Falta
              </button>

              <button
                onClick={() => onResetAbsences(student.id)}
                title="Reiniciar contador de faltas (queda registrado en auditoría)"
                className="p-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowAttendanceLog((v) => !v)}
                title="Ver bitácora de asistencias y faltas"
                className="p-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded text-xs"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {canViewClinical && (
                <button
                  onClick={onGoToReports}
                  className="flex items-center space-x-1 text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Informe IA</span>
                </button>
              )}

              {currentRole === 'admin' && !student.archivedAt && (
                <button
                  onClick={handleRequestArchive}
                  className="flex items-center gap-1 p-1.5 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200"
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
              Historia Clínica Restringida por Rol (Ley 25.326 / Ley 26.529)
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              El perfil de <strong>Recepción</strong> solo tiene acceso a datos administrativos,
              asignación de turnos y control de asistencia. El diagnóstico y las evoluciones
              clínicas están protegidos para profesionales con MFA activo.
            </p>
          </div>
        ) : (
          <>
            {/* FORMULARIO APPEND-ONLY DE HISTORIA CLÍNICA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>Registrar Nuevo Asiento Clínico Inmutable (Ley 26.529)</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Firmante: <strong>{currentUserName}</strong>
                </span>
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
                      Fecha de Sesión
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
                      Tipo de Registro
                    </label>
                    <select
                      value={newEntry.type}
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          type: e.target.value as ClinicalEntryType,
                        })
                      }
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Evolución">Evolución / Avance</option>
                      <option value="Actividad">Actividad / Ejercicio</option>
                      <option value="Regresión">Regresión / Dificultad</option>
                      <option value="Enmienda">Enmienda / Fe de Erratas (Ley 26.529)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Título Resumido
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Juego simbólico compartido"
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
                    Observaciones / Notas Detalladas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe la conducta, materiales utilizados, nivel de apoyo y resultados..."
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    required
                  ></textarea>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Los asientos firmados son inalterables. Si requiere corregir un dato posterior,
                    utilice el tipo &quot;Enmienda&quot;.
                  </span>
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Firmar y Guardar</span>
                  </button>
                </div>
              </form>
            </div>

            {/* LISTADO CRONOLÓGICO DE HISTORIA CLÍNICA */}
            <div className="flex-1 flex flex-col space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Historial Clínico Terapéutico</span>
                <span className="text-slate-400 font-normal">
                  ({student.history.length} asientos inmutables)
                </span>
              </h4>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
                {student.history.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No hay entradas registradas en el historial.
                  </div>
                ) : (
                  student.history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        item.type === 'Evolución'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : item.type === 'Regresión'
                            ? 'bg-rose-50/50 border-rose-200'
                            : item.type === 'Enmienda'
                              ? 'bg-amber-50/60 border-amber-300'
                              : 'bg-slate-50 border-slate-200'
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
                                  : item.type === 'Enmienda'
                                    ? 'bg-amber-200 text-amber-900'
                                    : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {item.type}
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
