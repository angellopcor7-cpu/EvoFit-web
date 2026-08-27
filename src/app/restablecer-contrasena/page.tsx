"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUpdatePassword } from "@/hooks/useAuthActions";
import { createClient } from "@/lib/supabase/client";
import styles from "../page.module.css";

export default function RestablecerContrasenaPage() {
  const router = useRouter();
  const updatePassword = useUpdatePassword();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // El link del correo trae el token de recuperación en la URL; el
  // cliente de Supabase lo procesa solo al cargar y crea una sesión
  // temporal. Esperamos a que esté lista antes de mostrar el formulario.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    updatePassword.mutate(password, {
      onSuccess: () => {
        toast.success("Contraseña actualizada. Ya puedes entrar con ella.");
        router.replace("/home");
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "No se pudo actualizar",
        ),
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.glowRed} aria-hidden="true" />
      <div className={styles.glowViolet} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="EvoFit" className={styles.logoImg} />
        </div>
        <p className={styles.tagline}>Crea tu nueva contraseña</p>

        {!ready ? (
          <p className={styles.footerText}>
            Verificando tu link de recuperación...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputWithIcon}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirma tu nueva contraseña"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.inputWithIcon}
              />
            </div>

            <Button
              type="submit"
              className={styles.submitButton}
              disabled={updatePassword.isPending}
            >
              {updatePassword.isPending ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
