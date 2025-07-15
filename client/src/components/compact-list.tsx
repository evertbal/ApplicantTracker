import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Eye, FileText, Route, Building, BriefcaseIcon, User, MapPin, Phone, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  formatTrajectoryTitle, 
  formatTrajectoryDate, 
  formatTrajectoryStatus, 
  getTrajectoryStatusColor,
  formatHourlyRate,
  validateTrajectoryData 
} from "@/lib/trajectory-formatters";
import type { CandidateWithRelations, ClientWithRelations, TrajectoryWithRelations } from "@shared/schema";

interface CompactListProps {
  items: (CandidateWithRelations | ClientWithRelations | TrajectoryWithRelations)[];
  type: 'candidates' | 'clients' | 'trajectories';
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  isLoading?: boolean;
}

export default function CompactList({ items, type, onView, onEdit, isLoading }: CompactListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="card-enhanced animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/5"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: "status-badge status-active",
      inactive: "status-badge status-inactive", 
      pending: "status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      completed: "status-badge status-placed",
      interview: "status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      proposed: "status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      placed: "status-badge status-placed",
      intake: "status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      matching: "status-badge bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    };
    return colors[status as keyof typeof colors] || "status-badge status-active";
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      candidates: User,
      clients: Building,
      trajectories: Briefcase,
    };
    return icons[type as keyof typeof icons] || User;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      interview: "In Gesprek",
      proposed: "Voorgesteld", 
      placed: "Geplaatst",
      active: "Actief",
      inactive: "Inactief",
      pending: "In Behandeling",
      completed: "Voltooid"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const renderCandidateItem = (candidate: any) => (
    <Card key={candidate.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(candidate)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
                {candidate.name?.substring(0, 2).toUpperCase() || 'K'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {candidate.name}
                </h3>
                <span className={getStatusColor(candidate.status)}>
                  {getStatusLabel(candidate.status)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {candidate.description && (
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-3 h-3 text-primary" />
                    <span className="font-medium">{candidate.description}</span>
                  </div>
                )}
                {candidate.email && (
                  <span className="truncate max-w-48">{candidate.email}</span>
                )}
                {candidate.phone && (
                  <div className="flex items-center space-x-1 hidden sm:flex">
                    <Phone className="w-3 h-3" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.city && (
                  <div className="flex items-center space-x-1 hidden md:flex">
                    <MapPin className="w-3 h-3" />
                    <span>{candidate.city}</span>
                  </div>
                )}
                {candidate.region && (
                  <span className="hidden lg:inline">{candidate.region}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onView(candidate); }}
                  className="cursor-pointer"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Bekijk details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onEdit(candidate); }}
                  className="cursor-pointer"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Bewerk
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderClientItem = (client: any) => (
    <Card key={client.id} className="list-item-enhanced cursor-pointer group" onClick={() => onView(client)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarFallback className="bg-blue-500 text-white">
                <Building className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {client.name}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {client.workType}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span className="truncate">{client.contactPerson}</span>
                <span className="hidden sm:inline">{client.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <div className="hidden sm:flex items-center space-x-2">
              {client.trajectories?.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Route className="w-3 h-3 mr-1" />
                  {client.trajectories.length}
                </Badge>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(client); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  Bekijk details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Bewerk
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTrajectoryItem = (trajectory: any) => (
    <Card key={trajectory.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(trajectory)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarFallback className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <BriefcaseIcon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {/* Main trajectory info in one line */}
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {formatTrajectoryTitle(trajectory)}
                </h3>
              </div>
              
              {/* Status and date in subtle style */}
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <Badge variant="outline" className={`text-xs ${getTrajectoryStatusColor(trajectory.status)}`}>
                  {formatTrajectoryStatus(trajectory.status)}
                </Badge>
                <span>
                  Start: {formatTrajectoryDate(trajectory.startDate)}
                </span>
                {trajectory.hourlyRate && (
                  <span className="hidden sm:inline">
                    {formatHourlyRate(trajectory.hourlyRate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(trajectory); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  Bekijk details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(trajectory); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Bewerk
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-2">
      {items.map((item) => {
        switch (type) {
          case 'candidates':
            return renderCandidateItem(item);
          case 'clients':
            return renderClientItem(item);
          case 'trajectories':
            return renderTrajectoryItem(item);
          default:
            return null;
        }
      })}
      
      {items.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Geen {type === 'candidates' ? 'kandidaten' : type === 'clients' ? 'opdrachtgevers' : 'trajecten'} gevonden
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}