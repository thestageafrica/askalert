import type { AskAlertSupabase } from './client';

export type DbSizeSnapshot = {
  id: string;
  sizeBytes: number;
  sizeMb: number;
  warning: boolean;
  note: string;
  createdAt: string;
};

export async function getLatestDbSizeSnapshot(
  client: AskAlertSupabase,
): Promise<DbSizeSnapshot | null> {
  const { data, error } = await client
    .from('db_size_snapshots')
    .select('id, size_bytes, size_mb, warning, note, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load db size snapshot: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    sizeBytes: data.size_bytes,
    sizeMb: Number(data.size_mb),
    warning: data.warning,
    note: data.note,
    createdAt: data.created_at,
  };
}
