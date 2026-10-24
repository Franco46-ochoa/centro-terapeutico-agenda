import React, { useState } from 'react';
import { Clock, Plus, Trash2, XCircle, Lock, UserCheck, CalendarDays } from 'lucide-react';
import {
  getConditionColor,
  getStudentSlots,
  type AppRole,
  type DayOfWeek,
  type ScheduleConfig,
  type StudentPatient,
  type TimeSlotAssignment,
  type TimeSlotItem,
} from '../../types/clinical';
import type { StaffMember } from '../../hooks/useAuth';

export interface SlotMatchItem {
  student: StudentPatient;
  slotInfo: TimeSlotAssignment;
}

interface ScheduleGridProps {
  activeDays: DayOfWeek[];
  timeSlots: TimeSlotItem[];
  scheduleConfig: ScheduleConfig;
  currentRole: AppRole;
  professionals: StaffMember[];
  selectedProfessionalFilter: string;
  onChangeProfessionalFilter: (profId: string) => void;
  getStudentsInSlot: (day: DayOfWeek, hour: string) => SlotMatchItem[];
  onSelectStudent: (studentId: string) => void;
  onAddAbsence: (studentId: string, e?: React.MouseEvent) => void;
  onRemoveFromSlot: (
    studentId: string,
    day: DayOfWeek,
    hour: string,
    e?: React.MouseEvent
  ) => void;
  onOpenAssignModal: (day: DayOfWeek, hour: string) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  activeDays,
  timeSlots,
  scheduleConfig,
  currentRole,
  professionals,
  selectedProfessionalFilter,
  onChangeProfessionalFilter,
  getStudentsInSlot,
  onSelectStudent,
  onAddAbsence,
  onRemoveFromSlot,
  onOpenAssignModal,
}) => {
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>(
    activeDays[0] || 'Lunes'
  );
  const canViewClinical = currentRole === 'admin' || currentRole === 'profesional';

  const renderSlotCell = (day: DayOfWeek, slot: TimeSlotItem) => {
    const slotMatches = getStudentsInSlot(day, slot.id);

    if (slotMatches.length === 0) {
      return (
        <button
          onClick={() => onOpenAssignModal(day, slot.id)}
          className="w-full h-full min-h-[84px] border-2 border-dashed border-slate-200 rounded-lg hover:border-teal-400 hover:bg-teal-50/30 flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 transition-all p-2 group cursor-pointer"
        >
          <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium">Asignar Turno</span>
        </button>
      );
    }

    return (
      <div className="space-y-2 h-full flex flex-col justify-between">
        <div className="space-y-1.5">
          {slotMatches.map(({ student, slotInfo }) => {
            const totalWeeklySlots = getStudentSlots(student).length;
            const profLabel = slotInfo.professionalName || student.professionalName;

            return (
              <div
                key={`${student.id}-${day}-${slot.id}-${slotInfo.professionalId || ''}`}
                onClick={() => onSelectStudent(student.id)}
                className={`p-2.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all hover:shadow-md relative group ${
                  student.absences >= 3
                    ? 'bg-rose-50 border-rose-300 hover:border-rose-400'
                    : student.absences > 0
                      ? 'bg-amber-50 border-amber-300 hover:border-amber-400'
                      : 'bg-teal-50 border-teal-200 hover:border-teal-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span
                      className="font-bold text-xs text-slate-900 truncate"
                      title={student.name}
                    >
                      {student.name}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center shrink-0 ${
                        student.absences >= 3
                          ? 'bg-rose-600 text-white animate-pulse'
                          : student.absences > 0
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <span>{student.absences} Faltas</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span className="truncate">{student.age} años</span>
                    {totalWeeklySlots > 1 && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded"
                        title="Cantidad de sesiones por semana de este paciente"
                      >
                        <CalendarDays className="w-2.5 h-2.5" />
                        {totalWeeklySlots}x sem
                      </span>
                    )}
                  </div>

                  {profLabel && (
                    <div className="text-[10px] font-semibold text-teal-800 bg-white/80 border border-teal-200/80 rounded px-1.5 py-0.5 mb-1 truncate flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate">{profLabel}</span>
                    </div>
                  )}

                  <div className="mt-1">
                    {canViewClinical ? (
                      <span
                        className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium truncate max-w-full ${getConditionColor(
                          student.condition
                        )}`}
                      >
                        {student.condition}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
                        <Lock className="w-2.5 h-2.5" /> Dato Clínico Protegido
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-teal-700 font-medium hover:underline">
                    {canViewClinical ? 'Ver Historia Clínica' : 'Ver Ficha Turno'}
                  </span>

                  <div
                    className="flex items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => onAddAbsence(student.id, e)}
                      title="Registrar Inasistencia Auditable"
                      className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => onRemoveFromSlot(student.id, day, slot.id, e)}
                      title={`Liberar solo el turno del ${day} ${slot.id} hs`}
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón para sumar otro turno en la misma hora (otro consultorio/profesional) */}
        <button
          onClick={() => onOpenAssignModal(day, slot.id)}
          className="w-full py-1 border border-dashed border-slate-300 rounded text-[10px] text-slate-500 hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50/40 flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Agregar turno en este horario
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Agenda de Turnos</h2>
          <p className="text-xs text-slate-500">
            Días: {activeDays.join(', ')} ({scheduleConfig.startHour}:00 a{' '}
            {scheduleConfig.endHour}:00 hs • módulos de {scheduleConfig.slotDuration}{' '}
            min). Podés asignar 2, 3 o más turnos por semana a cada paciente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Profesional */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Agenda de:</span>
            <select
              value={selectedProfessionalFilter}
              onChange={(e) => onChangeProfessionalFilter(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Profesionales ({professionals.length})</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.fullName} ({prof.specialtyOrLicense})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Sin faltas</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>1-2 Faltas</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span>3+ Faltas</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE DAY SELECTOR (< md) */}
      <div className="md:hidden bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {activeDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedMobileDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                selectedMobileDay === day
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {timeSlots.map((slot) => (
            <div
              key={`${selectedMobileDay}-${slot.id}`}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  {slot.label}
                </span>
                <span className="text-[11px] text-slate-400">{selectedMobileDay}</span>
              </div>
              {renderSlotCell(selectedMobileDay, slot)}
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP SCHEDULE GRID TABLE (>= md) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">
                Módulo
              </th>
              {activeDays.map((day) => (
                <th
                  key={day}
                  className="p-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-l border-slate-200"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {timeSlots.map((slot) => (
              <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-xs font-semibold text-slate-600 bg-slate-50 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{slot.id}</span>
                </td>

                {activeDays.map((day) => (
                  <td
                    key={`${day}-${slot.id}`}
                    className="p-2 border-l border-slate-200 align-top h-28 relative"
                  >
                    {renderSlotCell(day, slot)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
