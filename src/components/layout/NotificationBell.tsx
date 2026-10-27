import React, { useEffect, useRef, useState } from 'react';
import { Bell, Cake, CalendarClock, CircleAlert, type LucideIcon } from 'lucide-react';

export type NotificationKind = 'faltas' | 'nacimiento' | 'hoy';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  studentId?: string;
}

interface NotificationBellProps {
  notifications: AppNotification[];
  onSelect: (notification: AppNotification) => void;
}

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  faltas: CircleAlert,
  nacimiento: Cake,
  hoy: CalendarClock,
};

const KIND_COLOR: Record<NotificationKind, string> = {
  faltas: 'text-rose-600',
  nacimiento: 'text-amber-700',
  hoy: 'text-teal-700',
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const alertCount = notifications.filter((n) => n.kind !== 'hoy').length;

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Avisos (${notifications.length})`}
        aria-expanded={isOpen}
        className="relative p-2 rounded-md text-[#e9dfcb] hover:text-white hover:bg-white/5 transition cursor-pointer"
      >
        <Bell className="w-5 h-5" strokeWidth={1.6} />
        {alertCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] leading-4 font-bold text-white text-center">
            {alertCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] z-50 paper-shadow">
          <div className="paper-sheet torn-bottom pb-5 text-slate-800">
            <div className="px-4 pt-3 pb-2 border-b border-slate-200">
              <h3 className="text-lg leading-tight">Avisos</h3>
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                Todo en orden. No hay avisos pendientes.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-slate-200/70">
                {notifications.map((n) => {
                  const Icon = KIND_ICON[n.kind];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(n);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 flex gap-3 hover:bg-slate-100/70 transition cursor-pointer"
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${KIND_COLOR[n.kind]}`} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900">
                            {n.title}
                          </span>
                          <span className="block text-xs text-slate-600">{n.detail}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
