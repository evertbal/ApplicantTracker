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

  const { data: candidates = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/candidates'],
    enabled: true,
  });

  // Type-safe access to candidates data
  const candidatesArray = Array.isArray(candidates) ? candidates as any[] : [];

  // Filter candidates client-side
  const filteredCandidates = candidatesArray.filter((candidate: any) => {
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
    setSelectedStatuses([]);
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
        
        let message = `Import resultaat: ${result.imported} van ${result.total} kandidaten geïmporteerd.`;
        if (result.errors && result.errors.length > 0) {
          message += `\n\nFouten:\n${result.errors.slice(0, 5).join('\n')}`;
          if (result.errors.length > 5) {
            message += `\n... en ${result.errors.length - 5} meer`;
          }
        }
        if (result.debug) {
          console.log('Import debug info:', result.debug);
        }
        alert(message);
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

  // Extract filter options from data
  const statusSet = new Set<string>();
  const regionSet = new Set<string>();
  
  candidatesArray.forEach((c: any) => {
    if (c.status) statusSet.add(c.status);
    if (c.region) regionSet.add(c.region);
  });
  
  const statusOptions = Array.from(statusSet);
  const regionOptions = Array.from(regionSet);
  const licenseOptions = ['A', 'AM', 'B', 'BE', 'C', 'CE', 'D', 'DE', 'T'];

  const activeFiltersCount = 
    selectedStatuses.length + 
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
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="excel-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('excel-upload')?.click()}
              className="hidden sm:flex"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary-hover text-white"
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

      {/* Detail Modal */}
      {selectedCandidate && (
        <DetailModal
          entity={selectedCandidate}
          entityType="candidate"
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
