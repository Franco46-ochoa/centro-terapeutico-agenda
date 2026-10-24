import { supabase, isSupabaseConfigured } from './supabase';
import type { StaffMember } from '../hooks/useAuth';
import type { ScheduleConfig, StudentPatient } from '../types/clinical';

export interface CloudAppState {
  staffMembers: StaffMember[];
  students: StudentPatient[];
  schedulesByProf: Record<string, ScheduleConfig>;
  updatedAt: string;
}

const CLOUD_ROW_ID = 'main_workspace_state';

/**
 * Descarga el estado compartido (usuarios, contraseñas, pacientes, turnos y horarios)
 * desde Supabase Cloud (o desde el servidor local si está en red local).
 */
export async function fetchCloudState(): Promise<CloudAppState | null> {
  // 1. Intentar desde Supabase si está configurado
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await (supabase as any)
        .from('app_cloud_store')
        .select('payload, updated_at')
        .eq('id', CLOUD_ROW_ID)
        .maybeSingle();

      if (!error && data?.payload) {
        return data.payload as CloudAppState;
      }
    } catch {
      // Continuar con fallback
    }
  }

  // 2. Fallback para red local (Vite dev server)
  try {
    const res = await fetch('/api/local-sync', { method: 'GET' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.staffMembers)) {
          return data as CloudAppState;
        }
      }
    }
  } catch {
    // En producción estática sin Supabase ni middleware local, ignora silenciosamente
  }

  return null;
}

/**
 * Guarda inmediatamente en la nube cualquier cambio de usuarios, contraseñas,
 * pacientes, turnos o configuración horaria para que se vea en todos los dispositivos.
 */
export async function pushCloudState(state: CloudAppState): Promise<boolean> {
  let synced = false;

  // 1. Guardar en Supabase Cloud si está configurado
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await (supabase as any).from('app_cloud_store').upsert(
        {
          id: CLOUD_ROW_ID,
          payload: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (!error) {
        synced = true;
      }
    } catch {
      // Ignorar error de red
    }
  }

  // 2. Guardar también en servidor local si está disponible
  try {
    const res = await fetch('/api/local-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (res.ok) {
      synced = true;
    }
  } catch {
    // Ignorar en hosting estático
  }

  return synced;
}
