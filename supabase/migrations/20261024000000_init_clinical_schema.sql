-- =============================================================================
-- MIGRACIÓN INICIAL: CENTRO TERAPÉUTICO - AGENDA & HISTORIA CLÍNICA
-- Normativa aplicable (Argentina):
--   - Ley 25.326 (Protección de Datos Personales - Datos Sensibles de Salud)
--   - Disposición DNPDP 11/2006 (Medidas de Seguridad Nivel Crítico)
--   - Ley 26.529 (Derechos del Paciente, Historia Clínica Inmutable, Retención >= 10 años)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tipos Enumerados
CREATE TYPE public.app_role AS ENUM ('admin', 'profesional', 'recepcion');
CREATE TYPE public.entry_type AS ENUM ('Evolución', 'Actividad', 'Regresión', 'Enmienda');
CREATE TYPE public.attendance_status AS ENUM (
  'presente',
  'ausente_injustificado',
  'ausente_justificado',
  'reinicio_ciclo'
);

-- 2. Centros Terapéuticos (Soporte Multi-tenant)
CREATE TABLE public.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_hour INT NOT NULL DEFAULT 9 CHECK (start_hour BETWEEN 6 AND 20),
  end_hour INT NOT NULL DEFAULT 18 CHECK (end_hour BETWEEN 8 AND 23 AND end_hour > start_hour),
  slot_duration_mins INT NOT NULL DEFAULT 60 CHECK (slot_duration_mins IN (30, 45, 60, 90, 120)),
  include_saturday BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Perfiles de Usuario y Roles (Vinculado a auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  license_number TEXT,
  role public.app_role NOT NULL DEFAULT 'recepcion',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Pacientes / Alumnos (SOLO Datos Administrativos - Accesible por Recepción)
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  birth_date DATE,
  age_years INT NOT NULL CHECK (age_years BETWEEN 0 AND 99),
  tutor_name TEXT NOT NULL,
  tutor_phone TEXT NOT NULL,
  consent_signed_at TIMESTAMPTZ,
  absences_count INT NOT NULL DEFAULT 0 CHECK (absences_count >= 0),
  slot_day TEXT CHECK (slot_day IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')),
  slot_hour TEXT CHECK (slot_hour ~ '^[0-2][0-9]:[0-5][0-9]$'),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES auth.users(id),
  archive_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evitar que dos pacientes activos ocupen el mismo turno en el mismo centro
CREATE UNIQUE INDEX idx_unique_active_slot
  ON public.patients (center_id, slot_day, slot_hour)
  WHERE slot_day IS NOT NULL AND slot_hour IS NOT NULL AND archived_at IS NULL;

-- 5. Perfil Clínico Sensible (Diagnóstico - BLOQUEADO para Recepción)
CREATE TABLE public.patient_clinical_profiles (
  patient_id UUID PRIMARY KEY REFERENCES public.patients(id) ON DELETE RESTRICT,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE RESTRICT,
  condition_label TEXT NOT NULL,
  clinical_notes_encrypted BYTEA,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Eventos de Asistencia e Inasistencias Auditables
CREATE TABLE public.attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE RESTRICT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL,
  reason TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Historia Clínica (Append-Only / Inmutable - Ley 26.529 - BLOQUEADO para Recepción)
CREATE TABLE public.clinical_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE RESTRICT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type public.entry_type NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 5 AND 10000),
  amends_entry_id UUID REFERENCES public.clinical_entries(id),
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Registro de Auditoría Inmutable (Ley 25.326 / Disposición 11/2006)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID,
  actor_id UUID DEFAULT auth.uid(),
  actor_role TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funciones Helper de Seguridad (SECURITY DEFINER con search_path fijo)
CREATE OR REPLACE FUNCTION public.current_user_center_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT center_id FROM public.user_profiles WHERE id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.has_mfa_aal2()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

-- Trigger que impide UPDATE o DELETE en clinical_entries (Inmutabilidad Ley 26.529)
CREATE OR REPLACE FUNCTION public.prevent_clinical_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'La Historia Clínica es inmutable (Ley 26.529). Para rectificar un asiento, agregue una entrada de tipo Enmienda.';
END;
$$;

CREATE TRIGGER trg_immutable_clinical_entries
BEFORE UPDATE OR DELETE ON public.clinical_entries
FOR EACH ROW EXECUTE FUNCTION public.prevent_clinical_modification();

-- Trigger que impide DELETE físico de pacientes (Conservación mínima 10 años Ley 26.529)
CREATE OR REPLACE FUNCTION public.prevent_patient_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Prohibido eliminar físicamente un paciente (Ley 26.529 Art. 18). Utilice el archivado lógico (archived_at).';
END;
$$;

CREATE TRIGGER trg_no_hard_delete_patients
BEFORE DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.prevent_patient_hard_delete();

-- Trigger de Auditoría Automática
CREATE OR REPLACE FUNCTION public.log_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (center_id, actor_id, actor_role, action, table_name, record_id, metadata)
  VALUES (
    COALESCE(NEW.center_id, OLD.center_id),
    auth.uid(),
    public.current_user_role()::text,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('timestamp', now())
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_patients
AFTER INSERT OR UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_changes();

CREATE TRIGGER trg_audit_clinical_entries
AFTER INSERT ON public.clinical_entries
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_changes();

-- ACTIVAR RLS EN TODAS LAS TABLAS (DENY BY DEFAULT)
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_clinical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS: CENTERS
CREATE POLICY "centers_select_own" ON public.centers
  FOR SELECT TO authenticated
  USING (id = public.current_user_center_id());

CREATE POLICY "centers_update_admin_only" ON public.centers
  FOR UPDATE TO authenticated
  USING (id = public.current_user_center_id() AND public.current_user_role() = 'admin' AND public.has_mfa_aal2())
  WITH CHECK (id = public.current_user_center_id() AND public.current_user_role() = 'admin' AND public.has_mfa_aal2());

-- POLÍTICAS RLS: PATIENTS (Recepción, Profesional y Admin del mismo centro)
CREATE POLICY "patients_select_same_center" ON public.patients
  FOR SELECT TO authenticated
  USING (center_id = public.current_user_center_id());

CREATE POLICY "patients_insert_same_center" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (center_id = public.current_user_center_id());

CREATE POLICY "patients_update_same_center" ON public.patients
  FOR UPDATE TO authenticated
  USING (center_id = public.current_user_center_id())
  WITH CHECK (center_id = public.current_user_center_id());

-- POLÍTICAS RLS: ATTENDANCE_EVENTS
CREATE POLICY "attendance_select_same_center" ON public.attendance_events
  FOR SELECT TO authenticated
  USING (center_id = public.current_user_center_id());

CREATE POLICY "attendance_insert_same_center" ON public.attendance_events
  FOR INSERT TO authenticated
  WITH CHECK (center_id = public.current_user_center_id() AND recorded_by = auth.uid());

-- POLÍTICAS RLS: PATIENT_CLINICAL_PROFILES (SOLO Profesional y Admin con MFA aal2; Recepción DENEGADO)
CREATE POLICY "clinical_profile_select_clinical_roles_only" ON public.patient_clinical_profiles
  FOR SELECT TO authenticated
  USING (
    center_id = public.current_user_center_id()
    AND public.current_user_role() IN ('admin', 'profesional')
    AND public.has_mfa_aal2()
  );

CREATE POLICY "clinical_profile_write_clinical_roles_only" ON public.patient_clinical_profiles
  FOR ALL TO authenticated
  USING (
    center_id = public.current_user_center_id()
    AND public.current_user_role() IN ('admin', 'profesional')
    AND public.has_mfa_aal2()
  )
  WITH CHECK (
    center_id = public.current_user_center_id()
    AND public.current_user_role() IN ('admin', 'profesional')
    AND public.has_mfa_aal2()
  );

-- POLÍTICAS RLS: CLINICAL_ENTRIES (SOLO Profesional y Admin con MFA aal2, Append-Only)
CREATE POLICY "clinical_entries_select_clinical_only" ON public.clinical_entries
  FOR SELECT TO authenticated
  USING (
    center_id = public.current_user_center_id()
    AND public.current_user_role() IN ('admin', 'profesional')
    AND public.has_mfa_aal2()
  );

CREATE POLICY "clinical_entries_insert_clinical_only" ON public.clinical_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    center_id = public.current_user_center_id()
    AND author_id = auth.uid()
    AND public.current_user_role() IN ('admin', 'profesional')
    AND public.has_mfa_aal2()
  );

-- POLÍTICAS RLS: AUDIT_LOGS (Solo lectura para Admin con MFA aal2)
CREATE POLICY "audit_logs_select_admin_only" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    center_id = public.current_user_center_id()
    AND public.current_user_role() = 'admin'
    AND public.has_mfa_aal2()
  );
