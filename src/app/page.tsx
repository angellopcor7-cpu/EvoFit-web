"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { Mail, Lock, User, Eye, EyeOff, Flame } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useForm,
} from "@/components/ui/Form";
import { useAuthSession } from "@/hooks/useProfile";
import { useLogin, useSignup } from "@/hooks/useAuthActions";
import styles from "./page.module.css";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const signupSchema = z
  .object({
    name: z.string().min(2, "Ingresa tu nombre"),
    email: z.string().email("Ingresa un correo válido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const sessionQuery = useAuthSession();
  const loginMutation = useLogin();
  const signupMutation = useSignup();

  const loginForm = useForm({
    defaultValues: { email: "", password: "" },
    schema: loginSchema,
  });

  const signupForm = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    schema: signupSchema,
  });

  useEffect(() => {
    if (sessionQuery.data?.profile) {
      router.replace("/home");
    }
  }, [sessionQuery.data, router]);

  const handleLogin = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Bienvenido de vuelta");
        router.replace("/home");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "No se pudo iniciar sesión",
        );
      },
    });
  };

  const handleSignup = (values: z.infer<typeof signupSchema>) => {
    signupMutation.mutate(
      {
        displayName: values.name,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: (result) => {
          if (result.status === "confirmed") {
            toast.success("Cuenta creada. ¡Vamos a entrenar!");
            router.replace("/home");
          } else {
            toast.success(
              "Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.",
            );
            setActiveTab("login");
          }
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "No se pudo crear la cuenta",
          );
        },
      },
    );
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
        <p className={styles.tagline}>Entrena. Progresa. No falles.</p>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "login" | "signup")}
          className={styles.tabs}
        >
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="signup" className={styles.tabsTrigger}>
              Crear cuenta
            </TabsTrigger>
            <TabsTrigger value="login" className={styles.tabsTrigger}>
              Iniciar sesión
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className={styles.tabsContent}>
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className={styles.form}
              >
                <FormItem name="email">
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <div className={styles.inputWrap}>
                      <Mail size={16} className={styles.inputIcon} />
                      <Input
                        type="email"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        value={loginForm.values.email}
                        onChange={(e) =>
                          loginForm.setValues((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        onBlur={() => loginForm.validateField("email")}
                        className={styles.inputWithIcon}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem name="password">
                  <div className={styles.labelRow}>
                    <FormLabel>Contraseña</FormLabel>
                    <button type="button" className={styles.linkButton}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <FormControl>
                    <div className={styles.inputWrap}>
                      <Lock size={16} className={styles.inputIcon} />
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        value={loginForm.values.password}
                        onChange={(e) =>
                          loginForm.setValues((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        onBlur={() => loginForm.validateField("password")}
                        className={styles.inputWithIcon}
                      />
                      <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowLoginPassword((s) => !s)}
                        aria-label={
                          showLoginPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showLoginPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <Button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="signup" className={styles.tabsContent}>
            <Form {...signupForm}>
              <form
                onSubmit={signupForm.handleSubmit(handleSignup)}
                className={styles.form}
              >
                <FormItem name="name">
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <div className={styles.inputWrap}>
                      <User size={16} className={styles.inputIcon} />
                      <Input
                        placeholder="Tu nombre"
                        autoComplete="name"
                        value={signupForm.values.name}
                        onChange={(e) =>
                          signupForm.setValues((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        onBlur={() => signupForm.validateField("name")}
                        className={styles.inputWithIcon}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem name="email">
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <div className={styles.inputWrap}>
                      <Mail size={16} className={styles.inputIcon} />
                      <Input
                        type="email"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        value={signupForm.values.email}
                        onChange={(e) =>
                          signupForm.setValues((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        onBlur={() => signupForm.validateField("email")}
                        className={styles.inputWithIcon}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem name="password">
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className={styles.inputWrap}>
                      <Lock size={16} className={styles.inputIcon} />
                      <Input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={signupForm.values.password}
                        onChange={(e) =>
                          signupForm.setValues((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        onBlur={() => signupForm.validateField("password")}
                        className={styles.inputWithIcon}
                      />
                      <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowSignupPassword((s) => !s)}
                        aria-label={
                          showSignupPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showSignupPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem name="confirmPassword">
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <div className={styles.inputWrap}>
                      <Lock size={16} className={styles.inputIcon} />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={signupForm.values.confirmPassword}
                        onChange={(e) =>
                          signupForm.setValues((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        onBlur={() =>
                          signupForm.validateField("confirmPassword")
                        }
                        className={styles.inputWithIcon}
                      />
                      <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        aria-label={
                          showConfirmPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <Button
                  type="submit"
                  className={styles.submitButton}
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending
                    ? "Creando cuenta..."
                    : "Crear cuenta"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <p className={styles.footerText}>
          Al continuar aceptas nuestros Términos y Política de Privacidad.
        </p>
      </div>

      <div className={styles.streakHint}>
        <Flame size={14} />
        <span>Miles de personas ya están construyendo su racha con EvoFit</span>
      </div>
    </div>
  );
}
