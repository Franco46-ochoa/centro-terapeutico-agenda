import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  FileText,
  Copy,
  Save,
  Printer,
  Brain,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { StudentPatient } from '../../types/clinical';
import {
  buildStructuredLocalReport,
  pseudonymizeClinicalText,
  rehydrateClinicalReport,
} from '../../lib/anonymizer';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface AiReportGeneratorProps {
  students: StudentPatient[];
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
  currentUserName: string;
  onSaveReportToHistory: (studentId: string, reportTitle: string, content: string) => void;
}

export const AiReportGenerator: React.FC<AiReportGeneratorProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  currentUserName,
  onSaveReportToHistory,
}) => {
  const [aiReportType, setAiReportType] = useState('Informe de Evolución Mensual');
  const [aiPeriod, setAiPeriod] = useState('Marzo 2026');
  const [aiGeneratedReport, setAiGeneratedReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAnonymizedPreview, setShowAnonymizedPreview] = useState(false);
  const [reviewedByProfessional, setReviewedByProfessional] = useState(false);

  const activeStudents = students.filter((s) => !s.archivedAt);
  const selectedStudent = activeStudents.find((s) => s.id === selectedStudentId);

  const handleGenerateAiReport = async () => {
    if (!selectedStudent) return;
    setIsAiLoading(true);
    setAiGeneratedReport('');
    setReviewedByProfessional(false);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.functions.invoke(
          'generate-clinical-report',
          {
            body: {
              patientId: selectedStudent.id,
              reportType: aiReportType,
              period: aiPeriod,
            },
          }
        );

        if (!error && data?.report) {
          const hydrated = rehydrateClinicalReport(data.report, selectedStudent.name);
          setAiGeneratedReport(hydrated);
          setIsAiLoading(false);
          return;
        }
      }

      // Síntesis estructurada local cuando se opera sin Edge Function activa
      await new Promise((resolve) => setTimeout(resolve, 650));
      const fallback = buildStructuredLocalReport(
        selectedStudent,
        aiReportType,
        aiPeriod,
        currentUserName
      );
      setAiGeneratedReport(fallback);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyReport = async () => {
    if (!aiGeneratedReport) return;
    await navigator.clipboard.writeText(aiGeneratedReport);
    window.alert('Informe copiado al portapapeles.');
  };

  const handleAttachToHistory = () => {
    if (!aiGeneratedReport || !selectedStudent) return;
    if (!reviewedByProfessional) {
      window.alert(
        'Por cumplimiento de la Ley 26.529, marque primero la casilla de revisión y conformidad profesional antes de incorporar el informe a la Historia Clínica.'
      );
      return;
    }
    onSaveReportToHistory(
      selectedStudent.id,
      `Informe Clínico: ${aiReportType} (${aiPeriod})`,
      aiGeneratedReport
    );
  };

  const anonymizedPreviewText = selectedStudent
    ? selectedStudent.history
        .map(
          (h) =>
            `[${h.date}] [${h.type}] ${pseudonymizeClinicalText(
              h.title,
              selectedStudent.name,
              selectedStudent.tutorName
            )}: ${pseudonymizeClinicalText(
              h.content,
              selectedStudent.name,
              selectedStudent.tutorName
            )}`
        )
        .join('\n')
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 no-print">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 font-bold text-base mb-1">
            <Sparkles className="w-5 h-5" />
            <h3>Agente Terapéutico IA Seguro</h3>
          </div>
          <p className="text-xs text-slate-500">
            Sintetiza evoluciones, actividades y regresiones. Los datos filiatorios del menor
            se seudonimizan automáticamente (`&#123;&#123;PACIENTE&#125;&#125;`) y la API Key reside solo en
            el servidor (Ley 25.326).
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Privacidad por Diseño Activa</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Ninguna clave de API se almacena en el navegador. Nombre, tutor, teléfono y DNI se
            reemplazan antes de consultar el modelo.
          </p>
          {selectedStudent && (
            <button
              type="button"
              onClick={() => setShowAnonymizedPreview((v) => !v)}
              className="text-[11px] font-semibold text-emerald-900 underline"
            >
              {showAnonymizedPreview
                ? 'Ocultar payload seudonimizado'
                : 'Ver qué datos seudonimizados se envían'}
            </button>
          )}
        </div>

        {showAnonymizedPreview && selectedStudent && (
          <div className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[10px] font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
            {anonymizedPreviewText || 'Sin entradas clínicas para seudonimizar.'}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            1. Seleccionar Paciente
          </label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="" disabled>
              -- Selecciona un paciente --
            </option>
            {activeStudents.map((s) => (
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
            <option value="Informe de Evolución Mensual">
              Informe de Evolución Mensual (Clínico)
            </option>
            <option value="Informe para Familias / Escuela">
              Informe para Familias / Gabinete Escolar
            </option>
            <option value="Resumen Terapéutico y Plan de Acción">
              Resumen Terapéutico y Plan de Acción
            </option>
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
              <span>Sintetizando Historial Seudonimizado...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generar Borrador de Informe</span>
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[600px] print-container">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 mb-4 gap-2 no-print">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Vista Previa y Validación Profesional
            </h3>
          </div>

          {aiGeneratedReport && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center space-x-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>

              <button
                onClick={handleAttachToHistory}
                className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Firmar y Adjuntar a Historia Clínica</span>
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

        {aiGeneratedReport && (
          <label className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 cursor-pointer no-print">
            <input
              type="checkbox"
              checked={reviewedByProfessional}
              onChange={(e) => setReviewedByProfessional(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              He revisado y validado clínicamente este borrador como profesional tratante
              ({currentUserName}) conforme a la Ley 26.529.
            </span>
          </label>
        )}

        <div className="flex-1 bg-slate-50 p-6 rounded-lg border border-slate-200 font-mono text-xs leading-relaxed text-slate-800 overflow-y-auto max-h-[600px] print-container">
          {isAiLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-teal-600 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="font-sans font-medium text-sm">
                Analizando asientos clínicos seudonimizados...
              </p>
            </div>
          ) : aiGeneratedReport ? (
            <>
              <textarea
                value={aiGeneratedReport}
                onChange={(e) => setAiGeneratedReport(e.target.value)}
                className="w-full h-full min-h-[460px] bg-transparent outline-none resize-none font-mono no-print"
              />
              {/* Vista exclusiva para Impresión / PDF con pie normativo */}
              <div className="hidden print-only font-sans whitespace-pre-wrap text-slate-900 space-y-6">
                <div>{aiGeneratedReport}</div>
                <div className="pt-8 mt-8 border-t border-slate-300 text-[10pt] text-slate-600 flex justify-between">
                  <div>
                    <strong>Documento Clínico Confidencial</strong> — Ley 25.326 y Ley 26.529
                  </div>
                  <div>
                    Emitido por: {currentUserName} • Fecha:{' '}
                    {new Date().toLocaleDateString('es-AR')}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 font-sans text-center">
              <Brain className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">
                Ningún informe generado aún
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Selecciona un paciente a la izquierda y presiona &quot;Generar Borrador de
                Informe&quot;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
