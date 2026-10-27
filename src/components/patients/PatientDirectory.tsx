import React from 'react';
import { Search, ChevronRight, Lock, Archive } from 'lucide-react';
import {
  getStudentAgeLabel,
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
    <div className="lg:col-span-1 paper-sheet p-4 flex flex-col h-[520px] lg:h-[750px]">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl text-slate-900">Mis pacientes</h3>
        <span className="text-sm text-slate-500">{filtered.length}</span>
      </div>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          aria-label="Buscar paciente"
          placeholder={canViewClinical ? 'Buscar por nombre, tutor o diagnóstico' : 'Buscar por nombre o tutor'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#fffdf7] border border-slate-300 rounded-[3px] text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
      </div>

      {currentRole === 'admin' && (
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleShowArchived(e.target.checked)}
            className="accent-teal-700"
          />
          <Archive className="w-4 h-4 text-slate-500" />
          Mostrar legajos archivados
        </label>
      )}

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pt-1">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 py-6 text-center">
            {searchQuery
              ? 'Ningún paciente coincide con la búsqueda.'
              : 'Todavía no hay pacientes. Usá "Nuevo paciente" para cargar el primero.'}
          </p>
        )}
        {filtered.map((student) => {
          const selected = selectedStudentId === student.id;
          return (
            <button
              type="button"
              key={student.id}
              onClick={() => onSelectStudent(student.id)}
              aria-current={selected ? 'true' : undefined}
              className={`slip-card w-full text-left p-3 flex items-center justify-between gap-2 transition cursor-pointer ${
                selected
                  ? 'border-l-4 border-l-teal-700 bg-[#fffaf0]'
                  : student.archivedAt
                    ? 'opacity-70'
                    : 'hover:bg-[#fffaf0]'
              }`}
            >
              <span className="min-w-0 space-y-1">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[15px] text-slate-900 truncate">
                    {student.name}
                  </span>
                  {student.archivedAt && (
                    <span className="stamp-pill text-slate-500">archivado</span>
                  )}
                  {student.absences >= 3 && !student.archivedAt && (
                    <span className="stamp-pill text-rose-600">{student.absences} faltas</span>
                  )}
                </span>
                <span className="block text-xs text-slate-600 truncate">
                  {getStudentAgeLabel(student)}, tutor: {student.tutorName}
                </span>
                {canViewClinical ? (
                  <span className="tape-tag text-[11px]">{student.condition}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Lock className="w-3 h-3" /> Diagnóstico reservado
                  </span>
                )}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
