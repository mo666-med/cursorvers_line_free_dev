// Helper for obtaining a KV client in environments that support Deno KV.

export type KvClient = Deno.Kv;

export async function getKv(): Promise<KvClient | null> {
  if (typeof Deno?.openKv !== "function") {
    return null;
  }

  try {
    return await Deno.openKv();
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "Failed to open Deno KV",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return null;
  }
}
