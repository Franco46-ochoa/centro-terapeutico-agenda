import { useState, useCallback } from 'react';
import type { AppRole } from '../types/clinical';

export interface StaffMember {
  id: string;
  fullName: string;
  specialtyOrLicense: string;
  role: AppRole;
  password: string;
  active: boolean;
}

export interface SessionUser {
  id: string;
  fullName: string;
  role: AppRole;
  mfaVerified: boolean;
}

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff_profe_1',
    fullName: 'Lic. Valeria Méndez',
    specialtyOrLicense: 'Psicopedagogía • M.N. 4821',
    role: 'profesional',
    password: 'profe2026',
    active: true,
  },
  {
    id: 'staff_profe_2',
    fullName: 'Lic. Juan Ignacio Pérez',
    specialtyOrLicense: 'Terapia Ocupacional • M.N. 9104',
    role: 'profesional',
    password: 'juan2026',
    active: true,
  },
  {
    id: 'staff_admin_1',
    fullName: 'Dr. Martín Quiroga',
    specialtyOrLicense: 'Dirección Médica',
    role: 'admin',
    password: 'admin2026',
    active: true,
  },
  {
    id: 'staff_recep_1',
    fullName: 'Sofía Pereyra',
    specialtyOrLicense: 'Secretaría Turno Mañana',
    role: 'recepcion',
    password: 'recep2026',
    active: true,
  },
];

const STAFF_STORAGE_KEY = 'ct_staff_members_v1';

function loadStaffMembers(): StaffMember[] {
  try {
    const raw = window.localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return [...INITIAL_STAFF_MEMBERS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
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
    // Ignorar errores de cuota o modo privado
  }
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() =>
    loadStaffMembers()
  );

  const loginWithStaffPassword = useCallback(
    (staffId: string, passwordInput: string): StaffMember | null => {
      const found = staffMembers.find((s) => s.id === staffId && s.active);
      if (!found || found.password !== passwordInput) {
        return null;
      }

      const displayLabel = found.specialtyOrLicense
        ? `${found.fullName} (${found.specialtyOrLicense})`
        : found.fullName;

      setUser({
        id: found.id,
        fullName: displayLabel,
        role: found.role,
        mfaVerified: found.role !== 'recepcion',
      });
      setIsLocked(false);
      return found;
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
    }): StaffMember | null => {
      if (!user || user.role !== 'admin') return null;
      const fullName = newMember.fullName.trim();
      const password = newMember.password.trim();
      if (fullName.length < 2 || password.length < 4) return null;

      const created: StaffMember = {
        id: 'staff_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        fullName,
        specialtyOrLicense: newMember.specialtyOrLicense.trim() || 'Personal del Centro',
        role: newMember.role,
        password,
        active: true,
      };

      setStaffMembers((prev) => {
        const next = [...prev, created];
        saveStaffMembers(next);
        return next;
      });
      return created;
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
      // Evitar que el admin elimine su propio usuario en sesión activa
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
    updateStaffPassword,
    removeStaffMember,
  };
}
