import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function useRealtimeCenterData(onRemoteChange?: () => void) {
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setIsRealtimeConnected(false);
      return;
    }

    const channel = client
      .channel('center-agenda-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          onRemoteChange?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinical_entries' },
        () => {
          onRemoteChange?.();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [onRemoteChange]);

  return { isRealtimeConnected };
}
