import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Eye, FileText, Route, Building, BriefcaseIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
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
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
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
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      interview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      proposed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      placed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[status as keyof typeof colors] || colors.active;
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
              <AvatarFallback className="bg-primary text-white">
                {candidate.name?.substring(0, 2).toUpperCase() || 'K'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {candidate.name}
                </h3>
                <Badge className={`text-xs ${getStatusColor(candidate.status)}`}>
                  {candidate.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span className="truncate">{candidate.email}</span>
                <span className="hidden sm:inline">{candidate.city}</span>
                {candidate.region && (
                  <span className="hidden md:inline">{candidate.region}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <div className="hidden sm:flex items-center space-x-2">
              {candidate.trajectories?.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Route className="w-3 h-3 mr-1" />
                  {candidate.trajectories.length}
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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(candidate); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  Bekijk details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(candidate); }}>
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
    <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(client)}>
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
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mt-1">
              <AvatarFallback className="bg-purple-500 text-white">
                <Route className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              {/* Position and Status */}
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {trajectory.position}
                </h3>
                <Badge className={`text-xs ${getStatusColor(trajectory.status)}`}>
                  {getStatusLabel(trajectory.status)}
                </Badge>
              </div>
              
              {/* Candidate Information - Prominently Displayed */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {trajectory.candidate?.name?.substring(0, 2).toUpperCase() || 'K'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                      <span className="text-xs text-blue-600 dark:text-blue-300">Kandidaat:</span> {trajectory.candidate?.name || 'Onbekend'}
                    </p>
                    {trajectory.candidate?.email && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                        {trajectory.candidate.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Client Information - Prominently Displayed */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-green-500 text-white text-xs">
                      <Building className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                      <span className="text-xs text-green-600 dark:text-green-300">Opdrachtgever:</span> {trajectory.client?.name || 'Onbekend'}
                    </p>
                    {trajectory.client?.contactPerson && (
                      <p className="text-xs text-green-700 dark:text-green-300 truncate">
                        Contact: {trajectory.client.contactPerson}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                {trajectory.startDate && (
                  <span className="flex items-center space-x-1">
                    <span>Start:</span>
                    <span>{format(new Date(trajectory.startDate), 'dd MMM yyyy', { locale: nl })}</span>
                  </span>
                )}
                {trajectory.salary && (
                  <span className="hidden sm:inline">
                    €{trajectory.salary.toLocaleString()}
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