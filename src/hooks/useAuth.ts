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
  rawName: string;
  specialtyOrLicense: string;
  fullName: string;
  role: AppRole;
  mfaVerified: boolean;
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
    fullName: 'Administrador',
    specialtyOrLicense: 'Gestión Comercial y Suscripciones',
    role: 'admin',
    password: 'admin2026',
    active: true,
    subscriptionStatus: 'activa',
  },
  {
    id: 'staff_recep_1',
    fullName: 'Sofía Pereyra',
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
const REMEMBERED_NAME_KEY = 'ct_remembered_username_v2';
const REMEMBERED_SESSION_STAFF_ID_KEY = 'ct_remembered_session_id_v2';

/**
 * Normaliza un nombre quitando tildes, puntos, prefijos profesionales ("lic.", "dr.", "dra.")
 * y espacios múltiples para que el usuario pueda escribir tanto "Valeria Mendez"
 * como "Lic. Valeria Méndez".
 */
function normalizePersonName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(lic|licenciado|licenciada|dr|dra|doctor|doctora|prof)\.?\s*/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

function buildSessionFromMember(
  found: StaffMember,
  allMembers: StaffMember[]
): SessionUser {
  const ownerProf =
    found.role === 'recepcion'
      ? allMembers.find((p) => p.id === found.linkedProfessionalId)
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

  return {
    id: found.id,
    rawName: found.fullName,
    specialtyOrLicense: found.specialtyOrLicense,
    fullName: displayLabel,
    role: found.role,
    mfaVerified: found.role !== 'recepcion',
    workspaceOwnerId,
    workspaceOwnerName,
  };
}

export function useAuth() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() =>
    loadStaffMembers()
  );

  const [rememberedUserName, setRememberedUserName] = useState<string>(() => {
    try {
      return window.localStorage.getItem(REMEMBERED_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  // Si el usuario dejó marcada la opción "Recordar mi sesión en este equipo", restaurarla
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const savedStaffId = window.localStorage.getItem(REMEMBERED_SESSION_STAFF_ID_KEY);
      if (!savedStaffId) return null;
      const members = loadStaffMembers();
      const found = members.find((m) => m.id === savedStaffId && m.active);
      if (!found || found.subscriptionStatus === 'pausada') return null;
      if (found.role === 'recepcion') {
        const owner = members.find((p) => p.id === found.linkedProfessionalId);
        if (owner && owner.subscriptionStatus === 'pausada') return null;
      }
      return buildSessionFromMember(found, members);
    } catch {
      return null;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);

  const loginByNameAndPassword = useCallback(
    (
      userNameInput: string,
      passwordInput: string,
      rememberMe: boolean
    ): LoginResult => {
      const cleanInput = normalizePersonName(userNameInput);
      const rawTrimmed = userNameInput.trim().toLowerCase();

      if (!cleanInput) {
        return {
          ok: false,
          reason: 'invalid_credentials',
          message: 'Por favor ingrese su Nombre y Apellido.',
        };
      }

      // Buscar usuario por coincidencia de nombre normalizado o coincidencia con "admin"/"administrador"
      const matchingMembers = staffMembers.filter((m) => {
        if (!m.active) return false;
        const normalizedMember = normalizePersonName(m.fullName);
        if (normalizedMember === cleanInput || m.fullName.toLowerCase() === rawTrimmed) {
          return true;
        }
        if (
          m.role === 'admin' &&
          (rawTrimmed === 'admin' ||
            rawTrimmed === 'administrador' ||
            rawTrimmed === 'administrador de usuarios')
        ) {
          return true;
        }
        return false;
      });

      // Si hay coincidencia de nombre, verificar la contraseña
      const found =
        matchingMembers.find((m) => m.password === passwordInput) ??
        matchingMembers[0];

      if (!found || found.password !== passwordInput) {
        return {
          ok: false,
          reason: 'invalid_credentials',
          message:
            'Usuario o contraseña incorrectos. Verifique su Nombre y Apellido y su clave.',
        };
      }

      // Verificar estado de suscripción
      if (found.role === 'profesional' && found.subscriptionStatus === 'pausada') {
        return {
          ok: false,
          reason: 'subscription_paused',
          message:
            'Su suscripción mensual se encuentra pausada o pendiente de renovación. Contacte al Administrador para reactivar su agenda.',
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
              'La suscripción del profesional titular se encuentra pausada. Contacte al Administrador.',
          };
        }
      }

      try {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBERED_NAME_KEY, found.fullName);
          window.localStorage.setItem(REMEMBERED_SESSION_STAFF_ID_KEY, found.id);
          setRememberedUserName(found.fullName);
        } else {
          window.localStorage.removeItem(REMEMBERED_NAME_KEY);
          window.localStorage.removeItem(REMEMBERED_SESSION_STAFF_ID_KEY);
          setRememberedUserName('');
        }
      } catch {
        // Ignorar errores de almacenamiento
      }

      setUser(buildSessionFromMember(found, staffMembers));
      setIsLocked(false);
      return { ok: true, member: found };
    },
    [staffMembers]
  );

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(REMEMBERED_SESSION_STAFF_ID_KEY);
    } catch {
      // Ignorar
    }
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

  /**
   * Permite que el propio usuario autenticado cambie su Nombre y Apellido,
   * su Especialidad/Matrícula y/o su propia Contraseña desde su Cuenta Personal.
   */
  const updateOwnProfile = useCallback(
    (changes: {
      fullName: string;
      specialtyOrLicense: string;
      newPassword?: string;
    }): { ok: boolean; message: string } => {
      if (!user) {
        return { ok: false, message: 'No hay sesión activa.' };
      }

      const trimmedName = changes.fullName.trim();
      const trimmedSpec = changes.specialtyOrLicense.trim();
      const trimmedPass = changes.newPassword?.trim();

      if (trimmedName.length < 2) {
        return {
          ok: false,
          message: 'El Nombre y Apellido debe tener al menos 2 caracteres.',
        };
      }

      if (trimmedPass && trimmedPass.length < 4) {
        return {
          ok: false,
          message: 'La nueva contraseña debe tener al menos 4 caracteres.',
        };
      }

      let updatedMember: StaffMember | null = null;
      const nextList = staffMembers.map((m) => {
        if (m.id === user.id) {
          updatedMember = {
            ...m,
            fullName: trimmedName,
            specialtyOrLicense: trimmedSpec || m.specialtyOrLicense,
            password: trimmedPass ? trimmedPass : m.password,
          };
          return updatedMember;
        }
        // Si un profesional cambió su nombre, actualizar la referencia en sus recepcionistas vinculadas
        if (m.linkedProfessionalId === user.id) {
          return {
            ...m,
            linkedProfessionalName: trimmedName,
            specialtyOrLicense: `Recepción vinculada a ${trimmedName}`,
          };
        }
        return m;
      });

      saveStaffMembers(nextList);
      setStaffMembers(nextList);

      try {
        window.localStorage.setItem(REMEMBERED_NAME_KEY, trimmedName);
        setRememberedUserName(trimmedName);
      } catch {
        // Ignorar
      }

      if (updatedMember) {
        setUser(buildSessionFromMember(updatedMember, nextList));
      }

      return {
        ok: true,
        message: 'Sus datos personales y contraseña se actualizaron correctamente.',
      };
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
    rememberedUserName,
    loginByNameAndPassword,
    updateOwnProfile,
    logout,
    lockSession,
    unlockSession,
    addStaffMember,
    toggleSubscriptionStatus,
    updateStaffPassword,
    removeStaffMember,
  };
}
