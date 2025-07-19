import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Briefcase, UserCheck } from 'lucide-react';
import ResponsiveLayout from '@/components/responsive-layout';

interface KPIData {
  candidatesAdded: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
  trajectoriesCreated: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
  candidatesProposed: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
}

const Reports = () => {
  const { data: kpiData, isLoading } = useQuery<KPIData>({
    queryKey: ['/api/reports/quarterly-kpi'],
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(num);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const KPICard = ({ 
    title, 
    icon, 
    current, 
    previous, 
    change, 
    changePercentage 
  }: {
    title: string;
    icon: React.ReactNode;
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  }) => (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Main KPI number - large and prominent */}
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatNumber(current)}
          </div>
          
          {/* Trend comparison */}
          <div className="flex items-center gap-2">
            {getTrendIcon(change)}
            <span className={`text-sm font-medium ${getTrendColor(change)}`}>
              {change > 0 ? '+' : ''}{change} ({changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%)
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              vs Q-2
            </span>
          </div>
          
          {/* Previous quarter reference */}
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Q-2: {formatNumber(previous)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <ResponsiveLayout activeSection="reports" onSectionChange={() => {}}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapportages</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Kwartaal overzicht en KPI metrics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (!kpiData) {
    return (
      <ResponsiveLayout activeSection="reports" onSectionChange={() => {}}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapportages</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Kwartaal overzicht en KPI metrics
            </p>
          </div>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Geen rapportage data beschikbaar
              </p>
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout activeSection="reports" onSectionChange={() => {}}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapportages</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Kwartaal overzicht en KPI metrics (laatste kwartaal vs vorige kwartaal)
          </p>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard
            title="Toegevoegde kandidaten (laatste kwartaal)"
            icon={<Users className="w-4 h-4" />}
            current={kpiData.candidatesAdded.current}
            previous={kpiData.candidatesAdded.previous}
            change={kpiData.candidatesAdded.change}
            changePercentage={kpiData.candidatesAdded.changePercentage}
          />
          
          <KPICard
            title="Nieuw aangemaakte trajecten (laatste kwartaal)"
            icon={<Briefcase className="w-4 h-4" />}
            current={kpiData.trajectoriesCreated.current}
            previous={kpiData.trajectoriesCreated.previous}
            change={kpiData.trajectoriesCreated.change}
            changePercentage={kpiData.trajectoriesCreated.changePercentage}
          />
          
          <KPICard
            title="Kandidaten voorgesteld in traject (laatste kwartaal)"
            icon={<UserCheck className="w-4 h-4" />}
            current={kpiData.candidatesProposed.current}
            previous={kpiData.candidatesProposed.previous}
            change={kpiData.candidatesProposed.change}
            changePercentage={kpiData.candidatesProposed.changePercentage}
          />
        </div>

        {/* Additional insights section - can be expanded later */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">
              Kwartaal Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                <strong>Laatste kwartaal prestaties:</strong> {formatNumber(kpiData.candidatesAdded.current)} nieuwe kandidaten toegevoegd, 
                {formatNumber(kpiData.trajectoriesCreated.current)} trajecten aangemaakt, en 
                {formatNumber(kpiData.candidatesProposed.current)} kandidaten voorgesteld.
              </p>
              <p>
                <strong>Trend:</strong> Vergeleken met het vorige kwartaal zien we een 
                {kpiData.candidatesAdded.change >= 0 ? ' positieve' : ' negatieve'} ontwikkeling 
                in kandidaat toevoegingen ({kpiData.candidatesAdded.changePercentage > 0 ? '+' : ''}{kpiData.candidatesAdded.changePercentage.toFixed(1)}%).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default Reports;