import { useState, useCallback } from 'react';
import type { AppRole } from '../types/clinical';

export interface SessionUser {
  id: string;
  fullName: string;
  role: AppRole;
  mfaVerified: boolean;
}

const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  profesional: 'Lic. Valeria Méndez (M.N. 4821)',
  admin: 'Dr. Martín Quiroga (Dirección / Admin)',
  recepcion: 'Sofía Pereyra (Recepción Administrativa)',
};

export const DEFAULT_ROLE_PASSWORDS: Record<AppRole, string> = {
  admin: 'admin2026',
  profesional: 'profe2026',
  recepcion: 'recep2026',
};

const PASSWORDS_STORAGE_KEY = 'ct_role_passwords_v1';

function loadRolePasswords(): Record<AppRole, string> {
  try {
    const raw = window.localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ROLE_PASSWORDS };
    const parsed = JSON.parse(raw) as Partial<Record<AppRole, string>>;
    return {
      admin: parsed.admin || DEFAULT_ROLE_PASSWORDS.admin,
      profesional: parsed.profesional || DEFAULT_ROLE_PASSWORDS.profesional,
      recepcion: parsed.recepcion || DEFAULT_ROLE_PASSWORDS.recepcion,
    };
  } catch {
    return { ...DEFAULT_ROLE_PASSWORDS };
  }
}

export function useAuth() {
  // Inicia en null para exigir la pantalla de inicio con contraseña al abrir la app
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [rolePasswords, setRolePasswords] = useState<Record<AppRole, string>>(() =>
    loadRolePasswords()
  );

  const loginWithRolePassword = useCallback(
    (role: AppRole, passwordInput: string, customUserName?: string): boolean => {
      const expectedPassword = rolePasswords[role];
      if (passwordInput !== expectedPassword) {
        return false;
      }

      setUser({
        id: `usr_${role}`,
        fullName: customUserName?.trim() || ROLE_DISPLAY_NAMES[role],
        role,
        mfaVerified: role !== 'recepcion',
      });
      setIsLocked(false);
      return true;
    },
    [rolePasswords]
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
      if (passwordInput === rolePasswords[user.role]) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [user, rolePasswords]
  );

  const updateRolePassword = useCallback(
    (targetRole: AppRole, newPassword: string): boolean => {
      if (!user || user.role !== 'admin') return false;
      const trimmed = newPassword.trim();
      if (trimmed.length < 4) return false;

      setRolePasswords((prev) => {
        const next = { ...prev, [targetRole]: trimmed };
        try {
          window.localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignorar errores de almacenamiento restringido
        }
        return next;
      });
      return true;
    },
    [user]
  );

  return {
    user,
    isLocked,
    rolePasswords,
    loginWithRolePassword,
    logout,
    lockSession,
    unlockSession,
    updateRolePassword,
  };
}
