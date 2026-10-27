import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  XCircle,
  Lock,
  CalendarDays,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
} from 'lucide-react';
import {
  formatAge,
  getConditionColor,
  getStudentSlots,
  type AppRole,
  type DayOfWeek,
  type ScheduleConfig,
  type StudentPatient,
  type TimeSlotAssignment,
  type TimeSlotItem,
} from '../../types/clinical';

export interface SlotMatchItem {
  student: StudentPatient;
  slotInfo: TimeSlotAssignment;
}

interface ScheduleGridProps {
  activeDays: DayOfWeek[];
  timeSlots: TimeSlotItem[];
  scheduleConfig: ScheduleConfig;
  currentRole: AppRole;
  workspaceOwnerName: string;
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

type ShiftFilter = 'ALL' | 'mañana' | 'tarde';

const DAY_INDEX_OFFSET: Record<DayOfWeek, number> = {
  Lunes: 0,
  Martes: 1,
  Miércoles: 2,
  Jueves: 3,
  Viernes: 4,
  Sábado: 5,
};

function getMondayOfWeek(referenceDateStr: string): Date {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  activeDays,
  timeSlots,
  scheduleConfig,
  currentRole,
  workspaceOwnerName,
  getStudentsInSlot,
  onSelectStudent,
  onAddAbsence,
  onRemoveFromSlot,
  onOpenAssignModal,
}) => {
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>(
    activeDays[0] || 'Lunes'
  );
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('ALL');

  const todayYMD = useMemo(() => formatDateYMD(new Date()), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayYMD);

  const mondayDate = useMemo(
    () => getMondayOfWeek(selectedDateStr),
    [selectedDateStr]
  );

  // Calcula la fecha exacta de cada día de la semana seleccionada en el calendario
  const dayDatesMap = useMemo(() => {
    const map: Record<DayOfWeek, { shortLabel: string; ymd: string; isToday: boolean }> =
      {} as any;
    (['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as DayOfWeek[]).forEach(
      (dayName) => {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + DAY_INDEX_OFFSET[dayName]);
        const ymd = formatDateYMD(d);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        map[dayName] = {
          shortLabel: `${dd}/${mm}`,
          ymd,
          isToday: ymd === todayYMD,
        };
      }
    );
    return map;
  }, [mondayDate, todayYMD]);

  const weekRangeLabel = useMemo(() => {
    const firstDay = dayDatesMap[activeDays[0] || 'Lunes'];
    const lastDay = dayDatesMap[activeDays[activeDays.length - 1] || 'Viernes'];
    return `${firstDay?.shortLabel || ''} al ${lastDay?.shortLabel || ''}/${mondayDate.getFullYear()}`;
  }, [dayDatesMap, activeDays, mondayDate]);

  const moveWeek = (deltaWeeks: number) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + deltaWeeks * 7);
    setSelectedDateStr(formatDateYMD(d));
  };

  const visibleTimeSlots = useMemo(() => {
    if (shiftFilter === 'ALL') return timeSlots;
    return timeSlots.filter((s) => s.shift === shiftFilter);
  }, [timeSlots, shiftFilter]);

  const morningSlotsCount = useMemo(
    () => timeSlots.filter((s) => s.shift === 'mañana').length,
    [timeSlots]
  );
  const afternoonSlotsCount = useMemo(
    () => timeSlots.filter((s) => s.shift === 'tarde').length,
    [timeSlots]
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
          {slotMatches.map(({ student }) => {
            const totalWeeklySlots = getStudentSlots(student).length;

            return (
              <div
                key={`${student.id}-${day}-${slot.id}`}
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
                    <span className="truncate">{formatAge(student.age, student.ageUnit)}</span>
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
                        <Lock className="w-2.5 h-2.5" /> Dato Clínico Reservado
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
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* CABECERA CON CALENDARIO SEMANAL Y SELECTOR DE TURNO MAÑANA / TARDE */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">
                Agenda Personal — {workspaceOwnerName}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Semana del{' '}
                {weekRangeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {scheduleConfig.splitShifts
                ? `Horario Cortado: Mañana y Tarde • Módulos de ${scheduleConfig.slotDuration} min.`
                : `Jornada de ${scheduleConfig.startHour}:00 a ${scheduleConfig.endHour}:00 hs • Módulos de ${scheduleConfig.slotDuration} min.`}
            </p>
          </div>

          {/* Controles del Calendario (Semana Anterior / Selector Fecha / Hoy / Siguiente) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => moveWeek(-1)}
                title="Semana anterior"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <CalendarDays className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDateStr(e.target.value);
                  }}
                  aria-label="Seleccionar fecha del calendario"
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setSelectedDateStr(todayYMD)}
                className="px-2.5 py-1 rounded-lg bg-white text-teal-700 hover:bg-teal-50 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => moveWeek(1)}
                title="Semana siguiente"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra Inferior: Filtro Turno Mañana / Turno Tarde + Leyenda de Faltas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShiftFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                shiftFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jornada Completa ({timeSlots.length})
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('mañana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                shiftFilter === 'mañana'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Turno Mañana ({morningSlotsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('tarde')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                shiftFilter === 'tarde'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>Turno Tarde ({afternoonSlotsCount})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Sin faltas</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>1-2 Faltas</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>3+ Faltas</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE DAY SELECTOR (< md) */}
      <div className="md:hidden bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {activeDays.map((day) => {
            const dateInfo = dayDatesMap[day];
            return (
              <button
                key={day}
                onClick={() => setSelectedMobileDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer ${
                  selectedMobileDay === day
                    ? 'bg-teal-600 text-white shadow-sm'
                    : dateInfo?.isToday
                      ? 'bg-teal-50 text-teal-800 border border-teal-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day} {dateInfo?.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {visibleTimeSlots.map((slot) => (
            <div
              key={`${selectedMobileDay}-${slot.id}`}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>{slot.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      slot.shift === 'mañana'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {slot.shift === 'mañana' ? 'Mañana' : 'Tarde'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedMobileDay} {dayDatesMap[selectedMobileDay]?.shortLabel}
                </span>
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
              <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                Horario / Turno
              </th>
              {activeDays.map((day) => {
                const dateInfo = dayDatesMap[day];
                return (
                  <th
                    key={day}
                    className={`p-2.5 text-center border-l border-slate-200 ${
                      dateInfo?.isToday ? 'bg-teal-50/90' : ''
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {day}
                    </div>
                    <div
                      className={`text-[11px] font-semibold mt-0.5 ${
                        dateInfo?.isToday
                          ? 'text-teal-700 font-extrabold'
                          : 'text-slate-500'
                      }`}
                    >
                      {dateInfo?.shortLabel}
                      {dateInfo?.isToday ? ' • HOY' : ''}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visibleTimeSlots.map((slot, index) => {
              const prevSlot = index > 0 ? visibleTimeSlots[index - 1] : null;
              const isFirstAfternoonAfterMorning =
                prevSlot && prevSlot.shift === 'mañana' && slot.shift === 'tarde';

              return (
                <React.Fragment key={slot.id}>
                  {isFirstAfternoonAfterMorning && (
                    <tr className="bg-indigo-50/70 border-y border-indigo-200">
                      <td
                        colSpan={activeDays.length + 1}
                        className="px-4 py-1.5 text-[11px] font-bold text-indigo-900 uppercase tracking-wider text-center"
                      >
                        🌇 Inicio de Turno Tarde
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-xs font-semibold text-slate-700 bg-slate-50">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{slot.id}</span>
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          slot.shift === 'mañana'
                            ? 'bg-amber-100/80 text-amber-800'
                            : 'bg-indigo-100/80 text-indigo-800'
                        }`}
                      >
                        {slot.shift === 'mañana' ? '☀️ Mañana' : '🌇 Tarde'}
                      </span>
                    </td>

                    {activeDays.map((day) => {
                      const dateInfo = dayDatesMap[day];
                      return (
                        <td
                          key={`${day}-${slot.id}`}
                          className={`p-2 border-l border-slate-200 align-top h-28 relative ${
                            dateInfo?.isToday ? 'bg-teal-50/20' : ''
                          }`}
                        >
                          {renderSlotCell(day, slot)}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
