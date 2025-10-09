"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuthPage() {
  const router = useRouter();
  const { signup, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Signup form
  const [signupData, setSignupData] = useState({
    org_name: '',
    email: '',
    password: '',
  });

  // Login form
  const [loginData, setLoginData] = useState({
    organization_id: '',
    email: '',
    password: '',
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signup(signupData);
      router.push('/learn');
    } catch (err: any) {
      setError(err.error || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(loginData);
      router.push('/learn');
    } catch (err: any) {
      setError(err.error || 'Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">
              LMS Go
            </CardTitle>
            <CardDescription className="text-center">
              Plateforme de formation moderne
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Inscription</TabsTrigger>
                <TabsTrigger value="login">Connexion</TabsTrigger>
              </TabsList>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="org_name" className="text-sm font-medium">
                      Nom de l'organisation
                    </label>
                    <Input
                      id="org_name"
                      placeholder="Mon organisation"
                      value={signupData.org_name}
                      onChange={(e) =>
                        setSignupData({ ...signupData, org_name: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signup_email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="signup_email"
                      type="email"
                      placeholder="admin@exemple.com"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({ ...signupData, email: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signup_password" className="text-sm font-medium">
                      Mot de passe
                    </label>
                    <Input
                      id="signup_password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({ ...signupData, password: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Création...' : 'Créer mon compte'}
                  </Button>
                </form>
              </TabsContent>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="org_id" className="text-sm font-medium">
                      ID Organisation
                    </label>
                    <Input
                      id="org_id"
                      placeholder="550e8400-e29b-41d4-a716-446655440000"
                      value={loginData.organization_id}
                      onChange={(e) =>
                        setLoginData({ ...loginData, organization_id: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="login_email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="login_email"
                      type="email"
                      placeholder="utilisateur@exemple.com"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="login_password" className="text-sm font-medium">
                      Mot de passe
                    </label>
                    <Input
                      id="login_password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          En vous inscrivant, vous créez votre propre instance LMS
        </p>
      </motion.div>
    </div>
  );
}
