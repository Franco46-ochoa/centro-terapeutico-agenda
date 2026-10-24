import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  KeyRound,
} from 'lucide-react';
import type { LoginResult } from '../../hooks/useAuth';

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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          {/* Encabezado */}
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
            <div className="p-3 bg-teal-500 text-slate-900 rounded-xl shadow-sm shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Agenda Clínica Personal
              </h1>
              <p className="text-xs text-slate-500">
                Ingrese su Nombre y Apellido y su contraseña personal
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario de Ingreso Directo por Nombre y Contraseña */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Nombre y Apellido</span>
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                autoFocus={!initialUserName}
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setError(null);
                }}
                placeholder="Escriba su nombre y apellido..."
                className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                <span>Contraseña</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  autoFocus={Boolean(initialUserName)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ingrese su contraseña..."
                  className="w-full text-sm p-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Recordar Usuario y Sesión */}
            <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
              />
              <span>Recordar mi usuario y mantener sesión iniciada en este equipo</span>
            </label>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Ingresar a Mi Agenda</span>
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-4">
        Acceso Privado • Protección de Datos Clínicos Ley 25.326 y Ley 26.529
      </p>
    </div>
  );
};
