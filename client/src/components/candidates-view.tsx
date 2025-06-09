import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CandidateWithRelations } from "@shared/schema";
import DetailModal from "./detail-modal";
import CandidateForm from "./candidate-form";
import CollapsibleFilters from "./collapsible-filters";
import CompactList from "./compact-list";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

export default function CandidatesView() {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["active"]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithRelations | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateWithRelations | null>(null);

  const queryClient = useQueryClient();

  const { data: candidates = [], isLoading, refetch } = useQuery<CandidateWithRelations[]>({
    queryKey: ['/api/candidates'],
    enabled: true,
  });

  // Type-safe access to candidates data
  const candidatesArray = Array.isArray(candidates) ? candidates : [];

  // Filter candidates client-side
  const filteredCandidates = candidatesArray.filter((candidate: CandidateWithRelations) => {
    // Search filter
    const matchesSearch = search === "" || 
      candidate.name?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(search.toLowerCase()) ||
      (candidate.city && candidate.city.toLowerCase().includes(search.toLowerCase()));

    // Status filter
    const matchesStatus = selectedStatuses.length === 0 || (candidate.status && selectedStatuses.includes(candidate.status));

    // Region filter
    const matchesRegion = selectedRegion === "" || selectedRegion === "alle" || candidate.region === selectedRegion;

    // License filter
    const matchesLicense = selectedLicenses.length === 0 || 
      (candidate.drivingLicenses && selectedLicenses.some(license => 
        candidate.drivingLicenses?.includes(license)
      ));

    return matchesSearch && matchesStatus && matchesRegion && matchesLicense;
  });

  const statusOptions = [
    { value: "active", label: "Actief" },
    { value: "inactive", label: "Inactief" },
    { value: "interview", label: "Gesprek" },
    { value: "placed", label: "Geplaatst" },
  ];

  const regionOptions = [
    { value: "alle", label: "Alle regio's" },
    { value: "noord", label: "Noord" },
    { value: "oost", label: "Oost" },
    { value: "zuid", label: "Zuid" },
    { value: "west", label: "West" },
  ];

  const licenseOptions = [
    { value: "B", label: "B - Auto" },
    { value: "C", label: "C - Vrachtwagen" },
    { value: "CE", label: "CE - Vrachtwagen + aanhanger" },
  ];

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

  // Calculate active filters count
  const activeFiltersCount = selectedStatuses.length + 
    (selectedRegion ? 1 : 0) + 
    selectedLicenses.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Kandidaten</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
              Beheer en volg alle kandidaten in het systeem
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </span>
              </Button>
            </label>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Zoeken..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 pl-10"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Collapsible Filters */}
        <CollapsibleFilters
          statusOptions={statusOptions}
          regionOptions={regionOptions}
          licenseOptions={licenseOptions}
          selectedStatuses={selectedStatuses}
          selectedRegion={selectedRegion}
          selectedLicenses={selectedLicenses}
          onStatusChange={setSelectedStatuses}
          onRegionChange={setSelectedRegion}
          onLicenseChange={setSelectedLicenses}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Compact List */}
        <div className="mt-4">
          <CompactList
            items={filteredCandidates}
            type="candidates"
            onView={setSelectedCandidate}
            onEdit={openEditForm}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCandidate && (
        <DetailModal
          entity={selectedCandidate}
          entityType="candidate"
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onEdit={() => openEditForm(selectedCandidate)}
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
    </div>
  );
}