import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Filter, Download, MoreHorizontal, Edit, Building, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { ClientWithRelations } from "@shared/schema";
import DetailModal from "./detail-modal";
import ClientForm from "./client-form";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

export default function ClientsView() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithRelations | null>(null);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/clients', search],
    enabled: true,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Opdrachtgevers laden...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Opdrachtgevers</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <Button
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Opdrachtgever
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Filter Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
          
          {/* Work Type Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Soort Werkzaamheden</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Alle werkzaamheden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle werkzaamheden</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="logistiek">Logistiek</SelectItem>
                <SelectItem value="distributie">Distributie</SelectItem>
                <SelectItem value="magazijn">Magazijn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSearch("")}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters Wissen
          </Button>
        </div>

        {/* Data View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* List Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {clients.length} opdrachtgevers gevonden
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Select defaultValue="name">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sorteer op naam</SelectItem>
                    <SelectItem value="date">Sorteer op datum</SelectItem>
                    <SelectItem value="location">Sorteer op locatie</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Clients List */}
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <SkeletonLoader circle width={48} height={48} />
                          <div>
                            <SkeletonLoader height="1.125rem" width="12rem" className="mb-2" />
                            <SkeletonLoader height="0.875rem" width="8rem" className="mb-1" />
                            <SkeletonLoader height="0.875rem" width="10rem" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <SkeletonLoader height="1.25rem" width="4rem" />
                          <SkeletonLoader circle width={32} height={32} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center space-x-6">
                        <SkeletonLoader height="0.875rem" width="6rem" />
                        <SkeletonLoader height="0.875rem" width="8rem" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : clients.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Geen opdrachtgevers gevonden
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Er zijn geen opdrachtgevers die voldoen aan de huidige filters.
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Eerste opdrachtgever toevoegen
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                clients.map((client) => (
                  <Card
                    key={client.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {client.name}
                            </h3>
                            {client.contactPerson && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {client.contactPerson}
                              </p>
                            )}
                            {client.location && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {client.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {client.workType && (
                              <Badge variant="secondary" className="mb-2">
                                {client.workType}
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500">
                              Toegevoegd: {client.createdAt 
                                ? format(new Date(client.createdAt), 'dd MMM yyyy', { locale: nl })
                                : 'Onbekend'}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(client);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Bewerken
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <Building className="w-4 h-4 mr-1" />
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
        </div>
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <DetailModal
          entity={selectedClient}
          entityType="client"
          onClose={() => setSelectedClient(null)}
          onEdit={() => {
            openEditForm(selectedClient);
            setSelectedClient(null);
          }}
        />
      )}

      {/* Form Modal */}
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
