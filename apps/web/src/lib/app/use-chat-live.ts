'use client';

import { useEffect, useState } from 'react';
import { webBrowserClient } from '../supabase-browser';

/**
 * Live chat updates: prefer Supabase Realtime when configured, else poll.
 * Mock store still owns local demo messages; this hook only bumps a revision
 * so the UI can refresh when remote rows change.
 */
export function useChatLive(threadId: string | undefined): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!threadId) {
      return;
    }

    const client = webBrowserClient();
    if (!client) {
      const poll = window.setInterval(() => {
        setRevision((value) => value + 1);
      }, 8_000);
      return () => window.clearInterval(poll);
    }

    const channel = client
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => setRevision((value) => value + 1),
      )
      .subscribe();

    const poll = window.setInterval(() => {
      setRevision((value) => value + 1);
    }, 15_000);

    return () => {
      window.clearInterval(poll);
      void client.removeChannel(channel);
    };
  }, [threadId]);

  return revision;
}
