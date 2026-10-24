import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, User, UserPlus, AlertTriangle, FileText, Sparkles, 
  Plus, Trash2, XCircle, Search, ChevronRight,
  Printer, Copy, RotateCcw, Activity,
  Brain, ShieldAlert, Save, RefreshCw, Settings, X
} from 'lucide-react';

// --- CONSTANTS ---
const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const CONDITIONS = [
  { id: 'tea', label: 'Trastorno del Espectro Autista (TEA)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'down', label: 'Síndrome de Down', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'tdah', label: 'TDAH', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'pc', label: 'Parálisis Cerebral', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { id: 'rd', label: 'Retraso del Desarrollo', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'otro', label: 'Otro / En Evaluación', color: 'bg-gray-100 text-gray-800 border-gray-300' }
];

// --- INITIAL MOCK DATA ---
const INITIAL_STUDENTS = [
  {
    id: 'p1',
    name: 'Mateo González',
    age: 7,
    condition: 'Trastorno del Espectro Autista (TEA)',
    tutorName: 'María González (Madre)',
    phone: '11-4589-1234',
    absences: 2,
    slot: { day: 'Lunes', hour: '09:00' },
    history: [
      { id: 'h1', date: '2026-03-02', type: 'Evolución', title: 'Avance en comunicación SAAC', content: 'Mateo logró utilizar el pictograma de "quiero agua" de forma espontánea en 4 ocasiones durante la sesión de juego libre.' },
      { id: 'h2', date: '2026-03-09', type: 'Actividad', title: 'Integración Sensorial', content: 'Trabajo en hamaca sensorial y estimulación propioceptiva. Toleró texturas rugosas (plastilina de arena) por 10 minutos.' },
      { id: 'h3', date: '2026-03-16', type: 'Regresión', title: 'Hipersensibilidad auditiva', content: 'Episodio de sobrecarga sensorial por ruido externo brusco. Requirió 15 min de desregulación con auriculares de cancelación.' },
      { id: 'h4', date: '2026-03-23', type: 'Evolución', title: 'Interacción con pares', content: 'Participó de una ronda compartida con Sofía realizando turnos de espera con apoyo visual.' }
    ]
  },
  {
    id: 'p2',
    name: 'Sofía Benítez',
    age: 9,
    condition: 'Síndrome de Down',
    tutorName: 'Carlos Benítez (Padre)',
    phone: '11-6321-7788',
    absences: 0,
    slot: { day: 'Miércoles', hour: '14:00' },
    history: [
      { id: 'h21', date: '2026-03-04', type: 'Actividad', title: 'Grafo-motricidad fina', content: 'Realizó trazado de líneas punteadas y recortado de figuras geométricas simples con tijera adaptada.' },
      { id: 'h22', date: '2026-03-11', type: 'Evolución', title: 'Comprensión de consignas', content: 'Completó rutina de 3 pasos sin necesidad de modelado físico, siguiendo la agenda visual.' },
      { id: 'h23', date: '2026-03-18', type: 'Evolución', title: 'Autonomía en higiene', content: 'Logra lavarse y secarse las manos antes de la merienda con supervisión indirecta.' }
    ]
  },
  {
    id: 'p3',
    name: 'Lucas Martínez',
    age: 6,
    condition: 'TDAH',
    tutorName: 'Laura Martínez (Madre)',
    phone: '11-9988-4422',
    absences: 3,
    slot: { day: 'Viernes', hour: '11:00' },
    history: [
      { id: 'h31', date: '2026-02-20', type: 'Actividad', title: 'Control inhibitorio', content: 'Juegos de mesa tipo "Simón Dice" y "Semáforo". Muestra dificultad para respetar la pausa de detención.' },
      { id: 'h32', date: '2026-03-06', type: 'Regresión', title: 'Inatención marcada', content: 'Muestra inquietud motora severa. No logra finalizar tareas breves de menos de 5 minutos de duración.' }
    ]
  },
  {
    id: 'p4',
    name: 'Camila Rojas',
    age: 11,
    condition: 'Parálisis Cerebral',
    tutorName: 'Aníbal Rojas (Padre)',
    phone: '11-2233-5566',
    absences: 1,
    slot: { day: 'Martes', hour: '16:00' },
    history: [
      { id: 'h41', date: '2026-03-03', type: 'Actividad', title: 'Posicionamiento y comunicación', content: 'Uso de bipedestador e interacción mediante pulsador en tablet para causa-efecto.' },
      { id: 'h42', date: '2026-03-10', type: 'Evolución', title: 'Mayor control cefálico', content: 'Sostiene mirada fija en pantalla interactiva por lapsos continuos de 30 segundos.' }
    ]
  }
];

export default function App() {
  // App state
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'students', 'reports', 'settings'
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic Schedule Configuration Settings
  const [scheduleConfig, setScheduleConfig] = useState({
    startHour: 9,       // 09:00
    endHour: 18,        // 18:00
    slotDuration: 60,   // 60 mins (1 hora)
    includeSaturday: false
  });

  // Students & Appointments Data
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { day, hour }

  // AI Prompt & Key State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [aiReportType, setAiReportType] = useState('Informe de Evolución Mensual');
  const [aiPeriod, setAiPeriod] = useState('Marzo 2026');
  const [aiGeneratedReport, setAiGeneratedReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    age: '',
    condition: CONDITIONS[0].label,
    tutorName: '',
    phone: '',
    day: '',
    hour: ''
  });

  // New History Entry Form State
  const [newEntry, setNewEntry] = useState({
    type: 'Evolución',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Helper: Generate dynamic time slots based on scheduleConfig
  const timeSlots = useMemo(() => {
    const slots = [];
    const startMins = scheduleConfig.startHour * 60;
    const endMins = scheduleConfig.endHour * 60;
    const duration = scheduleConfig.slotDuration;

    for (let time = startMins; time < endMins; time += duration) {
      const startH = Math.floor(time / 60).toString().padStart(2, '0');
      const startM = (time % 60).toString().padStart(2, '0');
      const endTime = time + duration;
      const endH = Math.floor(endTime / 60).toString().padStart(2, '0');
      const endM = (endTime % 60).toString().padStart(2, '0');

      slots.push({
        id: `${startH}:${startM}`,
        label: `${startH}:${startM} - ${endH}:${endM}`
      });
    }
    return slots;
  }, [scheduleConfig]);

  // Dynamic list of working days
  const activeDays = useMemo(() => {
    return scheduleConfig.includeSaturday ? DAYS_OF_WEEK : DAYS_OF_WEEK.filter(d => d !== 'Sábado');
  }, [scheduleConfig.includeSaturday]);

  // Selected student object helper
  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Students with 3 absences alert list
  const criticalStudents = useMemo(() => {
    return students.filter(s => s.absences >= 3);
  }, [students]);

  // Helpers
  const getStudentInSlot = (day, hour) => {
    return students.find(s => s.slot && s.slot.day === day && s.slot.hour === hour);
  };

  const getConditionColor = (conditionLabel) => {
    const found = CONDITIONS.find(c => c.label === conditionLabel);
    return found ? found.color : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Handlers for Absences
  const handleAddAbsence = (studentId, e) => {
    if (e) e.stopPropagation();
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, absences: s.absences + 1 };
      }
      return s;
    }));
  };

  const handleResetAbsences = (studentId) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, absences: 0 };
      }
      return s;
    }));
  };

  const handleRemoveFromSlot = (studentId, e) => {
    if (e) e.stopPropagation();
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, slot: null };
      }
      return s;
    }));
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('¿Está seguro de eliminar este alumno de la base de datos?')) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (selectedStudentId === studentId) setSelectedStudentId(null);
    }
  };

  // Add new student
  const handleCreateStudent = (e) => {
    e.preventDefault();
    if (!newStudent.name.trim()) return;

    const created = {
      id: 'p_' + Date.now(),
      name: newStudent.name,
      age: Number(newStudent.age) || 0,
      condition: newStudent.condition,
      tutorName: newStudent.tutorName,
      phone: newStudent.phone,
      absences: 0,
      slot: (newStudent.day && newStudent.hour) ? { day: newStudent.day, hour: newStudent.hour } : null,
      history: []
    };

    setStudents(prev => [...prev, created]);
    setNewStudent({
      name: '', age: '', condition: CONDITIONS[0].label, tutorName: '', phone: '', day: '', hour: ''
    });
    setIsStudentModalOpen(false);
  };

  // Add new history entry
  const handleAddHistoryEntry = (e) => {
    e.preventDefault();
    if (!newEntry.title.trim() || !newEntry.content.trim() || !selectedStudentId) return;

    const entry = {
      id: 'h_' + Date.now(),
      date: newEntry.date,
      type: newEntry.type,
      title: newEntry.title,
      content: newEntry.content
    };

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        return { ...s, history: [entry, ...s.history] };
      }
      return s;
    }));

    setNewEntry({ type: 'Evolución', title: '', content: '', date: new Date().toISOString().split('T')[0] });
  };

  // Assign Student to Slot
  const handleAssignToSlot = (studentId) => {
    if (!selectedSlot) return;
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, slot: { day: selectedSlot.day, hour: selectedSlot.hour } };
      }
      if (s.slot && s.slot.day === selectedSlot.day && s.slot.hour === selectedSlot.hour) {
        return { ...s, slot: null };
      }
      return s;
    }));
    setIsAssignModalOpen(false);
    setSelectedSlot(null);
  };

  // AI Report Generation with Gemini API
  const handleGenerateAiReport = async () => {
    if (!selectedStudent) return;
    setIsAiLoading(true);
    setAiGeneratedReport('');

    const systemPrompt = `Eres un psicopedagogo y terapeuta clínico de alto nivel especialista en neurodiversidad e inclusión educacional. Tu objetivo es redactar informes terapéuticos profesionales, empáticos, concisos y rigurosos en español. Utiliza términos profesionales apropiados y estructura clara con secciones.`;

    const studentContext = `
DATOS DEL ALUMNO/PACIENTE:
- Nombre: ${selectedStudent.name}
- Edad: ${selectedStudent.age} años
- Condición / Diagnóstico: ${selectedStudent.condition}
- Inasistencias registradas en el periodo: ${selectedStudent.absences}

HISTORIAL DE SESIONES, REGISTROS Y EVOLUCIONES:
${selectedStudent.history.map(h => `- [${h.date}] [TIPO: ${h.type.toUpperCase()}] ${h.title}: ${h.content}`).join('\n')}

TIPO DE INFORME SOLICITADO: ${aiReportType}
PERIODO DE EVALUACIÓN: ${aiPeriod}
`;

    const userQuery = `Por favor, genera un ${aiReportType} para ${selectedStudent.name} correspondiente al período ${aiPeriod}.
Asegúrate de incluir:
1. Resumen de Objetivos e Intervenciones Terapéuticas.
2. Análisis de Evoluciones y Avances Observados.
3. Desafíos o Regresiones Registradas y Estrategias Terapéuticas de Afrontamiento.
4. Conclusiones y Recomendaciones para la Familia o Equipo Interdisciplinario.`;

    try {
      const apiKey = geminiApiKey.trim();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: `${studentContext}\n\n${userQuery}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error en la solicitud a la API (Status: ${response.status})`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        setAiGeneratedReport(text);
      } else {
        throw new Error("No se pudo obtener una respuesta válida del modelo.");
      }
    } catch (err) {
      console.warn("Fallo Gemini API o falta API Key. Utilizando respuesta estructurada local:", err);
      
      setTimeout(() => {
        const fallbackText = `### ${aiReportType.toUpperCase()}
**Alumno:** ${selectedStudent.name} | **Edad:** ${selectedStudent.age} años
**Condición:** ${selectedStudent.condition}
**Período:** ${aiPeriod}

---

### 1. Resumen General del Período
Durante el ciclo de ${aiPeriod}, el alumno ${selectedStudent.name} ha asistido a sus sesiones con un registro total de ${selectedStudent.absences} inasistencia(s). Se sostuvieron intervenciones enfocadas en la regulación sensorial, comunicación adaptativa y rutinas de trabajo autónomo.

### 2. Evolución y Logros Destacados
${selectedStudent.history.filter(h => h.type === 'Evolución').map(h => `- **${h.title} (${h.date}):** ${h.content}`).join('\n') || '- Se observa progresiva adaptación a las rutinas institucionales.'}

### 3. Aspectos a Reforzar y Regresiones
${selectedStudent.history.filter(h => h.type === 'Regresión').map(h => `- **${h.title} (${h.date}):** ${h.content}`).join('\n') || '- No se registran desregulaciones o regresiones de gravedad en el período.'}

### 4. Recomendaciones Terapéuticas
- Mantener la anticipación visual mediante agenda diaria en el hogar.
- Continuar con el soporte interdisciplinario y comunicación continua con el gabinete escolar.
- Reforzar la asistencia regular para sostener los hitos alcanzados.

*Informe generado automáticamente para evaluación del equipo interdisciplinario.*`;
        
        setAiGeneratedReport(fallbackText);
      }, 1200);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!aiGeneratedReport) return;
    navigator.clipboard.writeText(aiGeneratedReport);
    alert('¡Informe copiado al portapapeles exitosamente!');
  };

  const handleSaveReportToHistory = () => {
    if (!aiGeneratedReport || !selectedStudentId) return;
    const entry = {
      id: 'h_ai_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Evolución',
      title: `AI: ${aiReportType} (${aiPeriod})`,
      content: aiGeneratedReport
    };

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        return { ...s, history: [entry, ...s.history] };
      }
      return s;
    }));

    alert('¡El informe ha sido adjuntado al historial del alumno!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* HEADER / NAVIGATION */}
      <header className="bg-slate-900 text-slate-100 p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 text-slate-900 p-2 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Centro Terapéutico - Agenda & Evolución</h1>
              <p className="text-xs text-slate-400">Gestión Clínica y Configuración Horaria Dinámica</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                activeTab === 'grid' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" /> Agenda
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                activeTab === 'students' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <User className="w-4 h-4" /> Pacientes / Alumnos
              <span className="bg-teal-800 text-teal-200 text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                {students.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                if (!selectedStudentId && students.length > 0) {
                  setSelectedStudentId(students[0].id);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                activeTab === 'reports' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Informes IA
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                activeTab === 'settings' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" /> Configurar Horarios
            </button>

            <button
              onClick={() => setIsStudentModalOpen(true)}
              className="ml-2 flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold px-3 py-2 rounded-lg text-sm transition"
            >
              <UserPlus className="w-4 h-4" /> Nuevo Alumno
            </button>
          </div>
        </div>
      </header>

      {/* CRITICAL ABSENCE ALERT BARNER */}
      {criticalStudents.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3 text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Alerta de Inasistencias (3 o más): </span>
                {criticalStudents.map(s => `${s.name} (${s.absences} faltas)`).join(', ')}.
                <span className="ml-1 text-rose-700">Tienen prioridad para ser reasignados o liberados del turno.</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('students')} 
              className="text-xs font-semibold text-rose-900 underline hover:text-rose-950 flex-shrink-0"
            >
              Gestionar Alumnos
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* TAB: AGENDA / GRID */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Agenda de Turnos</h2>
                <p className="text-xs text-slate-500">
                  Días configurados: {activeDays.join(', ')} ({scheduleConfig.startHour}:00 a {scheduleConfig.endHour}:00 hs - módulos de {scheduleConfig.slotDuration} min).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Sin faltas</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>1-2 Inasistencias</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span>3 Faltas (Riesgo de remoción)</span>
                </div>
              </div>
            </div>

            {/* SCHEDULE GRID TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Módulo</th>
                    {activeDays.map(day => (
                      <th key={day} className="p-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-l border-slate-200">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {timeSlots.map(slot => (
                    <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-xs font-semibold text-slate-600 bg-slate-50 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{slot.id}</span>
                      </td>

                      {activeDays.map(day => {
                        const student = getStudentInSlot(day, slot.id);
                        
                        return (
                          <td key={`${day}-${slot.id}`} className="p-2 border-l border-slate-200 align-top h-24 relative">
                            {student ? (
                              <div 
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  setActiveTab('students');
                                }}
                                className={`h-full p-2.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all hover:shadow-md relative group ${
                                  student.absences >= 3 
                                    ? 'bg-rose-50 border-rose-300 hover:border-rose-400' 
                                    : student.absences > 0 
                                      ? 'bg-amber-50 border-amber-300 hover:border-amber-400' 
                                      : 'bg-teal-50 border-teal-200 hover:border-teal-300'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <span className="font-bold text-xs text-slate-900 truncate" title={student.name}>
                                      {student.name}
                                    </span>
                                    <span 
                                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center space-x-0.5 ${
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

                                  <div className="text-[11px] text-slate-600 mb-1">
                                    {student.age} años
                                  </div>

                                  <div className="mt-1">
                                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium truncate max-w-full ${getConditionColor(student.condition)}`}>
                                      {student.condition}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                                  <span className="text-teal-700 font-medium hover:underline">Ver Historial</span>
                                  
                                  <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => handleAddAbsence(student.id, e)}
                                      title="Registrar Inasistencia"
                                      className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={(e) => handleRemoveFromSlot(student.id, e)}
                                      title="Liberar este turno"
                                      className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedSlot({ day, hour: slot.id });
                                  setIsAssignModalOpen(true);
                                }}
                                className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg hover:border-teal-400 hover:bg-teal-50/30 flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 transition-all p-2 group"
                              >
                                <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-medium">Asignar</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: STUDENTS DIRECTORY & DETAILED PROFILE */}
        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col h-[750px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base">Alumnos Registrados</h3>
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
                  Total: {students.length}
                </span>
              </div>

              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar alumno o diagnóstico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {students
                  .filter(s => 
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    s.condition.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(student => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        selectedStudentId === student.id
                          ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{student.name}</span>
                          {student.absences >= 3 && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                              3 Faltas
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{student.age} años • Tutor: {student.tutorName}</div>
                        <div className="text-[11px]">
                          <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${getConditionColor(student.condition)}`}>
                            {student.condition}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[750px] flex flex-col">
              {selectedStudent ? (
                <div className="flex-1 flex flex-col space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h2>
                        <span className={`px-2.5 py-1 rounded text-xs font-medium border ${getConditionColor(selectedStudent.condition)}`}>
                          {selectedStudent.condition}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedStudent.age} años • Tutor Responsable: {selectedStudent.tutorName} ({selectedStudent.phone})
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Turno: {selectedStudent.slot ? `${selectedStudent.slot.day} a las ${selectedStudent.slot.hour} hs` : 'Sin horario asignado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-xs font-semibold text-slate-600">Inasistencias:</span>
                        <span className={`text-sm font-black px-2 py-0.5 rounded ${
                          selectedStudent.absences >= 3 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {selectedStudent.absences}
                        </span>
                        
                        <button
                          onClick={() => handleAddAbsence(selectedStudent.id)}
                          title="Sumar 1 Inasistencia"
                          className="p-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded text-xs font-bold"
                        >
                          +1 Falta
                        </button>
                        
                        <button
                          onClick={() => handleResetAbsences(selectedStudent.id)}
                          title="Reiniciar contador de faltas"
                          className="p-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded text-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="flex items-center space-x-1 text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generar Informe IA</span>
                        </button>

                        <button
                          onClick={() => handleDeleteStudent(selectedStudent.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Eliminar Alumno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center space-x-1">
                      <Plus className="w-4 h-4 text-teal-600" />
                      <span>Registrar Nueva Sesión / Nota de Historial</span>
                    </h4>

                    <form onSubmit={handleAddHistoryEntry} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
                          <input
                            type="date"
                            value={newEntry.date}
                            onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Registro</label>
                          <select
                            value={newEntry.type}
                            onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="Evolución">Evolución / Avance</option>
                            <option value="Actividad">Actividad / Ejercicio</option>
                            <option value="Regresión">Regresión / Dificultad</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Título Resumido</label>
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

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones / Notas Detalladas</label>
                        <textarea
                          rows={2}
                          placeholder="Describe la conducta, materiales utilizados, nivel de apoyo y resultados..."
                          value={newEntry.content}
                          onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                          required
                        ></textarea>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar en Historial</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="flex-1 flex flex-col space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                      <span>Historial Clínico Terapéutico</span>
                      <span className="text-slate-400 font-normal">({selectedStudent.history.length} entradas)</span>
                    </h4>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
                      {selectedStudent.history.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          No hay entradas registradas en el historial.
                        </div>
                      ) : (
                        selectedStudent.history.map(item => (
                          <div 
                            key={item.id} 
                            className={`p-3.5 rounded-lg border transition-all ${
                              item.type === 'Evolución' ? 'bg-emerald-50/50 border-emerald-200' :
                              item.type === 'Regresión' ? 'bg-rose-50/50 border-rose-200' :
                              'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  item.type === 'Evolución' ? 'bg-emerald-100 text-emerald-800' :
                                  item.type === 'Regresión' ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-200 text-slate-800'
                                }`}>
                                  {item.type}
                                </span>
                                <span className="font-bold text-sm text-slate-900">{item.title}</span>
                              </div>
                              <span className="text-xs font-medium text-slate-400">{item.date}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{item.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <User className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-medium text-slate-600">Selecciona un alumno de la lista</p>
                  <p className="text-xs text-slate-400 mt-1">Podrás ver su condición, historial de actividades y generar informes de IA.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: AI MONTHLY REPORT GENERATOR */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <div className="flex items-center space-x-2 text-teal-600 font-bold text-base mb-1">
                  <Sparkles className="w-5 h-5" />
                  <h3>Agente Terapéutico IA</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Genera informes detallados integrando el historial de actividades, evoluciones y regresiones usando Gemini API.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gemini API Key (Opcional)
                </label>
                <input
                  type="password"
                  placeholder="Pegar API Key aquí..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Seleccionar Alumno
                </label>
                <select
                  value={selectedStudentId || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="" disabled>-- Selecciona un alumno --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.condition}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Tipo de Informe
                </label>
                <select
                  value={aiReportType}
                  onChange={(e) => setAiReportType(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="Informe de Evolución Mensual">Informe de Evolución Mensual (Clínico)</option>
                  <option value="Informe para Familias / Escuela">Informe para Familias / Escuela</option>
                  <option value="Resumen Terapéutico y Plan de Acción">Resumen Terapéutico y Plan de Acción</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Período Evaluable
                </label>
                <input
                  type="text"
                  value={aiPeriod}
                  onChange={(e) => setAiPeriod(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Marzo 2026"
                />
              </div>

              <button
                onClick={handleGenerateAiReport}
                disabled={!selectedStudent || isAiLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sintetizando Historial con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar Informe Mensual</span>
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[600px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-base">Vista Previa del Informe</h3>
                </div>

                {aiGeneratedReport && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyReport}
                      className="flex items-center space-x-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </button>

                    <button
                      onClick={handleSaveReportToHistory}
                      className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Adjuntar al Historial</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-medium"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir / PDF</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-slate-50 p-6 rounded-lg border border-slate-200 font-mono text-xs leading-relaxed text-slate-800 overflow-y-auto max-h-[600px]">
                {isAiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-teal-600 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <p className="font-sans font-medium text-sm">Analizando bitácoras de {selectedStudent?.name}...</p>
                  </div>
                ) : aiGeneratedReport ? (
                  <textarea
                    value={aiGeneratedReport}
                    onChange={(e) => setAiGeneratedReport(e.target.value)}
                    className="w-full h-full min-h-[500px] bg-transparent outline-none resize-none font-mono"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 font-sans text-center">
                    <Brain className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">Ningún informe generado aún</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      Selecciona un alumno a la izquierda y presiona el botón "Generar Informe Mensual".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS (Configurar Horarios) */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Parámetros del Horario y Agenda</h2>
                  <p className="text-sm text-slate-500">Ajuste la hora de inicio, final, la duración de cada turno y los días laborales.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hora de Inicio Jornada</label>
                  <select
                    value={scheduleConfig.startHour}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, startHour: parseInt(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {[6, 7, 8, 9, 10].map((hour) => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}:00 hs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hora de Cierre Jornada</label>
                  <select
                    value={scheduleConfig.endHour}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, endHour: parseInt(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {[15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}:00 hs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Duración del Turno / Módulo</label>
                  <select
                    value={scheduleConfig.slotDuration}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, slotDuration: parseInt(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos (1 h 30 min)</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block text-sm">Incluir día Sábado</span>
                    <span className="text-xs text-slate-500">Muestra u oculta la columna de sábados en la agenda</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={scheduleConfig.includeSaturday}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, includeSaturday: e.target.checked })}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <strong>Nota:</strong> Al modificar la grilla horaria, la vista recalcula de inmediato los módulos disponibles ({timeSlots.length} turnos por día configurados actualmente). Los turnos agendados previamente se conservan en su horario original.
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ASSIGN STUDENT TO TIME SLOT */}
      {isAssignModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Asignar Turno Semanal</h3>
                <p className="text-xs text-slate-500">{selectedSlot.day} a las {selectedSlot.hour} hs</p>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecciona un alumno registrado para asignarlo a esta celda horaria:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {students.map(student => (
                <div
                  key={student.id}
                  onClick={() => handleAssignToSlot(student.id)}
                  className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{student.name}</div>
                    <div className="text-[10px] text-slate-500">{student.condition}</div>
                  </div>
                  <span className="text-xs font-semibold text-teal-600 group-hover:underline">Asignar</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW STUDENT */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Registrar Nuevo Alumno</h3>
              <button 
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tomás M. Ramírez"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Edad</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 8"
                    value={newStudent.age}
                    onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condición / Diagnóstico</label>
                  <select
                    value={newStudent.condition}
                    onChange={(e) => setNewStudent({ ...newStudent, condition: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {CONDITIONS.map(c => (
                      <option key={c.id} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Tutor</label>
                  <input
                    type="text"
                    placeholder="Ej: Laura Ramírez"
                    value={newStudent.tutorName}
                    onChange={(e) => setNewStudent({ ...newStudent, tutorName: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: 11-2233-4455"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Asignar Turno Inicial (Opcional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newStudent.day}
                    onChange={(e) => setNewStudent({ ...newStudent, day: e.target.value })}
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="">-- Día --</option>
                    {activeDays.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select
                    value={newStudent.hour}
                    onChange={(e) => setNewStudent({ ...newStudent, hour: e.target.value })}
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="">-- Horario --</option>
                    {timeSlots.map(s => <option key={s.id} value={s.id}>{s.id} hs</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Guardar Alumno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Centro Terapéutico y Agente de Informes IA • © {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
}