import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { LoginResult } from '../../hooks/useAuth';
import { EcgLogo } from '../ui/EcgLogo';

interface LoginViewProps {
  initialUserName: string;
  onLogin: (userName: string, password: string, rememberMe: boolean) => LoginResult;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialUserName,
  onLogin,
}) => {
  const [userName, setUserName] = useState(initialUserName);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = onLogin(userName, password, rememberMe);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setPassword('');
  };

  const inputClass =
    'w-full text-[15px] px-3 py-2.5 bg-[#fffdf7] border border-slate-300 rounded-[3px] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition text-slate-900 placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-kraft flex flex-col p-4 sm:p-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md paper-shadow">
          <div className="paper-sheet torn-bottom paper-curl px-7 sm:px-9 pt-8 pb-12">
            <div className="flex flex-col items-center text-center gap-1 mb-7">
              <EcgLogo className="w-24 h-12 text-teal-700" />
              <h1 className="brand-wordmark text-3xl text-slate-900">Centro Terapéutico</h1>
              <p className="text-sm text-slate-600">Ingresá con tu nombre y tu contraseña.</p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 px-3 py-2.5 border-l-4 border-rose-500 bg-rose-50 text-sm text-rose-800 flex gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-name" className="block text-sm font-semibold text-slate-800 mb-1">
                  Nombre y apellido
                </label>
                <input
                  id="login-name"
                  type="text"
                  required
                  autoComplete="username"
                  autoFocus={!initialUserName}
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Por ejemplo, Emilce Vilca"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="login-pass" className="block text-sm font-semibold text-slate-800 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    autoFocus={Boolean(initialUserName)}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-teal-700 cursor-pointer"
                />
                <span>Recordarme en este equipo</span>
              </label>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-[#f6eedd] text-[15px] font-semibold rounded-[3px] shadow-[0_2px_0_rgba(0,0,0,0.25)] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" strokeWidth={1.8} />
                Ingresar
              </button>
            </form>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#5b4a35] mt-6">
        Datos clínicos protegidos según las leyes 25.326 y 26.529.
      </p>
    </div>
  );
};
