"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/context";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GraduationCap, Mail, Lock, ArrowRight, Sparkles, Building2 } from "lucide-react";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { signup, login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Signup form
  const [signupData, setSignupData] = useState({
    org_name: "",
    email: "",
    password: "",
  });

  // Login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await signup(signupData);
      setSuccess("Compte créé avec succès ! Redirection...");
      setTimeout(() => {
        router.push("/learn");
      }, 1000);
    } catch (err: any) {
      setError(err?.error || "Une erreur est survenue lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await login(loginData);
      router.push("/learn");
    } catch (err: any) {
      setError(err?.error || "Identifiants invalides");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[12%] h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-[8%] top-[25%] h-72 w-72 rounded-full bg-success/15 blur-3xl" />
        <div className="absolute left-1/2 top-[65%] h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative mb-6 inline-flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-3xl bg-accent/30 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-border/60 bg-surface shadow-subtle">
              <GraduationCap className="h-9 w-9 text-accent" strokeWidth={2.4} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-2 text-4xl font-semibold tracking-tight text-foreground"
          >
            {mode === "login" ? "Bienvenue" : "Créer votre LMS"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base text-muted-foreground"
          >
            {mode === "login"
              ? "Connectez-vous pour accéder à vos formations"
              : "Lancez votre plateforme d'apprentissage en quelques secondes"}
          </motion.p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-8"
        >
          {/* Feedback Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Alert variant="success">{success}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === "signup" ? (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignup}
                className="space-y-5"
              >
                {/* Organization Name */}
                <div className="space-y-2">
                  <label htmlFor="org_name" className="text-label">
                    Nom de l'organisation
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="org_name"
                      type="text"
                      value={signupData.org_name}
                      onChange={(e) =>
                        setSignupData({ ...signupData, org_name: e.target.value })
                      }
                      className="input pl-12"
                      placeholder="Mon organisation"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="signup_email" className="text-label">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="signup_email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({ ...signupData, email: e.target.value })
                      }
                      className="input pl-12"
                      placeholder="admin@exemple.com"
                      required
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="signup_password" className="text-label">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="signup_password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({ ...signupData, password: e.target.value })
                      }
                      className="input pl-12"
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/80">
                    Minimum 8 caractères
                  </p>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={isSubmitting} className="group w-full justify-center" size="lg">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                      <span>Création...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Créer mon LMS</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="login_email" className="text-label">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="login_email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      className="input pl-12"
                      placeholder="vous@exemple.com"
                      required
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="login_password" className="text-label">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="login_password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      className="input pl-12"
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={isSubmitting} className="group w-full justify-center" size="lg">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                      <span>Connexion...</span>
                    </div>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-8">
            <div className="divider" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 text-xs uppercase tracking-[0.24em] text-muted-foreground/80">
              ou
            </span>
          </div>

          {/* Toggle Mode */}
          <Button type="button" onClick={toggleMode} variant="subtle" className="w-full justify-center">
            {mode === "login" ? (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Créer une nouvelle organisation</span>
              </>
            ) : (
              <>
                <span>J'ai déjà un compte</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 text-center space-y-4"
        >
          {mode === "signup" && (
            <div className="glass-card p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Note :</span> En créant un compte, vous devenez{" "}
                <span className="font-semibold text-accent">administrateur</span> de votre propre instance LMS multi-tenant.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/80">
            <a href="#" className="transition-colors hover:text-foreground">
              Aide
            </a>
            <span>•</span>
            <a href="#" className="transition-colors hover:text-foreground">
              Confidentialité
            </a>
            <span>•</span>
            <a href="#" className="transition-colors hover:text-foreground">
              Conditions
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
