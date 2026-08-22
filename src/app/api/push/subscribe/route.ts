import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const input = schema.parse(json);

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth_key: input.keys.auth,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo activar el push";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
