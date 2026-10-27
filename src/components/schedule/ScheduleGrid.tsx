import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Lock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Pencil,
  Eraser,
  SquarePen,
} from 'lucide-react';
import {
  getStudentAgeLabel,
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

  const renderAbsenceStamp = (absences: number) => {
    const tone =
      absences >= 3
        ? 'text-rose-600'
        : absences > 0
          ? 'text-amber-700'
          : 'text-emerald-600';
    return (
      <span className={`stamp-pill shrink-0 ${tone}`}>
        {absences} {absences === 1 ? 'falta' : 'faltas'}
      </span>
    );
  };

  const renderCondition = (condition: string) => {
    const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(condition);
    const fullName = match ? match[1] : condition;
    const short = match ? match[2] : null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {short && (
          <span className="px-1.5 py-px rounded-sm bg-sea text-teal-800 text-[10px] font-bold">
            {short}
          </span>
        )}
        <span className="tape-tag text-[11px] leading-snug truncate max-w-full">
          {fullName}
        </span>
      </div>
    );
  };

  const renderSlotCell = (day: DayOfWeek, slot: TimeSlotItem) => {
    const slotMatches = getStudentsInSlot(day, slot.id);

    if (slotMatches.length === 0) {
      return (
        <button
          type="button"
          onClick={() => onOpenAssignModal(day, slot.id)}
          className="kraft-slot paper-curl w-full h-full min-h-[96px] flex flex-col items-center justify-center gap-1 text-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" strokeWidth={1.4} />
          <span className="text-xs">Asignar turno</span>
        </button>
      );
    }

    return (
      <div className="space-y-2 h-full">
        {slotMatches.map(({ student }) => {
          const totalWeeklySlots = getStudentSlots(student).length;

          return (
            <div
              key={`${student.id}-${day}-${slot.id}`}
              className="slip-card paper-curl p-2.5 pb-2 flex flex-col justify-between min-h-[96px]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(student.id)}
                    className="text-left font-semibold text-[13px] leading-tight text-slate-900 hover:underline decoration-slate-400 underline-offset-2 cursor-pointer"
                    title={student.name}
                  >
                    {student.name}
                  </button>
                  {renderAbsenceStamp(student.absences)}
                </div>

                <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-slate-600">
                  <span>{getStudentAgeLabel(student)}</span>
                  {totalWeeklySlots > 1 && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 rounded-sm bg-sea text-teal-800 font-semibold"
                      title="Sesiones por semana"
                    >
                      <CalendarDays className="w-3 h-3" strokeWidth={1.8} />
                      {totalWeeklySlots}x sem
                    </span>
                  )}
                </div>

                {canViewClinical ? (
                  renderCondition(student.condition)
                ) : (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-slate-500">
                    <Lock className="w-3 h-3" /> Diagnóstico reservado
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-dashed border-slate-300/80">
                <button
                  type="button"
                  onClick={() => onSelectStudent(student.id)}
                  className="text-[11px] text-slate-700 hover:text-slate-950 hover:underline underline-offset-2 cursor-pointer"
                >
                  {canViewClinical ? 'Ver historia clínica' : 'Ver ficha'}
                </button>

                <div className="flex items-center gap-0.5 pr-4 text-slate-600">
                  <button
                    type="button"
                    onClick={(e) => onAddAbsence(student.id, e)}
                    title="Anotar una falta"
                    aria-label={`Anotar una falta a ${student.name}`}
                    className="p-1 rounded hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.7} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onRemoveFromSlot(student.id, day, slot.id, e)}
                    title={`Liberar el turno del ${day} a las ${slot.id}`}
                    aria-label={`Liberar el turno de ${student.name} del ${day} a las ${slot.id}`}
                    className="p-1 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" strokeWidth={1.7} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectStudent(student.id)}
                    title="Abrir la ficha"
                    aria-label={`Abrir la ficha de ${student.name}`}
                    className="p-1 rounded hover:bg-teal-100 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    <SquarePen className="w-3.5 h-3.5" strokeWidth={1.7} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const shiftTabClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs transition cursor-pointer ${
      active
        ? 'bg-slate-900 text-[#f3ead8] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.2)]'
        : 'text-slate-700 hover:bg-slate-200/60'
    }`;

  return (
    <div className="space-y-5">
      {/* CABECERA: hoja rasgada con el calendario semanal */}
      <div className="paper-shadow">
        <div className="paper-sheet torn-bottom paper-curl px-5 pt-4 pb-7 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-2xl leading-tight text-slate-900">
                  Agenda personal de {workspaceOwnerName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sea text-teal-800 text-xs">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                  Semana del {weekRangeLabel}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                {scheduleConfig.splitShifts
                  ? `Horario cortado, mañana y tarde. Sesiones de ${scheduleConfig.slotDuration} min.`
                  : `De ${scheduleConfig.startHour}:00 a ${scheduleConfig.endHour}:00 hs. Sesiones de ${scheduleConfig.slotDuration} min.`}
              </p>
            </div>

            {/* Calendario de madera */}
            <div className="flex items-center gap-2 pt-2">
              <div className="wood-btn binder-rings flex items-center rounded-md">
                <button
                  type="button"
                  onClick={() => moveWeek(-1)}
                  title="Semana anterior"
                  aria-label="Semana anterior"
                  className="px-2 py-2 hover:bg-white/10 rounded-l-md cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <label className="flex items-center gap-1.5 px-2 py-1.5 border-x border-black/15">
                  <CalendarDays className="w-4 h-4 shrink-0" strokeWidth={1.7} />
                  <input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDateStr(e.target.value);
                    }}
                    aria-label="Elegir fecha"
                    className="bg-transparent text-sm font-semibold text-[#fbf3e2] outline-none cursor-pointer [color-scheme:dark]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => moveWeek(1)}
                  title="Semana siguiente"
                  aria-label="Semana siguiente"
                  className="px-2 py-2 hover:bg-white/10 rounded-r-md cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDateStr(todayYMD)}
                className="wood-btn binder-rings rounded-md px-3 py-1.5 text-sm font-semibold cursor-pointer"
              >
                <span className="px-2 py-0.5 rounded-sm bg-[#f6eedd] text-slate-900">Hoy</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-md bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setShiftFilter('ALL')}
                className={shiftTabClass(shiftFilter === 'ALL')}
              >
                Jornada completa
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('mañana')}
                className={shiftTabClass(shiftFilter === 'mañana')}
              >
                <Sun className="w-3.5 h-3.5" strokeWidth={1.7} />
                Mañana ({morningSlotsCount})
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('tarde')}
                className={shiftTabClass(shiftFilter === 'tarde')}
              >
                <Sunset className="w-3.5 h-3.5" strokeWidth={1.7} />
                Tarde ({afternoonSlotsCount})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sin faltas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 1 o 2 faltas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 3 faltas o más
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CELULAR: un día por vez */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {activeDays.map((day) => {
            const dateInfo = dayDatesMap[day];
            const selected = selectedMobileDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedMobileDay(day)}
                className={`shrink-0 px-3 py-1.5 rounded-[3px] text-xs transition cursor-pointer ${
                  selected
                    ? 'bg-slate-900 text-[#f3ead8] font-semibold'
                    : dateInfo?.isToday
                      ? 'bg-sea text-teal-900 font-semibold'
                      : 'bg-card text-slate-700 border border-slate-200'
                }`}
              >
                {day} {dateInfo?.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {visibleTimeSlots.map((slot) => (
            <div key={`${selectedMobileDay}-${slot.id}`} className="flex gap-3">
              <div className="w-14 shrink-0 pt-2 text-sm font-semibold text-slate-700">
                {slot.id}
                <div className="text-[11px] font-normal text-slate-500">
                  {slot.shift === 'mañana' ? 'Mañana' : 'Tarde'}
                </div>
              </div>
              <div className="flex-1 min-w-0">{renderSlotCell(selectedMobileDay, slot)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ESCRITORIO: grilla semanal */}
      <div className="hidden md:block paper-sheet overflow-x-auto">
        <table className="w-full table-fixed border-collapse min-w-[820px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-3 w-24 text-left text-xs font-semibold text-slate-600">
                Horario
              </th>
              {activeDays.map((day) => {
                const dateInfo = dayDatesMap[day];
                return (
                  <th
                    key={day}
                    className={`p-2.5 text-center border-l border-slate-200 font-normal ${
                      dateInfo?.isToday ? 'bg-sea' : ''
                    }`}
                  >
                    <div className="brand-wordmark text-base text-slate-900">{day}</div>
                    <div
                      className={`text-xs ${
                        dateInfo?.isToday ? 'text-teal-800 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {dateInfo?.shortLabel}
                      {dateInfo?.isToday ? ', hoy' : ''}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleTimeSlots.map((slot, index) => {
              const prevSlot = index > 0 ? visibleTimeSlots[index - 1] : null;
              const startsAfternoon =
                prevSlot && prevSlot.shift === 'mañana' && slot.shift === 'tarde';

              return (
                <React.Fragment key={slot.id}>
                  {startsAfternoon && (
                    <tr>
                      <td
                        colSpan={activeDays.length + 1}
                        className="px-4 py-1.5 text-center text-xs text-slate-500 italic border-y border-dashed border-slate-300"
                      >
                        Comienza el turno tarde
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-200/80">
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
                        {slot.id}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                        {slot.shift === 'mañana' ? (
                          <Sun className="w-3 h-3" strokeWidth={1.8} />
                        ) : (
                          <Sunset className="w-3 h-3" strokeWidth={1.8} />
                        )}
                        {slot.shift === 'mañana' ? 'Mañana' : 'Tarde'}
                      </div>
                    </td>

                    {activeDays.map((day) => {
                      const dateInfo = dayDatesMap[day];
                      return (
                        <td
                          key={`${day}-${slot.id}`}
                          className={`p-2 align-top border-l border-slate-200/80 ${
                            dateInfo?.isToday ? 'bg-sea/40' : ''
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
