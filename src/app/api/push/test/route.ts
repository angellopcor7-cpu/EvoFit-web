import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// Ruta de prueba: manda una notificación de prueba (in-app + push) al
// usuario autenticado, sin depender del cron ni del CRON_SECRET — así se
// puede probar en el momento desde Perfil.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const title = "Notificación de prueba 🔔";
  const body = "Si ves esto, tus notificaciones están funcionando bien.";

  const { error: insertError } = await supabase.from("user_notifications").insert({
    user_id: user.id,
    type: "achievement",
    title,
    body,
    link: "/perfil",
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth_key")
    .eq("user_id", user.id);

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  let pushSent = 0;
  if (publicKey && privateKey && subject && subs && subs.length > 0) {
    webpush.setVapidDetails(subject, publicKey, privateKey);

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify({ title, body, url: "/perfil", tag: "test" }),
        );
        pushSent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, pushSent, hasSubscription: (subs ?? []).length > 0 });
}
