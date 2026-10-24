// =============================================================================
// SUPABASE EDGE FUNCTION: generate-clinical-report
// - La clave GEMINI_API_KEY vive EXCLUSIVAMENTE en el entorno del servidor.
// - Verifica sesión JWT y rol ('admin' | 'profesional').
// - Seudonimiza PII (nombre del menor, tutor, teléfono, DNI) antes de llamar a Gemini.
// - Registra la operación en audit_logs.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function pseudonymizeText(text: string, patientFullName: string, tutorName: string): string {
  let sanitized = text;
  const tokens = [
    ...patientFullName.split(/\s+/),
    ...tutorName.replace(/[()]/g, '').split(/\s+/),
  ].filter((t) => t.length >= 3);

  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sanitized = sanitized.replace(new RegExp(escaped, 'gi'), '{{PACIENTE}}');
  }

  sanitized = sanitized.replace(
    /\b\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4}\b/g,
    '[TELÉFONO_REDACTADO]'
  );
  sanitized = sanitized.replace(/\b\d{7,8}\b/g, '[DNI_REDACTADO]');
  return sanitized;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, center_id, is_active')
      .eq('id', user.id)
      .single();

    if (!profile?.is_active || !['admin', 'profesional'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Su rol no posee permisos para generar informes clínicos' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { patientId, reportType, period } = await req.json();

    const { data: patient } = await supabase
      .from('patients')
      .select('id, full_name, age_years, tutor_name, absences_count')
      .eq('id', patientId)
      .single();

    const { data: clinicalProfile } = await supabase
      .from('patient_clinical_profiles')
      .select('condition_label')
      .eq('patient_id', patientId)
      .single();

    const { data: entries } = await supabase
      .from('clinical_entries')
      .select('session_date, type, title, content')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false })
      .limit(30);

    if (!patient || !clinicalProfile) {
      return new Response(
        JSON.stringify({ error: 'Paciente no encontrado o acceso denegado por RLS' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const anonymizedHistory = (entries ?? [])
      .map((h) => {
        const cleanTitle = pseudonymizeText(h.title, patient.full_name, patient.tutor_name);
        const cleanContent = pseudonymizeText(
          h.content,
          patient.full_name,
          patient.tutor_name
        );
        return `- [${h.session_date}] [${h.type.toUpperCase()}] ${cleanTitle}: ${cleanContent}`;
      })
      .join('\n');

    const systemPrompt =
      'Eres un psicopedagogo y terapeuta clínico especialista en neurodiversidad e inclusión educativa. Redacta informes terapéuticos rigurosos en español utilizando únicamente el marcador {{PACIENTE}} para referirte al menor. No inventes datos fuera del historial provisto.';

    const userPrompt = `
DATOS CLÍNICOS SEUDONIMIZADOS:
- Identificador: {{PACIENTE}}
- Edad: ${patient.age_years} años
- Diagnóstico de referencia: ${clinicalProfile.condition_label}
- Inasistencias registradas en el período: ${patient.absences_count}
- Tipo de informe solicitado: ${reportType}
- Período evaluado: ${period}

HISTORIAL DE SESIONES (SEUDONIMIZADO):
${anonymizedHistory || 'Sin registros en el período.'}

Redacta el informe con las siguientes secciones:
1. Resumen de Objetivos e Intervenciones Terapéuticas.
2. Análisis de Evoluciones y Avances Observados.
3. Desafíos o Regresiones Registradas y Estrategias Terapéuticas de Afrontamiento.
4. Conclusiones y Recomendaciones para la Familia y Equipo Interdisciplinario.`;

    let reportText = '';

    if (geminiApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        reportText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }
    }

    await supabase.from('audit_logs').insert({
      center_id: profile.center_id,
      actor_id: user.id,
      actor_role: profile.role,
      action: 'AI_REPORT_GENERATED',
      table_name: 'clinical_entries',
      record_id: patient.id,
      metadata: {
        reportType,
        period,
        pseudonymized: true,
        usedRemoteModel: Boolean(reportText),
      },
    });

    return new Response(
      JSON.stringify({
        report: reportText,
        pseudonymized: true,
        disclaimer:
          'Borrador asistido por IA con datos seudonimizados. Requiere revisión y firma del profesional tratante (Ley 26.529).',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Error interno al procesar el informe clínico' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
