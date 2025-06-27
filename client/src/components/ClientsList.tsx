import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Building } from "lucide-react";
import type { ClientWithRelations } from "@shared/schema";
import DetailModal from "./DetailModal";
import NewClientModal from "./NewClientModal";
import ClientForm from "./client-form";

export default function ClientsList() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithRelations | null>(null);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/clients", { search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json() as Promise<ClientWithRelations[]>;
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
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
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Opdrachtgevers</h2>
            <p className="text-sm text-gray-600 mt-1">
              Beheer relaties met opdrachtgevers en partners
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
              onClick={() => setIsNewClientModalOpen(true)}
              className="bg-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Opdrachtgever
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            {clients.length} opdrachtgevers gevonden
          </span>
        </div>

        <div className="space-y-4">
          {clients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Geen opdrachtgevers gevonden</p>
              </CardContent>
            </Card>
          ) : (
            clients.map((client) => (
              <Card 
                key={client.id} 
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setSelectedClient(client)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {client.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {client.contactPerson} • {client.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        {client.workType}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          {client.trajectories?.length || 0} actieve trajecten
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
