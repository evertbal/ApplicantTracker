import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye, FileText, Route, Building, BriefcaseIcon, User, MapPin, Phone, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  formatTrajectoryTitle, 
  formatTrajectoryStatus, 
  getTrajectoryStatusColor,
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
    // Convert status to CSS class format
    const statusKey = status?.toLowerCase().replace(/\s+/g, '-');
    
    const colors = {
      // Candidate statuses
      'nieuw': "status-badge status-nieuw",
      'beschikbaar': "status-badge status-beschikbaar",
      'in-bemiddeling': "status-badge status-in-bemiddeling",
      'werkend': "status-badge status-werkend",
      'nu-niet-beschikbaar': "status-badge status-nu-niet-beschikbaar",
      'inactief': "status-badge status-inactief",
      
      // Trajectory statuses
      'geaccepteerd': "status-badge status-geaccepteerd",
      'voorgesteld-aan-klant': "status-badge status-voorgesteld-aan-klant",
      'gesprek-met-klant': "status-badge status-gesprek-met-klant",
      'geplaatst': "status-badge status-geplaatst",
      'niet-geplaatst': "status-badge status-niet-geplaatst",
      'gestopt': "status-badge status-gestopt",
      
      // Client statuses
      'actief': "status-badge status-actief",
      'lead': "status-badge status-lead",
      'prospect': "status-badge status-prospect",
      
      // Legacy/fallback statuses
      'active': "status-badge status-active",
      'inactive': "status-badge status-inactive",
      'placed': "status-badge status-placed",
    };
    
    return colors[statusKey as keyof typeof colors] || "status-badge status-beschikbaar";
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
      // Candidate statuses
      nieuw: "Nieuw",
      beschikbaar: "Beschikbaar",
      'in-bemiddeling': "In bemiddeling",
      werkend: "Werkend",
      'nu-niet-beschikbaar': "Nu niet beschikbaar",
      inactief: "Inactief",
      
      // Trajectory statuses
      geaccepteerd: "Geaccepteerd",
      'voorgesteld-aan-klant': "Voorgesteld aan klant",
      'gesprek-met-klant': "Gesprek met klant",
      geplaatst: "Geplaatst",
      'niet-geplaatst': "Niet geplaatst",
      gestopt: "Gestopt",
      
      // Client statuses
      actief: "Actief",
      lead: "Lead",
      prospect: "Prospect",
      
      // Legacy statuses
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
    <Card key={candidate.id} className="hover:shadow-md transition-shadow cursor-pointer w-full" onClick={() => onView(candidate)}>
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
            <Avatar className="w-7 h-7 sm:w-10 sm:h-10 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold text-xs sm:text-sm">
                {candidate.name?.substring(0, 2).toUpperCase() || 'K'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate min-w-0">
                  {candidate.name}
                </h3>
                <span className={`${getStatusColor(candidate.status)} shrink-0`}>
                  {getStatusLabel(candidate.status)}
                </span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                {candidate.description && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Briefcase className="w-3 h-3 text-primary" />
                    <span className="font-medium truncate max-w-20 sm:max-w-none">{candidate.description}</span>
                  </div>
                )}
                {candidate.email && (
                  <span className="truncate max-w-16 sm:max-w-32">{candidate.email}</span>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-1 hidden sm:flex shrink-0">
                    <Phone className="w-3 h-3" />
                    <span className="truncate">{candidate.phone}</span>
                  </div>
                )}
                {candidate.city && (
                  <div className="flex items-center gap-1 hidden md:flex shrink-0">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{candidate.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto px-1 sm:px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onView(candidate); }}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Bekijk</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto px-1 sm:px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onEdit(candidate); }}
            >
              <Edit className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Bewerk</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderClientItem = (client: any) => (
    <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer w-full" onClick={() => onView(client)}>
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
            <Avatar className="w-7 h-7 sm:w-10 sm:h-10 shrink-0">
              <AvatarFallback className="bg-blue-500 text-white">
                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate min-w-0">
                  {client.name}
                </h3>
                {client.status && (
                  <span className={`${getStatusColor(client.status)} shrink-0`}>
                    {getStatusLabel(client.status)}
                  </span>
                )}
                {client.workType && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {client.workType}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                <span className="truncate max-w-24 sm:max-w-none">{client.contactPerson}</span>
                <span className="hidden sm:inline truncate">{client.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto px-1 sm:px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onView(client); }}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Bekijk</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto px-1 sm:px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onEdit(client); }}
            >
              <Edit className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Bewerk</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTrajectoryItem = (trajectory: any) => (
    <Card key={trajectory.id} className="hover:shadow-md transition-shadow cursor-pointer w-full" onClick={() => onView(trajectory)}>
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
            <Avatar className="w-7 h-7 sm:w-10 sm:h-10 shrink-0">
              <AvatarFallback className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <BriefcaseIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate min-w-0">
                  {formatTrajectoryTitle(trajectory)}
                </h3>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium border ${getTrajectoryStatusColor(trajectory.status)} shrink-0`}>
                  {formatTrajectoryStatus(trajectory.status)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto px-1 sm:px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onView(trajectory); }}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Bekijk</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto px-1 sm:px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onEdit(trajectory); }}
            >
              <Edit className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Bewerk</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-2 w-full overflow-hidden">
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
        <Card className="w-full">
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