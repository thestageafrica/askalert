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
  // Must call through the client so `this` stays bound (rpc uses this.rest).
  const result = await (
    client as unknown as {
      rpc: (
        name: string,
        params?: Record<string, unknown>,
      ) => Promise<RpcResult<T>>;
    }
  ).rpc(fn, args);
  return result;
}
