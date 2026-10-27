import React, { useState } from 'react';
import { Lock, Download, Upload, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  decryptJsonWithPassphrase,
  encryptJsonWithPassphrase,
} from '../../lib/cryptoStorage';
import { BackupPayloadSchema } from '../../schemas/clinical.schema';
import type { ScheduleConfig, StudentPatient } from '../../types/clinical';

interface EncryptedBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentPatient[];
  scheduleConfig: ScheduleConfig;
  currentUserName: string;
  onRestoreBackup: (students: StudentPatient[], scheduleConfig: ScheduleConfig) => void;
  onAuditEvent: (action: string, target: string, details: string) => void;
}

export const EncryptedBackupModal: React.FC<EncryptedBackupModalProps> = ({
  isOpen,
  onClose,
  students,
  scheduleConfig,
  currentUserName,
  onRestoreBackup,
  onAuditEvent,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExportEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (passphrase.trim().length < 8) {
      setErrorMessage(
        'La contraseña de cifrado debe tener al menos 8 caracteres para garantizar seguridad AES-GCM 256.'
      );
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUserName,
        scheduleConfig,
        students,
      };

      const encryptedJson = await encryptJsonWithPassphrase(payload, passphrase);
      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup-clinico-${dateStr}.enc.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onAuditEvent(
        'EXPORT_ENCRYPTED_BACKUP',
        'Base de Datos Completa',
        `Backup cifrado AES-GCM-256 exportado (${students.length} legajos)`
      );
      setStatusMessage(
        'Copia de seguridad cifrada (.enc.json) descargada correctamente.'
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al cifrar la copia de seguridad.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportEncrypted = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setStatusMessage(null);

    if (passphrase.trim().length < 8) {
      setErrorMessage(
        'Ingrese primero la contraseña de al menos 8 caracteres con la que fue cifrado el archivo.'
      );
      e.target.value = '';
      return;
    }

    try {
      setIsProcessing(true);
      const rawText = await file.text();
      const decrypted = await decryptJsonWithPassphrase(rawText, passphrase);
      const validated = BackupPayloadSchema.safeParse(decrypted);

      if (!validated.success) {
        throw new Error(
          `El esquema del backup no es válido: ${validated.error.issues[0]?.message}`
        );
      }

      onRestoreBackup(validated.data.students, validated.data.scheduleConfig);
      onAuditEvent(
        'IMPORT_ENCRYPTED_BACKUP',
        'Base de Datos Completa',
        `Restaurados ${validated.data.students.length} legajos validados con Zod`
      );
      setStatusMessage(
        `Backup restaurado exitosamente (${validated.data.students.length} pacientes).`
      );
    } catch {
      setErrorMessage(
        'No se pudo descifrar o validar el archivo. Verifique la contraseña y que sea un archivo .enc.json íntegro.'
      );
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="paper-sheet max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Resguardo Cifrado de Historia Clínica (AES-GCM 256 + PBKDF2)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-[3px]">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          En cumplimiento de la <strong>Disposición DNPDP 11/2006 (Ley 25.326)</strong>, las
          copias de respaldo de historias clínicas nunca se exportan en texto plano. Ingrese
          una contraseña maestra para cifrar o descifrar el archivo <code>.enc.json</code>.
        </p>

        {errorMessage && (
          <div className="p-3 rounded-[3px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 rounded-[3px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleExportEncrypted} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Contraseña de Cifrado / Descifrado (mínimo 8 caracteres)</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Contraseña segura para proteger el archivo..."
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-[3px] outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-[3px] transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Cifrado (.enc.json)</span>
            </button>

            <label className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-[3px] transition cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Importar Archivo (.enc.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportEncrypted}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};
