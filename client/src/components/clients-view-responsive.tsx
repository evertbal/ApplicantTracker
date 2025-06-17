import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientWithRelations } from "@shared/schema";
import DetailModal from "./DetailModal";
import NewClientModal from "./NewClientModal";
import CompactList from "./compact-list";

export default function ClientsView() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/clients'],
    enabled: true,
  });

  // Work type options - extracted from existing data
  const workTypeOptions = Array.isArray(clients) ? [...new Set(clients.map((client: any) => client.workType).filter(Boolean))] : [];

  // Filter clients
  const filteredClients = Array.isArray(clients) ? clients.filter((client: any) => {
    const matchesSearch = !search || 
      client.name?.toLowerCase().includes(search.toLowerCase()) ||
      client.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      client.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchesWorkType = selectedWorkTypes.length === 0 || selectedWorkTypes.includes(client.workType);
    
    return matchesSearch && matchesWorkType;
  }) : [];

  // Count active filters
  const activeFiltersCount = selectedWorkTypes.length;

  const openEditForm = (client: ClientWithRelations) => {
    setIsNewClientModalOpen(true);
  };

  const handleFormSuccess = () => {
    refetch();
    setIsNewClientModalOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Opdrachtgevers</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Beheer relaties met opdrachtgevers en partners
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
              onClick={() => setIsNewClientModalOpen(true)}
              className="bg-primary hover:bg-primary-hover shrink-0"
              size="sm"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nieuwe</span>
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
              {/* Work Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type Werk
                </label>
                <Select
                  value={selectedWorkTypes.length === 1 ? selectedWorkTypes[0] : ""}
                  onValueChange={(value) => setSelectedWorkTypes(value ? [value] : [])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Alle types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle types</SelectItem>
                    {workTypeOptions.map((workType) => (
                      <SelectItem key={workType} value={workType}>
                        {workType}
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
            {filteredClients.length} opdrachtgevers gevonden
          </span>
        </div>

        {/* Compact List */}
        <div className="mt-4">
          <CompactList
            items={filteredClients}
            type="clients"
            onView={setSelectedClient}
            onEdit={openEditForm}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <DetailModal
          entity={selectedClient}
          entityType="client"
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
      />
    </>
  );
}