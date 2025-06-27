import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { TrajectoryWithRelations } from "@shared/schema";
import DetailModal from "./DetailModal";
import NewTrajectoryModal from "./NewTrajectoryModal";
import TrajectoryForm from "./trajectory-form";
import { 
  formatTrajectoryTitle, 
  formatTrajectoryDate, 
  formatTrajectoryStatus, 
  getTrajectoryStatusColor 
} from "@/lib/trajectory-formatters";
import CompactList from "./compact-list";

export default function TrajectoriesView() {
  const [search, setSearch] = useState("");
  const [selectedTrajectory, setSelectedTrajectory] = useState<TrajectoryWithRelations | null>(null);
  const [isNewTrajectoryModalOpen, setIsNewTrajectoryModalOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingTrajectory, setEditingTrajectory] = useState<TrajectoryWithRelations | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trajectories = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/trajectories'],
    enabled: true,
  });

  // Status options
  const statusOptions = [
    { value: "interview", label: "In Gesprek" },
    { value: "proposed", label: "Voorgesteld" },
    { value: "placed", label: "Geplaatst" }
  ];

  // Filter trajectories
  const filteredTrajectories = Array.isArray(trajectories) ? trajectories.filter((trajectory: any) => {
    const matchesSearch = !search || 
      trajectory.position?.toLowerCase().includes(search.toLowerCase()) ||
      trajectory.candidate?.name?.toLowerCase().includes(search.toLowerCase()) ||
      trajectory.client?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(trajectory.status);
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Count active filters
  const activeFiltersCount = selectedStatuses.length;

  const openEditForm = (trajectory: TrajectoryWithRelations) => {
    if (!trajectory || !trajectory.id) {
      toast({
        title: "Fout",
        description: "Het geselecteerde traject kan niet worden gevonden.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingTrajectory(trajectory);
    setIsEditFormOpen(true);
  };

  const closeEditForm = () => {
    setIsEditFormOpen(false);
    setEditingTrajectory(null);
  };

  const handleEditFormSuccess = () => {
    refetch();
    closeEditForm();
  };

  const handleNewFormSuccess = () => {
    refetch();
    setIsNewTrajectoryModalOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Trajecten</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Overzicht van alle actieve en voltooide trajecten
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative flex-1 sm:flex-none">
              <Input
                type="text"
                placeholder="Zoeken..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <Button
              onClick={() => setIsNewTrajectoryModalOpen(true)}
              className="bg-primary hover:bg-primary-hover shrink-0"
              size="sm"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nieuw</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Collapsible Filters */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="mb-4 w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <Select
                  value={selectedStatuses.length === 1 ? selectedStatuses[0] : ""}
                  onValueChange={(value) => setSelectedStatuses(value ? [value] : [])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle statussen</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTrajectories.length} trajecten gevonden
          </span>
        </div>

        {/* Compact List */}
        <div className="mt-4">
          <CompactList
            items={filteredTrajectories}
            type="trajectories"
            onView={setSelectedTrajectory}
            onEdit={openEditForm}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTrajectory && (
        <DetailModal
          entity={selectedTrajectory}
          entityType="trajectory"
          isOpen={!!selectedTrajectory}
          onClose={() => setSelectedTrajectory(null)}
          onEdit={(trajectory) => {
            setEditingTrajectory(trajectory);
            setIsEditFormOpen(true);
            setSelectedTrajectory(null);
          }}
        />
      )}

      {/* New Trajectory Modal */}
      <NewTrajectoryModal
        isOpen={isNewTrajectoryModalOpen}
        onClose={() => setIsNewTrajectoryModalOpen(false)}
      />

      {/* Edit Trajectory Form */}
      {isEditFormOpen && editingTrajectory && (
        <TrajectoryForm
          isOpen={isEditFormOpen}
          trajectory={editingTrajectory}
          mode="edit"
          onClose={() => {
            setIsEditFormOpen(false);
            setEditingTrajectory(null);
          }}
        />
      )}
    </>
  );
}