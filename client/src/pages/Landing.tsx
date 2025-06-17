import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
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
        body: JSON.stringify({ username: loginData.email, password: loginData.password }),
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
      setLoginData({ email: registerData.email, password: '' });
    } catch (err: any) {
      setError(err.message || 'Registratie mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-black" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ATS PORTAL</h1>
          <p className="text-gray-600 text-sm mb-6">
            Professionele AI-gestuurde offerte generator
          </p>
          <p className="text-gray-500 text-xs">
            Alleen geautoriseerde NoSuch medewerkers
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
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
              INLOGGEN
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              REGISTREREN
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  EMAIL
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="jouw.email@nosuch.nl"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  WACHTWOORD
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Jouw wachtwoord"
                  className="mt-1"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-6" 
                disabled={isLoading}
              >
                {isLoading ? 'BEZIG MET INLOGGEN...' : 'INLOGGEN →'}
              </Button>
              
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Of</span>
                </div>
              </div>
              
              <Button 
                type="button"
                onClick={() => window.location.href = '/api/replit-login'}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 mt-6" 
                disabled={isLoading}
              >
                INLOGGEN MET REPLIT →
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Door in te loggen ga je akkoord met de gebruikersvoorwaarden
              </p>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-username" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  GEBRUIKERSNAAM
                </Label>
                <Input
                  id="register-username"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  placeholder="jouwgebruikersnaam"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-email" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  EMAIL
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="naam@doenersingroen.nl"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password" className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  WACHTWOORD
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Minimaal 8 karakters"
                  className="mt-1"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-6" 
                disabled={isLoading}
              >
                {isLoading ? 'ACCOUNT AANMAKEN...' : 'REGISTREREN →'}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-4">
                Nieuwe accounts moeten worden goedgekeurd door een admin
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
