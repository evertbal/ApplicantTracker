import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface NormalizedResult {
  licenses: string[];
  heeft_geen_geldig_rijbewijs: boolean;
  original_input: string;
  notes?: string;
}

export default function LicenseNormalizerTest() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<NormalizedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [batchResults, setBatchResults] = useState<NormalizedResult[]>([]);

  const testCases = [
    "B, BE, wil ook C",
    "heeft B",
    "geen",
    "afgepakt",
    "moet nog",
    "B en auto",
    "A,B,C,D,E",
    "motorfiets en auto",
    "vrachtwagen",
    "bus met aanhanger",
    "landbouw",
    "rijbewijs B.",
    "categorie A",
    "bezig met afrijden B",
    "nog niet behaald"
  ];

  const normalizeInput = async (inputValue: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/normalize-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: inputValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        console.error('Error normalizing license');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runBatchTest = async () => {
    setIsLoading(true);
    try {
      const inputs = batchInput.split('\n').filter(line => line.trim());
      const response = await fetch('/api/normalize-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: inputs }),
      });

      if (response.ok) {
        const data = await response.json();
        setBatchResults(data);
      } else {
        console.error('Error normalizing licenses');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTestCase = (testCase: string) => {
    setInput(testCase);
    normalizeInput(testCase);
  };

  const getLicenseDescription = (license: string) => {
    const descriptions: Record<string, string> = {
      'A': 'Motorfiets',
      'AM': 'Bromfiets/Snorfiets',
      'B': 'Personenauto',
      'BE': 'Auto met aanhanger',
      'C': 'Vrachtwagen',
      'CE': 'Vrachtwagen met aanhanger',
      'D': 'Autobus',
      'DE': 'Autobus met aanhanger',
      'T': 'Landbouwvoertuigen'
    };
    return descriptions[license] || license;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Rijbewijs Normalisatie Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test de automatische normalisatie van Nederlandse rijbewijsgegevens
        </p>
      </div>

      {/* Enkele invoer test */}
      <Card>
        <CardHeader>
          <CardTitle>Enkele Invoer Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Voer rijbewijs informatie in..."
              className="flex-1"
            />
            <Button
              onClick={() => normalizeInput(input)}
              disabled={isLoading || !input.trim()}
            >
              Normaliseer
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {result.heeft_geen_geldig_rijbewijs ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : result.licenses.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium">Resultaat:</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Originele invoer:</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"{result.original_input}"</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Genormaliseerde rijbewijzen:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.licenses.length > 0 ? (
                        result.licenses.map((license) => (
                          <Badge key={license} variant="secondary" title={getLicenseDescription(license)}>
                            {license}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Geen geldig rijbewijs</span>
                      )}
                    </div>
                  </div>
                </div>

                {result.notes && (
                  <div>
                    <span className="text-sm font-medium">Notities:</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{result.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test cases */}
      <Card>
        <CardHeader>
          <CardTitle>Vooraf gedefinieerde test cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {testCases.map((testCase, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => runTestCase(testCase)}
                className="text-left justify-start"
              >
                "{testCase}"
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Batch test */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            placeholder="Voer meerdere rijbewijs vermeldingen in, elk op een nieuwe regel..."
            rows={5}
          />
          <Button
            onClick={runBatchTest}
            disabled={isLoading || !batchInput.trim()}
          >
            Batch Normaliseren
          </Button>

          {batchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Batch Resultaten:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {batchResults.map((result, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">"{result.original_input}"</span>
                      <div className="flex items-center gap-1">
                        {result.heeft_geen_geldig_rijbewijs ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.licenses.length > 0 ? (
                        result.licenses.map((license) => (
                          <Badge key={license} variant="secondary" className="text-xs">
                            {license}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">Geen geldig rijbewijs</span>
                      )}
                    </div>
                    {result.notes && (
                      <p className="text-xs text-gray-500 mt-1">{result.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}