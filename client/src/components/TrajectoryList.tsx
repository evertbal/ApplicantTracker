import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { TrajectoryWithRelations } from "@shared/schema";
import DetailModal from "./DetailModal";
import NewTrajectoryModal from "./NewTrajectoryModal";

export default function TrajectoryList() {
  const [search, setSearch] = useState("");
  const [selectedTrajectory, setSelectedTrajectory] = useState<TrajectoryWithRelations | null>(null);
  const [isNewTrajectoryModalOpen, setIsNewTrajectoryModalOpen] = useState(false);

  const { data: trajectories = [], isLoading } = useQuery({
    queryKey: ["/api/trajectories", { search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/trajectories?${params}`);
      if (!response.ok) throw new Error("Failed to fetch trajectories");
      return response.json() as Promise<TrajectoryWithRelations[]>;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "interview":
        return "bg-blue-100 text-blue-800";
      case "proposed":
        return "bg-yellow-100 text-yellow-800";
      case "placed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "interview":
        return "In Gesprek";
      case "proposed":
        return "Voorgesteld";
      case "placed":
        return "Geplaatst";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Trajecten</h2>
            <p className="text-sm text-gray-600 mt-1">
              Overzicht van alle actieve en voltooide trajecten
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Zoeken..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <Button
              onClick={() => setIsNewTrajectoryModalOpen(true)}
              className="bg-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Traject
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            {trajectories.length} trajecten gevonden
          </span>
        </div>

        <div className="space-y-4">
          {trajectories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Geen trajecten gevonden</p>
              </CardContent>
            </Card>
          ) : (
            trajectories.map((trajectory) => (
              <Card 
                key={trajectory.id} 
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setSelectedTrajectory(trajectory)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {trajectory.position} - {trajectory.client?.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Kandidaat: {trajectory.candidate?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Gestart op {trajectory.startDate ? format(new Date(trajectory.startDate), "d MMM yyyy", { locale: nl }) : "Onbekend"}
                      </p>
                    </div>
                    <Badge className={getStatusColor(trajectory.status)}>
                      {getStatusLabel(trajectory.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">FUNCTIE</label>
                      <p className="text-sm text-gray-900">{trajectory.position}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">TARIEF</label>
                      <p className="text-sm text-gray-900">{trajectory.rate}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">LOCATIE</label>
                      <p className="text-sm text-gray-900">{trajectory.client?.location}</p>
                    </div>
                  </div>
                  
                  {trajectory.notes && (
                    <p className="text-sm text-gray-600 mb-4">{trajectory.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTrajectory && (
        <DetailModal
          entity={selectedTrajectory}
          entityType="trajectory"
          isOpen={!!selectedTrajectory}
          onClose={() => setSelectedTrajectory(null)}
        />
      )}

      {/* New Trajectory Modal */}
      <NewTrajectoryModal
        isOpen={isNewTrajectoryModalOpen}
        onClose={() => setIsNewTrajectoryModalOpen(false)}
      />
    </>
  );
}
