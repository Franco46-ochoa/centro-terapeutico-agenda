# Plan Maestro de Arquitectura y Seguridad (AppSec) - Centro Terapéutico

> **Propósito de este documento:** Hoja de ruta técnica y de seguimiento fase por fase para transformar `gestor_terap_utico_y_agenda_de_pacientes (1).tsx` en una aplicación de producción multi-dispositivo (PC Windows, Celular Android/iOS y Web) cumpliendo con la **Ley 25.326** (Protección de Datos Personales) y la **Ley 26.529** (Derechos del Paciente e Historia Clínica) en la República Argentina.

---

## Estado de Avance por Fases

- [x] **Paso 0:** Crear `PLAN_PROYECTO.md` en la carpeta del proyecto.
- [x] **Paso Inicial:** Crear toda la estructura de carpetas y los 35 archivos vacíos del proyecto.
- [x] **Fase 1:** Base del Proyecto (Vite + React + TS + Tailwind), Validación con `Zod` y UI Responsive (PC + Móvil).
- [x] **Fase 2:** Base de Datos Segura en Supabase (`schema.sql`), RLS por Rol (`admin`, `profesional`, `recepcion`), Inmutabilidad Ley 26.529, `audit_logs` y Sincronización Realtime.
- [x] **Fase 3:** Autenticación Invite-Only, MFA (TOTP) Obligatorio, Bloqueo por Inactividad (`useIdleTimeout` + `Ctrl+L`) y Revocación de Sesiones.
- [x] **Fase 4:** IA Segura (Edge Function de Gemini con Seudonimización de PII) e Impresión Legal (`@media print`).
- [x] **Fase 5:** Cifrado Local con WebCrypto (`AES-GCM` 256 bits) y Exportación/Importación de Backups Cifrados (`.enc.json`).
- [x] **Fase 6:** Empaquetado como Programa de PC (PWA Instalable + Electron Endurecido), App Móvil y Despliegue Seguro en Vercel (`vercel.json`).
- [x] **Fase 7 (diseño):** Estilo "agenda de papel" en todas las pantallas (papel, kraft y tinta; Cormorant Garamond + Nunito Sans autoalojadas), logo de electrocardiograma, campanita de avisos y estado de la nube funcionales.

---

## 0. Auditoría del Código Original y Vulnerabilidades Corregidas

1. **Llamada directa a Gemini desde el navegador y exposición de API Key:**
   - *Corrección:* Se elimina `geminiApiKey` del cliente. La llamada pasa a la Edge Function `supabase/functions/generate-clinical-report/index.ts`, autenticada por JWT y rol clínico, con *rate limiting* y seudonimización automática (`{{PACIENTE}}`).
2. **Almacenamiento en texto plano en `localStorage`:**
   - *Corrección:* Prohibido guardar datos clínicos o diagnósticos en `localStorage` en texto plano. Se implementa `src/lib/cryptoStorage.ts` usando **WebCrypto (`AES-GCM` de 256 bits + `PBKDF2` de 600.000 iteraciones)** y limpieza automática al cerrar o bloquear sesión. En dispositivos móviles no se cachea el historial clínico offline.
3. **Borrado físico (`handleDeleteStudent`) y mutabilidad de la Historia Clínica:**
   - *Corrección:* La **Ley 26.529 (Art. 18)** exige conservar la historia clínica por un mínimo de **10 años** garantizando integridad, inalterabilidad y autoría. Se reemplaza el borrado físico por **archivado lógico (`archived_at`, `archive_reason`)** y las entradas de `clinical_entries` son **append-only** (las correcciones se registran mediante asientos de tipo `Enmienda`).
4. **Separación de Privilegios (Recepción vs. Profesionales):**
   - *Corrección:* Separación de las tablas `patients` (datos administrativos y turnos) respecto de `patient_clinical_profiles` (diagnóstico) y `clinical_entries` (evoluciones). El rol `recepcion` **no tiene permiso `SELECT` en tablas clínicas** a nivel de RLS en PostgreSQL ni en la interfaz.
5. **Trazabilidad de Inasistencias:**
   - *Corrección:* Cada falta o reinicio de ciclo queda registrado con fecha, motivo y autor en `attendance_events` y `audit_logs`.

---

## 1. Arquitectura Elegida y Flujo de Datos

```text
+-----------------------------------------------------------------------------------+
|                                CLIENTES (Frontend)                                |
|  [PC Windows: PWA / Electron]     [Celular: PWA / Capacitor]     [Navegador Web]  |
|                                                                                   |
|  +-------------------+   +-----------------------+   +-------------------------+  |
|  | UI React + Zod    |   | Idle Timer (10 min)   |   | Cifrado Local WebCrypto |  |
|  | (Vista por Rol)   |   | + Bloqueo Rápido      |   | AES-GCM 256 bits        |  |
|  +---------+---------+   +-----------+-----------+   +------------+------------+  |
+------------|-------------------------|----------------------------|---------------+
             | HTTPS + TLS 1.3         | JWT + TOTP (aal2)          | Realtime Sync
             v                         v                            v
+-----------------------------------------------------------------------------------+
|                          SUPABASE (Backend-as-a-Service)                          |
|                                                                                   |
|  - Supabase Auth (Invite-Only + MFA TOTP obligatorio para roles clínicos)         |
|  - PostgreSQL + RLS (Deny-by-default) + Triggers de Inmutabilidad y Auditoría     |
|  - Supabase Realtime (Sincronización instantánea de turnos y faltas entre PCs)    |
|  - Edge Function: generate-clinical-report (Seudonimiza PII -> Llama a Gemini)    |
+-----------------------------------------------------------------------------------+
```

### Decisiones por Plataforma
- **Escritorio (Windows):** **PWA Instalable (Chrome/Edge)** para actualizaciones instantáneas de seguridad sin costo de certificado EV SmartScreen + **Electron Endurecido (`electron/main.cjs`)** listo para empaquetar como `.exe`.
- **Móvil (Android/iOS):** **PWA Mobile Responsive** con vista diaria táctil, bloqueo automático en segundo plano y cero caché offline de historias clínicas.

---

## 2. Detalle de las 6 Fases de Implementación

### FASE 1: Base del Proyecto, Modularización y Validación (`Zod`)
- Inicializar `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/index.css`, `.gitignore`, `.env.example`.
- Crear `src/types/clinical.ts` y `src/schemas/clinical.schema.ts` (validaciones `Zod` para alumnos, turnos, notas clínicas, configuración horaria y backups).
- Adaptar la interfaz para ser **100% responsive** (grilla semanal completa en PC y selector por día en celular).

### FASE 2: Base de Datos Segura en Supabase, RLS y Auditoría Legal
- Crear `supabase/migrations/20261024000000_init_clinical_schema.sql`:
  - Tablas: `centers`, `user_profiles`, `patients`, `patient_clinical_profiles`, `attendance_events`, `clinical_entries`, `audit_logs`.
  - Políticas RLS por rol (`admin`, `profesional`, `recepcion`) y por `center_id`.
  - Triggers de inmutabilidad (`prevent_clinical_modification`) y auditoría (`log_sensitive_changes`).
- Crear `supabase/tests/rls_security.test.sql` con casos negativos de prueba.
- Implementar cliente Supabase (`src/lib/supabase.ts`) y sincronización Realtime.

### FASE 3: Autenticación, Roles, MFA Obligatorio y Seguridad en PCs Compartidas
- Implementar control de sesión, selector/simulador de rol para pruebas locales y conexión real con Supabase Auth + MFA (`aal2`).
- Implementar `src/hooks/useIdleTimeout.ts` (bloqueo automático tras 10 minutos de inactividad o con atajo `Ctrl + L`) y pantalla de bloqueo `src/components/auth/IdleLockOverlay.tsx`.
- Crear Edge Function `supabase/functions/invite-staff/index.ts` para alta de personal por invitación.

### FASE 4: IA Segura (Edge Function de Gemini con Seudonimización) e Impresión Legal
- Crear `src/lib/anonymizer.ts` y `supabase/functions/generate-clinical-report/index.ts`.
- Garantizar que nombres propios, datos del tutor, teléfonos y DNIs se reemplacen por `{{PACIENTE}}` antes de enviar el prompt y se rehidraten localmente en la vista previa del profesional.
- Incorporar leyenda obligatoria de revisión profesional (Ley 26.529) y estilos `@media print` con pie de firma, fecha/hora y aviso de confidencialidad (Ley 25.326).

### FASE 5: Cifrado Local (`WebCrypto AES-GCM`) y Copias de Seguridad Cifradas
- Implementar `src/lib/cryptoStorage.ts` usando `window.crypto.subtle` (`AES-GCM` 256-bit + `PBKDF2` 600.000 iteraciones SHA-256).
- Implementar exportación e importación de archivos `.enc.json` cifrados con contraseña, validados con `Zod` al importar y exclusivos para el rol `admin`.

### FASE 6: Programa de PC (PWA + Electron Endurecido), App Móvil y Deploy en Vercel
- Crear `public/manifest.webmanifest`, `public/sw.js` (Service Worker que excluye rutas clínicas del caché) e ícono vectorial (`public/icon.svg`).
- Crear `electron/main.cjs` y `electron/preload.cjs` endurecidos (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `spellcheck: false`, bloqueo de navegación externa).
- Crear `vercel.json` con cabeceras CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y `Permissions-Policy`.
- Crear `.github/workflows/ci-security.yml` y verificar compilación (`npm run build`, `tsc --noEmit`, `npm audit`).

---

## 3. Cumplimiento Normativo en Argentina (Resumen Operativo)

> *Nota: La redacción legal definitiva del consentimiento informado y la inscripción ante la AAIP deben ser validadas por un abogado matriculado en Argentina.*

1. **Ley 25.326 (Protección de Datos Personales):**
   - Registro del Consentimiento Informado firmado por el tutor legal del menor (`consent_signed`, fecha y observaciones).
   - Separación estricta de datos sensibles de salud respecto del personal administrativo (`recepcion`).
   - Registro de auditoría (`audit_logs`) de accesos, creaciones, enmiendas y exportaciones (Disposición DNPDP 11/2006 - Nivel Crítico).
2. **Ley 26.529 (Derechos del Paciente e Historia Clínica):**
   - Prohibición de borrado físico (`DELETE`) de pacientes e historias clínicas; uso exclusivo de **archivado lógico** con motivo justificado.
   - Inmutabilidad de los asientos clínicos (`Evolución`, `Actividad`, `Regresión`); cualquier corrección se realiza agregando una entrada vinculada de tipo **`Enmienda`** (*Fe de erratas*) conservando el asiento original intacto.
   - Trazabilidad de autoría (`author_name`, `author_role`, `created_at`) en cada registro.
