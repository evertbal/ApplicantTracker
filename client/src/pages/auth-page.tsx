import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Lock, UserPlus } from "lucide-react";
import { useCombinedAuth } from "@/hooks/useCombinedAuth";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isAuthenticated } = useCombinedAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation('/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setSuccess('Login succesvol! Doorverwijzen...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!registerData.email.endsWith('@doenersingroen.nl')) {
      setError('Alleen @doenersingroen.nl email adressen zijn toegestaan');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registratie mislukt');
      }

      setSuccess('Account aangemaakt! Wacht op admin goedkeuring om in te loggen.');
      setRegisterData({ username: '', email: '', password: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ATS Portal</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {isLogin ? 'Inloggen op uw account' : 'Nieuw account aanmaken'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLogin ? <Mail className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Inloggen' : 'Registreren'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Voer uw inloggegevens in' 
                : 'Maak een nieuw account aan (alleen @doenersingroen.nl)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gebruikersnaam of Email
                  </label>
                  <Input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    placeholder="gebruikersnaam of email@doenersingroen.nl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wachtwoord
                  </label>
                  <Input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Uw wachtwoord"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'INLOGGEN...' : 'INLOGGEN'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gebruikersnaam
                  </label>
                  <Input
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    placeholder="Kies een gebruikersnaam"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="naam@doenersingroen.nl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wachtwoord
                  </label>
                  <Input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Minimaal 8 karakters"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'ACCOUNT AANMAKEN...' : 'REGISTREREN'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Nieuwe accounts moeten worden goedgekeurd door een admin
                </p>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-primary hover:underline text-sm"
              >
                {isLogin ? 'Nog geen account? Registreren' : 'Al een account? Inloggen'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <hr className="flex-1 border-gray-300" />
                <span className="px-3 text-gray-500 text-sm">of</span>
                <hr className="flex-1 border-gray-300" />
              </div>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/api/login'}
                className="w-full"
              >
                Inloggen met Replit
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button 
                variant="ghost"
                onClick={() => setLocation('/')}
                className="text-sm"
              >
                ← Terug naar home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}