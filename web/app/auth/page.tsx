"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/context";
import { Alert } from "@/components/ui/alert";
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center mb-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-3xl blur-2xl opacity-50" />
            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl font-bold text-[var(--text-primary)] mb-2"
          >
            {mode === "login" ? "Bienvenue" : "Créer votre LMS"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[var(--text-secondary)]"
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
          className="neo-surface neo-surface-hover p-8"
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
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
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
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
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
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
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
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Minimum 8 caractères
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full btn-lg group"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Création...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Créer mon LMS</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
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
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
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
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full btn-lg group"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connexion...</span>
                    </div>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-8">
            <div className="divider" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[var(--bg-glass)] text-xs text-[var(--text-tertiary)] uppercase tracking-wide backdrop-blur-xl">
              ou
            </span>
          </div>

          {/* Toggle Mode */}
          <button type="button" onClick={toggleMode} className="btn btn-secondary w-full">
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
          </button>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 text-center space-y-4"
        >
          {mode === "signup" && (
            <div className="neo-surface neo-surface-hover p-4">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-semibold text-[var(--text-primary)]">Note :</span> En créant un compte, vous devenez{" "}
                <span className="text-gradient font-semibold">administrateur</span> de
                votre propre instance LMS multi-tenant.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-xs text-[var(--text-tertiary)]">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Aide
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Confidentialité
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Conditions
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
