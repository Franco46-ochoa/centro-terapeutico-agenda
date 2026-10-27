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
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
      <div className="max-w-sm w-full paper-shadow">
        <div className="paper-sheet torn-bottom px-6 pt-6 pb-10 space-y-4 text-center">
          <Lock className="w-7 h-7 mx-auto text-slate-700" strokeWidth={1.5} />

          <div>
            <h3 className="text-2xl text-slate-900">Pantalla bloqueada</h3>
            <p className="text-sm text-slate-600 mt-1">
              Escribí tu contraseña para seguir.
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{userName}</p>
          </div>

          {error && (
            <div
              role="alert"
              className="px-3 py-2 border-l-4 border-rose-500 bg-rose-50 text-rose-800 text-sm flex items-center gap-2 text-left"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>La contraseña no es correcta.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              autoFocus
              aria-label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-center text-[15px] px-3 py-2.5 bg-[#fffdf7] border border-slate-300 rounded-[3px] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-[#f6eedd] text-[15px] font-semibold rounded-[3px] transition cursor-pointer"
            >
              Desbloquear
            </button>
          </form>

          {onSwitchUser && (
            <button
              type="button"
              onClick={onSwitchUser}
              className="w-full pt-3 text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 border-t border-dashed border-slate-300 cursor-pointer"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.7} />
              Salir y entrar con otro usuario
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
