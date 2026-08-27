import { createClient } from "@supabase/supabase-js";

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export async function setRealtimeAuth() {
  const response = await fetch("/api/realtime/token");

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(
      data.error ||
        "Não foi possível autorizar o Realtime.",
    );
  }

  await supabaseBrowser.realtime.setAuth(data.token);

  return data.token;
}