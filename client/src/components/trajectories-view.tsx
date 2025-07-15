import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Plus, Filter, Download, MoreHorizontal, Edit, Users, Building, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { TrajectoryWithRelations } from "@shared/schema";

import TrajectoryForm from "./trajectory-form";

export default function TrajectoriesView() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["geaccepteerd", "voorgesteld_aan_klant"]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrajectory, setEditingTrajectory] = useState<TrajectoryWithRelations | null>(null);
  const [sortBy, setSortBy] = useState<'created' | 'updated'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: trajectories = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/trajectories', search, selectedStatuses],
    enabled: true,
  });

  // Filter and sort trajectories
  const filteredAndSortedTrajectories = (() => {
    let filtered = Array.isArray(trajectories) ? trajectories.filter((trajectory: any) => {
      // Search filter
      const matchesSearch = !search || 
        trajectory.position?.toLowerCase().includes(search.toLowerCase()) ||
        trajectory.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
        trajectory.candidate?.name?.toLowerCase().includes(search.toLowerCase()) ||
        trajectory.client?.name?.toLowerCase().includes(search.toLowerCase());
      
      // Status filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(trajectory.status);
      
      return matchesSearch && matchesStatus;
    }) : [];

    // Sort trajectories
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      if (sortBy === 'created') {
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
      } else if (sortBy === 'updated') {
        aValue = new Date(a.updatedAt || a.createdAt || 0).getTime();
        bValue = new Date(b.updatedAt || b.createdAt || 0).getTime();
      }
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return filtered;
  })();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'interview':
        return <Badge className="status-interview">In Gesprek</Badge>;
      case 'proposed':
        return <Badge className="status-proposed">Voorgesteld</Badge>;
      case 'placed':
        return <Badge className="status-placed">Geplaatst</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStatuses(["interview", "proposed"]);
  };

  const handleSort = (field: 'created' | 'updated') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    }
  };

  const openEditForm = (trajectory: TrajectoryWithRelations) => {
    setEditingTrajectory(trajectory);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTrajectory(null);
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
          <p className="text-gray-600 dark:text-gray-400">Trajecten laden...</p>
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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Trajecten</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <Button
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw Traject
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Filter Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
          
          {/* Status Filter */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</Label>
            <div className="space-y-2">
              {[
                { value: 'geaccepteerd', label: 'Geaccepteerd', count: trajectories.filter(t => t.status === 'geaccepteerd').length },
                { value: 'voorgesteld_aan_klant', label: 'Voorgesteld aan klant', count: trajectories.filter(t => t.status === 'voorgesteld_aan_klant').length },
                { value: 'gesprek_met_klant', label: 'Gesprek met klant', count: trajectories.filter(t => t.status === 'gesprek_met_klant').length },
                { value: 'geplaatst', label: 'Geplaatst', count: trajectories.filter(t => t.status === 'geplaatst').length },
                { value: 'niet_geplaatst', label: 'Niet geplaatst', count: trajectories.filter(t => t.status === 'niet_geplaatst').length },
                { value: 'gestopt', label: 'Gestopt', count: trajectories.filter(t => t.status === 'gestopt').length },
              ].map((status) => (
                <div key={status.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={(checked) => handleStatusChange(status.value, checked as boolean)}
                    />
                    <Label htmlFor={`status-${status.value}`} className="text-sm">
                      {status.label}
                    </Label>
                  </div>
                  <span className="text-xs text-gray-500">({status.count})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters Wissen
            </Button>
            
            {/* Sort Button */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sorteren</h4>
              <div className="space-y-2">
                <Button
                  variant={sortBy === 'created' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSort('created')}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Datum aangemaakt
                  {sortBy === 'created' && (
                    <span className="ml-auto text-xs">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </Button>
                <Button
                  variant={sortBy === 'updated' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSort('updated')}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Datum gewijzigd
                  {sortBy === 'updated' && (
                    <span className="ml-auto text-xs">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Data View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* List Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAndSortedTrajectories.length} trajecten gevonden
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Trajectories List */}
            <div className="space-y-4">
              {filteredAndSortedTrajectories.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Geen trajecten gevonden
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Er zijn geen trajecten die voldoen aan de huidige filters.
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Eerste traject toevoegen
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredAndSortedTrajectories.map((trajectory) => (
                  <Card
                    key={trajectory.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/trajectory/${trajectory.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {trajectory.jobTitle || 'Onbekende functie'} - {trajectory.client?.name || 'Onbekende opdrachtgever'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Traject #{trajectory.id}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(trajectory.status || 'interview')}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(trajectory);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Bewerken
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">KANDIDAAT</label>
                          <p className="text-sm text-gray-900 dark:text-white flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {trajectory.candidate?.name || 'Onbekend'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">OPDRACHTGEVER</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {trajectory.client?.name || 'Onbekend'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">OPDRACHTGEVER</label>
                          <p className="text-sm text-gray-900 dark:text-white flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {trajectory.client?.name || 'Onbekend'}
                          </p>
                        </div>
                      </div>
                      
                      {trajectory.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {trajectory.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Form Modal */}
      {showForm && (
        <TrajectoryForm
          trajectory={editingTrajectory}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
