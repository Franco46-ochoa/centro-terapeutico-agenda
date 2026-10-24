import { useState, useCallback } from 'react';
import type { AppRole } from '../types/clinical';

export type SubscriptionStatus = 'activa' | 'pausada';

export interface StaffMember {
  id: string;
  fullName: string;
  specialtyOrLicense: string;
  role: AppRole;
  password: string;
  active: boolean;
  subscriptionStatus: SubscriptionStatus;
  linkedProfessionalId?: string;
  linkedProfessionalName?: string;
}

export interface SessionUser {
  id: string;
  fullName: string;
  role: AppRole;
  mfaVerified: boolean;
  /**
   * ID del profesional dueño de la agenda/consultorio:
   * - Si inicia sesión un 'profesional', es su propio id.
   * - Si inicia sesión una 'recepcion', es el linkedProfessionalId del profesional al que asiste.
   * - Si inicia sesión un 'admin', puede inspeccionar o gestionar usuarios.
   */
  workspaceOwnerId: string;
  workspaceOwnerName: string;
}

export type LoginResult =
  | { ok: true; member: StaffMember }
  | { ok: false; reason: 'invalid_credentials' | 'subscription_paused'; message: string };

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff_profe_1',
    fullName: 'Lic. Valeria Méndez',
    specialtyOrLicense: 'Psicopedagogía • M.N. 4821',
    role: 'profesional',
    password: 'profe2026',
    active: true,
    subscriptionStatus: 'activa',
  },
  {
    id: 'staff_profe_2',
    fullName: 'Lic. Juan Ignacio Pérez',
    specialtyOrLicense: 'Terapia Ocupacional • M.N. 9104',
    role: 'profesional',
    password: 'juan2026',
    active: true,
    subscriptionStatus: 'activa',
  },
  {
    id: 'staff_admin_1',
    fullName: 'Administrador de Usuarios',
    specialtyOrLicense: 'Gestión Comercial y Suscripciones',
    role: 'admin',
    password: 'admin2026',
    active: true,
    subscriptionStatus: 'activa',
  },
  {
    id: 'staff_recep_1',
    fullName: 'Sofía Pereyra (Secretaria)',
    specialtyOrLicense: 'Recepción vinculada a Lic. Valeria Méndez',
    role: 'recepcion',
    password: 'recep2026',
    active: true,
    subscriptionStatus: 'activa',
    linkedProfessionalId: 'staff_profe_1',
    linkedProfessionalName: 'Lic. Valeria Méndez',
  },
];

const STAFF_STORAGE_KEY = 'ct_staff_members_v2';

function loadStaffMembers(): StaffMember[] {
  try {
    const raw = window.localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return [...INITIAL_STAFF_MEMBERS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((m: StaffMember) => ({
        ...m,
        subscriptionStatus: m.subscriptionStatus || 'activa',
      }));
    }
    return [...INITIAL_STAFF_MEMBERS];
  } catch {
    return [...INITIAL_STAFF_MEMBERS];
  }
}

function saveStaffMembers(list: StaffMember[]) {
  try {
    window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignorar errores de almacenamiento restringido
  }
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() =>
    loadStaffMembers()
  );

  const loginWithStaffPassword = useCallback(
    (staffId: string, passwordInput: string): LoginResult => {
      const found = staffMembers.find((s) => s.id === staffId && s.active);
      if (!found || found.password !== passwordInput) {
        return {
          ok: false,
          reason: 'invalid_credentials',
          message:
            'Contraseña incorrecta para el usuario seleccionado. Verifique su clave asignada.',
        };
      }

      // Verificar estado de suscripción del profesional (o del profesional vinculado si es recepcionista)
      if (found.role === 'profesional' && found.subscriptionStatus === 'pausada') {
        return {
          ok: false,
          reason: 'subscription_paused',
          message:
            'Su suscripción mensual se encuentra pausada o pendiente de renovación. Contacte al Administrador de Usuarios para reactivar su agenda.',
        };
      }

      if (found.role === 'recepcion') {
        const ownerProf = staffMembers.find(
          (p) => p.id === found.linkedProfessionalId && p.active
        );
        if (
          found.subscriptionStatus === 'pausada' ||
          (ownerProf && ownerProf.subscriptionStatus === 'pausada')
        ) {
          return {
            ok: false,
            reason: 'subscription_paused',
            message:
              'La suscripción del profesional titular se encuentra pausada. Contacte al Administrador de Usuarios.',
          };
        }
      }

      const ownerProf =
        found.role === 'recepcion'
          ? staffMembers.find((p) => p.id === found.linkedProfessionalId)
          : found;

      const workspaceOwnerId =
        found.role === 'recepcion'
          ? found.linkedProfessionalId || 'staff_profe_1'
          : found.id;

      const workspaceOwnerName =
        found.role === 'recepcion'
          ? ownerProf?.fullName || found.linkedProfessionalName || 'Profesional Titular'
          : found.fullName;

      const displayLabel = found.specialtyOrLicense
        ? `${found.fullName} (${found.specialtyOrLicense})`
        : found.fullName;

      setUser({
        id: found.id,
        fullName: displayLabel,
        role: found.role,
        mfaVerified: found.role !== 'recepcion',
        workspaceOwnerId,
        workspaceOwnerName,
      });
      setIsLocked(false);
      return { ok: true, member: found };
    },
    [staffMembers]
  );

  const logout = useCallback(() => {
    setUser(null);
    setIsLocked(false);
  }, []);

  const lockSession = useCallback(() => {
    if (user) {
      setIsLocked(true);
    }
  }, [user]);

  const unlockSession = useCallback(
    (passwordInput: string): boolean => {
      if (!user) return false;
      const currentStaff = staffMembers.find((s) => s.id === user.id);
      if (currentStaff && currentStaff.password === passwordInput) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [user, staffMembers]
  );

  const addStaffMember = useCallback(
    (newMember: {
      fullName: string;
      specialtyOrLicense: string;
      role: AppRole;
      password: string;
      linkedProfessionalId?: string;
    }): StaffMember | null => {
      if (!user || user.role !== 'admin') return null;
      const fullName = newMember.fullName.trim();
      const password = newMember.password.trim();
      if (fullName.length < 2 || password.length < 4) return null;

      const linkedProf =
        newMember.role === 'recepcion' && newMember.linkedProfessionalId
          ? staffMembers.find((p) => p.id === newMember.linkedProfessionalId)
          : undefined;

      const specialtyLabel =
        newMember.role === 'recepcion' && linkedProf
          ? `Recepción vinculada a ${linkedProf.fullName}`
          : newMember.specialtyOrLicense.trim() || 'Profesional Titular';

      const created: StaffMember = {
        id: 'staff_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        fullName,
        specialtyOrLicense: specialtyLabel,
        role: newMember.role,
        password,
        active: true,
        subscriptionStatus: 'activa',
        linkedProfessionalId:
          newMember.role === 'recepcion' ? linkedProf?.id : undefined,
        linkedProfessionalName:
          newMember.role === 'recepcion' ? linkedProf?.fullName : undefined,
      };

      setStaffMembers((prev) => {
        const next = [...prev, created];
        saveStaffMembers(next);
        return next;
      });
      return created;
    },
    [user, staffMembers]
  );

  const toggleSubscriptionStatus = useCallback(
    (staffId: string): SubscriptionStatus | null => {
      if (!user || user.role !== 'admin') return null;
      let updatedStatus: SubscriptionStatus = 'activa';

      setStaffMembers((prev) => {
        const next = prev.map((s) => {
          if (s.id === staffId) {
            updatedStatus = s.subscriptionStatus === 'activa' ? 'pausada' : 'activa';
            return { ...s, subscriptionStatus: updatedStatus };
          }
          return s;
        });
        saveStaffMembers(next);
        return next;
      });
      return updatedStatus;
    },
    [user]
  );

  const updateStaffPassword = useCallback(
    (staffId: string, newPassword: string): boolean => {
      if (!user || user.role !== 'admin') return false;
      const trimmed = newPassword.trim();
      if (trimmed.length < 4) return false;

      setStaffMembers((prev) => {
        const next = prev.map((s) =>
          s.id === staffId ? { ...s, password: trimmed } : s
        );
        saveStaffMembers(next);
        return next;
      });
      return true;
    },
    [user]
  );

  const removeStaffMember = useCallback(
    (staffId: string): boolean => {
      if (!user || user.role !== 'admin') return false;
      if (staffId === user.id) return false;

      setStaffMembers((prev) => {
        const next = prev.filter((s) => s.id !== staffId);
        saveStaffMembers(next);
        return next;
      });
      return true;
    },
    [user]
  );

  return {
    user,
    isLocked,
    staffMembers,
    loginWithStaffPassword,
    logout,
    lockSession,
    unlockSession,
    addStaffMember,
    toggleSubscriptionStatus,
    updateStaffPassword,
    removeStaffMember,
  };
}
