import React from 'react';
import { Search, ChevronRight, Lock, Archive } from 'lucide-react';
import {
  getConditionColor,
  type AppRole,
  type StudentPatient,
} from '../../types/clinical';

interface PatientDirectoryProps {
  students: StudentPatient[];
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentRole: AppRole;
  showArchived: boolean;
  onToggleShowArchived: (val: boolean) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  searchQuery,
  onSearchChange,
  currentRole,
  showArchived,
  onToggleShowArchived,
}) => {
  const canViewClinical = currentRole === 'admin' || currentRole === 'profesional';

  const filtered = students.filter((s) => {
    if (!showArchived && s.archivedAt) return false;
    const q = searchQuery.toLowerCase();
    const matchName = s.name.toLowerCase().includes(q);
    const matchTutor = s.tutorName.toLowerCase().includes(q);
    const matchCondition = canViewClinical && s.condition.toLowerCase().includes(q);
    return matchName || matchTutor || matchCondition;
  });

  return (
    <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col h-[520px] lg:h-[750px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 text-base">Pacientes Registrados</h3>
        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
          Total: {filtered.length}
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder={
            canViewClinical
              ? 'Buscar paciente, tutor o diagnóstico...'
              : 'Buscar paciente o tutor...'
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
        />
      </div>

      {currentRole === 'admin' && (
        <label className="flex items-center gap-2 text-xs text-slate-500 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleShowArchived(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500"
          />
          <Archive className="w-3.5 h-3.5 text-slate-400" />
          <span>Mostrar legajos archivados (Ley 26.529)</span>
        </label>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.map((student) => (
          <div
            key={student.id}
            onClick={() => onSelectStudent(student.id)}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
              selectedStudentId === student.id
                ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200'
                : student.archivedAt
                  ? 'bg-slate-100/80 border-slate-200 opacity-75'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {student.name}
                </span>
                {student.archivedAt && (
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Archivado
                  </span>
                )}
                {student.absences >= 3 && !student.archivedAt && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                    {student.absences} Faltas
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {student.age} años • Tutor: {student.tutorName}
              </div>
              <div className="text-[11px]">
                {canViewClinical ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${getConditionColor(
                      student.condition
                    )}`}
                  >
                    {student.condition}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                    <Lock className="w-2.5 h-2.5" /> Diagnóstico reservado
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
