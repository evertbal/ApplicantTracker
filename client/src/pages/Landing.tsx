import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building, Route } from "lucide-react";

export default function Landing() {
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
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary-hover"
          >
            Inloggen
          </Button>
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
