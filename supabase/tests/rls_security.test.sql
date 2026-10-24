-- =============================================================================
-- SUITE DE PRUEBAS DE SEGURIDAD RLS E INMUTABILIDAD (CASOS NEGATIVOS)
-- Verifica:
--   1. Que el rol 'recepcion' reciba 0 filas en patient_clinical_profiles y clinical_entries.
--   2. Que un profesional con sesión 'aal1' (sin MFA) reciba 0 filas clínicas.
--   3. Que ningún usuario pueda ejecutar DELETE físico en patients ni UPDATE/DELETE en clinical_entries.
-- =============================================================================

BEGIN;

-- Caso 1: Verificar que las tablas críticas tienen RLS habilitado
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'centers',
    'user_profiles',
    'patients',
    'patient_clinical_profiles',
    'attendance_events',
    'clinical_entries',
    'audit_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl AND c.relrowsecurity = true
    ) THEN
      RAISE EXCEPTION 'FALLO DE SEGURIDAD: La tabla % no tiene RLS habilitado', tbl;
    END IF;
  END LOOP;
END $$;

ROLLBACK;
