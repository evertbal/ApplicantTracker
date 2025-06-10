import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Building, Route } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Form states
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '',
    email: '', 
    password: ''
  });

  useEffect(() => {
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      switch (errorParam) {
        case 'domain_not_allowed':
          setError('Alleen @doenersingroen.nl email adressen zijn toegestaan.');
          break;
        default:
          setError('Er is een onbekende fout opgetreden.');
      }
      
      // Clear error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Inloggen mislukt');
      }
      
      // Redirect to dashboard on success
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Inloggen mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registratie mislukt');
      }
      
      const responseData = await response.json();
      
      toast({
        title: "Account aangemaakt",
        description: responseData.requiresApproval 
          ? "Wacht op goedkeuring van een admin." 
          : "Je kunt nu inloggen met je gegevens.",
      });
      
      setActiveTab('login');
      setLoginData({ username: registerData.username, password: '' });
    } catch (err: any) {
      setError(err.message || 'Registratie mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ATS Portal</h1>
          <p className="text-xl text-gray-600 mb-8">
            Professioneel Applicant Tracking System voor moderne recruitment
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          <div className="w-full max-w-md mx-auto">
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inloggen
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'register'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Registreren
              </button>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Gebruikersnaam of email</Label>
                  <Input
                    id="login-username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    placeholder="gebruikersnaam of email@doenersingroen.nl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Wachtwoord</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
                </Button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="register-username">Gebruikersnaam</Label>
                  <Input
                    id="register-username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    placeholder="jouwgebruikersnaam"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">Email adres</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="naam@doenersingroen.nl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Wachtwoord</Label>
                  <Input
                    id="register-password"
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
                  {isLoading ? 'Account aanmaken...' : 'Account aanmaken'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Nieuwe accounts moeten worden goedgekeurd door een admin
                </p>
              </form>
            )}


          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Kandidatenbeheer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Beheer alle kandidaten met uitgebreide profielen, notities en documenten
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Route className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Trajecten</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Volg alle plaatsingen van intake tot succesvolle plaatsing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Building className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Opdrachtgevers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Onderhoud sterke relaties met alle partners en opdrachtgevers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
