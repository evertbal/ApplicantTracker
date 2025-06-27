import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreVertical, Edit, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { CandidateWithRelations } from "@shared/schema";
import FilterPanel from "./FilterPanel";
import DetailModal from "./DetailModal";
import NewCandidateModal from "./NewCandidateModal";

export default function CandidatesList() {
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithRelations | null>(null);
  const [isNewCandidateModalOpen, setIsNewCandidateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    region: "",
    drivingLicense: [] as string[],
    dateFrom: "",
    dateTo: "",
  });

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["/api/candidates", { search, ...filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.status.length > 0) params.append("status", filters.status.join(","));
      if (filters.region) params.append("region", filters.region);
      if (filters.drivingLicense.length > 0) params.append("drivingLicense", filters.drivingLicense.join(","));
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      
      const response = await fetch(`/api/candidates?${params}`);
      if (!response.ok) throw new Error("Failed to fetch candidates");
      return response.json() as Promise<CandidateWithRelations[]>;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "placed":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actief";
      case "placed":
        return "Geplaatst";
      case "inactive":
        return "Inactief";
      default:
        return status;
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex overflow-hidden">
        <FilterPanel onFiltersChange={setFilters} />
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <h2 className="text-2xl font-semibold text-gray-900">Kandidaten</h2>
            <p className="text-sm text-gray-600 mt-1">
              Beheer en volg alle kandidaten in het systeem
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
              onClick={() => setIsNewCandidateModalOpen(true)}
              className="bg-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Kandidaat
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <FilterPanel onFiltersChange={setFilters} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* List Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                {candidates.length} kandidaten gevonden
              </span>
            </div>

            {/* Candidates List */}
            <div className="space-y-4">
              {candidates.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">Geen kandidaten gevonden</p>
                  </CardContent>
                </Card>
              ) : (
                candidates.map((candidate) => (
                  <Card 
                    key={candidate.id} 
                    className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {getInitials(candidate.name)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {candidate.name}
                            </h3>
                            {candidate.description && (
                              <p className="text-sm font-medium text-primary mb-1">
                                {candidate.description}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              {candidate.city}, {candidate.region}
                            </p>
                            <div className="flex items-center mt-1 space-x-3">
                              <span className="text-xs text-gray-500">
                                {candidate.phone}
                              </span>
                              <span className="text-xs text-gray-500">
                                {candidate.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <Badge className={getStatusColor(candidate.status)}>
                              {getStatusLabel(candidate.status)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Laatst bijgewerkt: {format(new Date(candidate.updatedAt!), "d MMM yyyy", { locale: nl })}
                            </p>
                          </div>
                          {candidate.drivingLicense?.map((license) => (
                            <Badge 
                              key={license} 
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800"
                            >
                              {license}
                            </Badge>
                          ))}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <span>
                              {candidate.trajectories?.length || 0} trajecten
                            </span>
                            <span>
                              Toegevoegd {format(new Date(candidate.dateAdded!), "d MMM yyyy", { locale: nl })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <StickyNote className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCandidate && (
        <DetailModal
          entity={selectedCandidate}
          entityType="candidate"
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      {/* New Candidate Modal */}
      <NewCandidateModal
        isOpen={isNewCandidateModalOpen}
        onClose={() => setIsNewCandidateModalOpen(false)}
      />
    </>
  );
}
