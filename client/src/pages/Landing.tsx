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

  useEffect(() => {
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      switch (errorParam) {
        case 'domain_not_allowed':
          setError('Alleen @doenersingroen.nl email adressen zijn toegestaan.');
          break;
        case 'microsoft_auth_failed':
          setError('Microsoft authenticatie is mislukt. Probeer opnieuw.');
          break;
        case 'token_exchange_failed':
          setError('Er is een probleem opgetreden bij het inloggen. Probeer opnieuw.');
          break;
        case 'session_failed':
          setError('Sessie kon niet worden aangemaakt. Probeer opnieuw.');
          break;
        case 'authentication_failed':
          setError('Authenticatie is mislukt. Probeer opnieuw.');
          break;
        default:
          setError('Er is een onbekende fout opgetreden.');
      }
      
      // Clear error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
          
          <div className="space-y-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary-hover w-full max-w-sm"
            >
              Inloggen met Replit
            </Button>
            
            <div className="flex items-center justify-center max-w-sm mx-auto">
              <hr className="flex-1 border-gray-300" />
              <span className="px-3 text-gray-500 text-sm">of</span>
              <hr className="flex-1 border-gray-300" />
            </div>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '/api/auth/microsoft'}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full max-w-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              Inloggen met Microsoft
            </Button>
            
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Microsoft login is alleen beschikbaar voor @doenersingroen.nl email adressen
            </p>
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
