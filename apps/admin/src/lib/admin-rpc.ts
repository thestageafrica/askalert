import type { AskAlertSupabase } from '@askalert/db';

type RpcResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

/** Untyped RPC bridge until generated Database types include Prompt 27 functions. */
export async function adminRpc<T = unknown>(
  client: AskAlertSupabase,
  fn: string,
  args?: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const runner = client.rpc as unknown as (
    name: string,
    params?: Record<string, unknown>,
  ) => Promise<RpcResult<T>>;
  return runner(fn, args);
}
