import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Filter, Download, MoreHorizontal, Edit, StickyNote, Users, Route, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { CandidateWithRelations } from "@shared/schema";
import DetailModal from "./detail-modal";
import CandidateForm from "./candidate-form";

export default function CandidatesView() {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["active"]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithRelations | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateWithRelations | null>(null);

  const queryClient = useQueryClient();

  const { data: candidates = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/candidates'],
    enabled: true,
  });

  // Filter candidates client-side
  const filteredCandidates = candidates.filter((candidate: any) => {
    // Search filter
    const matchesSearch = search === "" || 
      candidate.name?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.city?.toLowerCase().includes(search.toLowerCase());

    // Status filter
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(candidate.status);

    // Region filter
    const matchesRegion = selectedRegion === "" || selectedRegion === "alle" || candidate.region === selectedRegion;

    // License filter
    const matchesLicense = selectedLicenses.length === 0 || 
      (candidate.drivingLicenses && selectedLicenses.some(license => candidate.drivingLicenses.includes(license)));

    return matchesSearch && matchesStatus && matchesRegion && matchesLicense;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="status-active">Actief</Badge>;
      case 'placed':
        return <Badge className="status-placed">Geplaatst</Badge>;
      case 'inactive':
        return <Badge className="status-inactive">Inactief</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '';
    return phone.replace(/(\d{2})(\d{1})(\d{8})/, '+$1 $2 $3');
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStatuses(["active"]);
    setSelectedRegion("");
    setSelectedLicenses([]);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    }
  };

  const handleLicenseChange = (license: string, checked: boolean) => {
    if (checked) {
      setSelectedLicenses([...selectedLicenses, license]);
    } else {
      setSelectedLicenses(selectedLicenses.filter(l => l !== license));
    }
  };

  const openEditForm = (candidate: CandidateWithRelations) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const handleFormSuccess = () => {
    refetch();
    closeForm();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/candidates/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
        alert(`Import succesvol! ${result.imported} kandidaten toegevoegd.`);
      } else {
        const error = await response.json();
        alert(`Import fout: ${error.message}`);
      }
    } catch (error) {
      alert('Er is een fout opgetreden bij het importeren van het bestand.');
    }

    // Reset file input
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Kandidaten laden...</p>
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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Kandidaten</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="excel-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('excel-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Kandidaat
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
                { value: 'active', label: 'Actief', count: candidates.filter((c: any) => c.status === 'active').length },
                { value: 'placed', label: 'Geplaatst', count: candidates.filter((c: any) => c.status === 'placed').length },
                { value: 'inactive', label: 'Inactief', count: candidates.filter((c: any) => c.status === 'inactive').length },
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

          {/* Region Filter */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Regio</Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Alle regio's" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle regio's</SelectItem>
                {Array.from(new Set(candidates.filter((c: any) => c.region).map((c: any) => c.region))).map((region: string) => (
                  <SelectItem key={region} value={region}>
                    {region} ({candidates.filter((c: any) => c.region === region).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Driving License Filter */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rijbewijs</Label>
            <div className="space-y-2">
              {['B', 'C', 'D'].map((license) => (
                <div key={license} className="flex items-center space-x-2">
                  <Checkbox
                    id={`license-${license}`}
                    checked={selectedLicenses.includes(license)}
                    onCheckedChange={(checked) => handleLicenseChange(license, checked as boolean)}
                  />
                  <Label htmlFor={`license-${license}`} className="text-sm">
                    {license} ({license === 'B' ? 'Auto' : license === 'C' ? 'Vrachtwagen' : 'Bus'})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
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
                  {candidates.length} kandidaten gevonden
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
                    <SelectItem value="status">Sorteer op status</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-4">
              {candidates.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Geen kandidaten gevonden
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Er zijn geen kandidaten die voldoen aan de huidige filters.
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Eerste kandidaat toevoegen
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                candidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gray-200 text-gray-600">
                              {getInitials(candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {candidate.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {candidate.city}, {candidate.region}
                            </p>
                            <div className="flex items-center mt-1 space-x-3">
                              {candidate.phone && (
                                <span className="text-xs text-gray-500">
                                  {formatPhoneNumber(candidate.phone)}
                                </span>
                              )}
                              {candidate.email && (
                                <span className="text-xs text-gray-500">
                                  {candidate.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {getStatusBadge(candidate.status || 'active')}
                            <p className="text-xs text-gray-500 mt-1">
                              Laatst bijgewerkt: {candidate.updatedAt 
                                ? format(new Date(candidate.updatedAt), 'dd MMM yyyy', { locale: nl })
                                : 'Onbekend'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {candidate.drivingLicenses?.map((license) => (
                              <Badge key={license} className="driving-license-badge">
                                {license}
                              </Badge>
                            ))}
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
                                openEditForm(candidate);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Bewerken
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCandidate(candidate);
                              }}>
                                <StickyNote className="w-4 h-4 mr-2" />
                                Notitie toevoegen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <Route className="w-4 h-4 mr-1" />
                              {candidate.trajectories?.length || 0} trajecten
                            </span>
                            <span className="flex items-center">
                              <StickyNote className="w-4 h-4 mr-1" />
                              Toegevoegd {candidate.dateAdded 
                                ? format(new Date(candidate.dateAdded), 'dd MMM yyyy', { locale: nl })
                                : 'Onbekend'}
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
      {selectedCandidate && (
        <DetailModal
          entity={selectedCandidate}
          entityType="candidate"
          onClose={() => setSelectedCandidate(null)}
          onEdit={() => {
            openEditForm(selectedCandidate);
            setSelectedCandidate(null);
          }}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <CandidateForm
          candidate={editingCandidate}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
