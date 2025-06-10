import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Route, Building, CheckCircle } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: "Kandidaatbeheer",
      description: "Beheer en volg alle kandidaten in één centraal systeem"
    },
    {
      icon: Route,
      title: "Trajectbeheer",
      description: "Overzicht van alle plaatsingen en hun status"
    },
    {
      icon: Building,
      title: "Opdrachtgeverbeheer",
      description: "Onderhoud relaties met al uw opdrachtgevers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ATS Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Professioneel Applicant Tracking System voor moderne recruitmentbureaus. 
            Beheer kandidaten, trajecten en opdrachtgevers in één geïntegreerd platform.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Inloggen om te beginnen
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>



        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p>Veilig inloggen met uw Replit account</p>
        </div>
      </div>
    </div>
  );
}
