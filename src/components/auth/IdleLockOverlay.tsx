import React, { useState } from 'react';
import { Lock, ShieldAlert, LogOut } from 'lucide-react';

interface IdleLockOverlayProps {
  isLocked: boolean;
  userName: string;
  onUnlock: (password: string) => boolean;
  onSwitchUser?: () => void;
}

export const IdleLockOverlay: React.FC<IdleLockOverlayProps> = ({
  isLocked,
  userName,
  onUnlock,
  onSwitchUser,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUnlock(password)) {
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">
            Sesión Bloqueada por Seguridad
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingrese la contraseña de su perfil para reanudar o cambie de usuario.
          </p>
          <p className="text-xs font-semibold text-teal-700 mt-1">{userName}</p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Contraseña incorrecta para el perfil activo.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            placeholder="Contraseña de su rol activo..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-center text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
          >
            Desbloquear Pantalla
          </button>
        </form>

        {onSwitchUser && (
          <button
            type="button"
            onClick={onSwitchUser}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión y volver a la pantalla de inicio</span>
          </button>
        )}
      </div>
    </div>
  );
};
