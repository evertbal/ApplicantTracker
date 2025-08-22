import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Plus, Filter, Download, Upload, RefreshCw, FileSpreadsheet, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CandidateWithRelations } from "@shared/schema";
import NewCandidateModal from "./NewCandidateModal";
import CandidateForm from "./candidate-form";
import CompactList from "./compact-list";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";

export default function CandidatesList() {
  const { filters, updateFilters, clearAllFilters, hasActiveFilters } = usePersistedFilters();
  const [isNewCandidateModalOpen, setIsNewCandidateModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateWithRelations | null>(null);
  const [, setLocation] = useLocation();

  const { data: candidates = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/candidates'],
    enabled: true,
  });

  // Type-safe access to candidates data
  const candidatesArray = Array.isArray(candidates) ? candidates as any[] : [];

  // Filter and sort candidates client-side
  const filteredCandidates = candidatesArray.filter((candidate: any) => {
    // Search filter
    const matchesSearch = filters.search === "" || 
      candidate.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      candidate.city?.toLowerCase().includes(filters.search.toLowerCase());

    // Status filter
    const matchesPhase = filters.selectedPhases.length === 0 || filters.selectedPhases.includes(candidate.phase);

    // Region filter
    const matchesRegion = filters.selectedRegion === "" || filters.selectedRegion === "alle" || candidate.region === filters.selectedRegion;

    // License filter
    const matchesLicense = filters.selectedLicenses.length === 0 || 
      (candidate.drivingLicenses && filters.selectedLicenses.some(license => 
        candidate.drivingLicenses.includes(license)
      ));

    return matchesSearch && matchesPhase && matchesRegion && matchesLicense;
  }).sort((a: any, b: any) => {
    let aValue, bValue;
    
    if (filters.sortBy === 'created') {
      aValue = new Date(a.dateAdded || 0).getTime();
      bValue = new Date(b.dateAdded || 0).getTime();
    } else if (filters.sortBy === 'updated') {
      aValue = new Date(a.updatedAt || a.dateAdded || 0).getTime();
      bValue = new Date(b.updatedAt || b.dateAdded || 0).getTime();
    }
    
    if (filters.sortOrder === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  // Extract filter options from data
  const phaseOptions = Array.from(new Set(candidatesArray.map((c: any) => c.phase).filter(Boolean)));
  const regionOptions = Array.from(new Set(candidatesArray.map((c: any) => c.region).filter(Boolean)));
  const licenseOptions = ['A', 'AM', 'B', 'BE', 'C', 'CE', 'D', 'DE', 'T'];

  const handleSort = (field: 'created' | 'updated') => {
    if (filters.sortBy === field) {
      updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sortBy: field, sortOrder: 'desc' });
    }
  };

  const activeFiltersCount = 
    filters.selectedPhases.length +
    (filters.selectedRegion ? 1 : 0) + 
    filters.selectedLicenses.length +
    (filters.search ? 1 : 0);

  const openEditForm = (candidate: CandidateWithRelations) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const handleFormSuccess = () => {
    closeForm();
    refetch();
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Kandidaten</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Beheer en volg alle kandidaten in het systeem
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative flex-1 sm:flex-none">
              <Input
                type="text"
                placeholder="Zoeken..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full sm:w-64 pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <Button
              onClick={() => setIsNewCandidateModalOpen(true)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Phase Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fase
                </label>
                <div className="space-y-2">
                  {phaseOptions.map((phase) => (
                    <div key={phase} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${phase}`}
                        checked={filters.selectedPhases.includes(phase)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({ selectedPhases: [...filters.selectedPhases, phase] });
                          } else {
                            updateFilters({ selectedPhases: filters.selectedPhases.filter(s => s !== phase) });
                          }
                        }}
                      />
                      <Label htmlFor={`status-${phase}`} className="text-sm">
                        {phase}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Regio
                </label>
                <Select
                  value={filters.selectedRegion || "alle"}
                  onValueChange={(value) => updateFilters({ selectedRegion: value === "alle" ? "" : value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Alle regio's" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle regio's</SelectItem>
                    {regionOptions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* License Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rijbewijs
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {licenseOptions.map((license) => (
                    <div key={license} className="flex items-center space-x-2">
                      <Checkbox
                        id={`license-${license}`}
                        checked={filters.selectedLicenses.includes(license)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({ selectedLicenses: [...filters.selectedLicenses, license] });
                          } else {
                            updateFilters({ selectedLicenses: filters.selectedLicenses.filter(l => l !== license) });
                          }
                        }}
                      />
                      <Label htmlFor={`license-${license}`} className="text-sm font-mono">
                        {license}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sorteren
                </label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSort('created')}
                    className={`w-full justify-start ${filters.sortBy === 'created' ? 'bg-primary/10' : ''}`}
                  >
                    <ArrowUpDown className="w-3 h-3 mr-2" />
                    Datum toegevoegd {filters.sortBy === 'created' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSort('updated')}
                    className={`w-full justify-start ${filters.sortBy === 'updated' ? 'bg-primary/10' : ''}`}
                  >
                    <ArrowUpDown className="w-3 h-3 mr-2" />
                    Laatst gewijzigd {filters.sortBy === 'updated' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-4 border-t">
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-600 hover:text-red-700">
                  <X className="w-4 h-4 mr-2" />
                  Alle filters wissen
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Results Counter */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-green-900">
                  {filteredCandidates.length}
                </h3>
                <span className="text-base text-green-700">
                  {filteredCandidates.length === 1 ? 'kandidaat gevonden' : 'kandidaten gevonden'}
                </span>
              </div>
              
              {hasActiveFilters && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">Actieve filters:</p>
                  <div className="flex flex-wrap gap-1">
                    {filters.search && (
                      <Badge variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                        Zoekterm: "{filters.search}"
                      </Badge>
                    )}
                    {filters.selectedPhases.map(phase => (
                      <Badge key={phase} variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                        Fase: {phase}
                      </Badge>
                    ))}
                    {filters.selectedRegion && (
                      <Badge variant="outline" className="text-xs bg-white border-green-300 text-green-700">
                        Regio: {filters.selectedRegion}
                      </Badge>
                    )}
                    {filters.selectedLicenses.map(license => (
                      <Badge key={license} variant="outline" className="text-xs bg-white border-green-300 text-green-700 font-mono">
                        Rijbewijs: {license}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-green-600 hover:text-green-700 shrink-0">
                <X className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Filters wissen</span>
              </Button>
            )}
          </div>
        </div>

        {/* Candidates List */}
        <CompactList
          items={filteredCandidates}
          type="candidates"
          onView={(candidate) => setLocation(`/candidate/${candidate.id}`)}
          onEdit={openEditForm}
          isLoading={isLoading}
        />
      </div>

      {/* Modals */}
      <NewCandidateModal
        isOpen={isNewCandidateModalOpen}
        onClose={() => setIsNewCandidateModalOpen(false)}
        onSuccess={() => {
          setIsNewCandidateModalOpen(false);
          refetch();
        }}
      />

      {showForm && (
        <CandidateForm
          candidate={editingCandidate || undefined}
          isOpen={showForm}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
