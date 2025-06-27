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
import ClientForm from "./client-form";
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
  const workTypeSet = Array.isArray(clients) ? clients.map((client: any) => client.workType).filter(Boolean) : [];
  const workTypeOptions = workTypeSet.filter((value, index, self) => self.indexOf(value) === index);

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

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithRelations | null>(null);

  const openEditForm = (client: ClientWithRelations) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleFormSuccess = () => {
    refetch();
    closeForm();
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
                  value={selectedWorkTypes.length === 1 ? selectedWorkTypes[0] : "all"}
                  onValueChange={(value) => setSelectedWorkTypes(value === "all" ? [] : [value])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Alle types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle types</SelectItem>
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

        {/* Results Counter */}
        <div className="mt-6 mb-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {filteredClients.length} {filteredClients.length === 1 ? 'opdrachtgever' : 'opdrachtgevers'} gevonden
                </div>
                {activeFiltersCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-700 dark:text-green-300">met</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'}
                    </Badge>
                  </div>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedWorkTypes([]);
                  }}
                  className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-900/20"
                >
                  Alle filters wissen
                </Button>
              )}
            </div>
          </div>
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
          onEdit={() => {
            openEditForm(selectedClient);
            setSelectedClient(null);
          }}
        />
      )}

      {/* New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
      />

      {/* Edit Client Form */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}