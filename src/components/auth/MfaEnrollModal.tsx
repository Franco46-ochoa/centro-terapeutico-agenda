import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface MfaEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const MfaEnrollModal: React.FC<MfaEnrollModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(code)) {
      onVerified();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="paper-sheet max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Verificación de Segundo Factor (MFA TOTP - aal2)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-[3px]">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Para acceder a historias clínicas y diagnósticos de menores (Ley 25.326), ingrese el
          código de 6 dígitos de su aplicación autenticadora.
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-center text-lg font-mono tracking-widest p-2.5 bg-slate-50 border border-slate-200 rounded-[3px] outline-none focus:ring-2 focus:ring-teal-500"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-[3px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-[3px]"
            >
              Verificar MFA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
