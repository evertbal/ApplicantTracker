import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Plus, Download, Upload, RefreshCw, FileSpreadsheet, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CandidateWithRelations } from "@shared/schema";
import CandidateForm from "./candidate-form";
import CollapsibleFilters from "./collapsible-filters";
import CompactList from "./compact-list";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";

export default function CandidatesView() {
  const { filters, updateFilters, clearAllFilters, hasActiveFilters } = usePersistedFilters();
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateWithRelations | null>(null);
  const [showExcelTemplateModal, setShowExcelTemplateModal] = useState(false);
  const [, setLocation] = useLocation();

  const queryClient = useQueryClient();

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

    // Phase filter
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

  const normalizeLicensesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/normalize-all-licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to normalize licenses');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      alert(`Rijbewijs normalisatie voltooid: ${data.message}`);
      refetch(); // Herlaad de kandidaten data
    },
    onError: (error) => {
      console.error('Error normalizing licenses:', error);
      alert('Fout bij het normaliseren van rijbewijzen');
    }
  });

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
        const message = `Import voltooid! ${result.imported} kandidaten geïmporteerd${result.skipped ? `, ${result.skipped} overgeslagen` : ''}.`;
        
        refetch();
        
        if (result.errors && result.errors.length > 0) {
          console.log('Import errors:', result.errors);
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

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Kandidaten</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Beheer en volg alle kandidaten in het systeem
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Zoeken..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full h-8 sm:h-10 pl-8 sm:pl-10 text-sm pr-2"
              />
              <Search className="w-3 h-3 sm:w-4 sm:h-4 absolute left-2 sm:left-3 top-2.5 sm:top-3 text-gray-400" />
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
              size="sm"
              onClick={() => setShowExcelTemplateModal(true)}
              className="shrink-0 h-8 sm:h-10 px-2 sm:px-3"
            >
              <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary-hover text-white shrink-0 h-8 sm:h-10 px-2 sm:px-3"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nieuw</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-6 overflow-y-auto max-w-full">
        {/* Collapsible Filters */}
        <CollapsibleFilters
          phaseOptions={phaseOptions}
          regionOptions={regionOptions}
          licenseOptions={licenseOptions}
          selectedPhases={filters.selectedPhases}
          selectedRegion={filters.selectedRegion}
          selectedLicenses={filters.selectedLicenses}
          dateFrom=""
          dateTo=""
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onPhaseChange={(phases) => updateFilters({ selectedPhases: phases })}
          onRegionChange={(region) => updateFilters({ selectedRegion: region })}
          onLicenseChange={(licenses) => updateFilters({ selectedLicenses: licenses })}
          onDateFromChange={() => {}}
          onDateToChange={() => {}}
          onSort={handleSort}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Results Counter - only show when filters are active */}
        {hasActiveFilters() && (
          <div className="mb-6 transition-all duration-300 ease-in-out">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                      {filteredCandidates.length}
                    </h3>
                    <span className="text-base text-green-700 dark:text-green-300">
                      {filteredCandidates.length === 1 ? 'kandidaat gevonden' : 'kandidaten gevonden'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-800 dark:text-green-200">Actieve filters:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      {activeFiltersCount}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 shrink-0"
                >
                  <X className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filters wissen</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Compact List */}
        <div>
          <CompactList
            items={filteredCandidates}
            type="candidates"
            onView={(candidate: CandidateWithRelations) => setLocation(`/candidate/${candidate.id}`)}
            onEdit={openEditForm}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <CandidateForm
          candidate={editingCandidate}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Excel Template Modal */}
      {showExcelTemplateModal && (
        <Dialog open={showExcelTemplateModal} onOpenChange={setShowExcelTemplateModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">Excel Import Template - Kandidaten</DialogTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowExcelTemplateModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructies</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Gebruik exact deze kolomnamen in de eerste rij van je Excel bestand</li>
                  <li>• Rijbewijs categorieën: gebruik alleen A, AM, B, BE, C, CE, D, DE, T (gescheiden door komma's)</li>
                  <li>• Status: active, placed, inactive</li>
                  <li>• Fase: intake, matching, placed</li>
                  <li>• Datum formaat: YYYY-MM-DD of DD-MM-YYYY</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Vereiste Excel Structuur:</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="font-semibold">Kolom</TableHead>
                        <TableHead className="font-semibold">Vereist</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Voorbeeld</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">name</TableCell>
                        <TableCell><Badge variant="destructive">Ja</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>Jan de Vries</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">email</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>jan@example.com</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">phone</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>06-12345678</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">city</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>Amsterdam</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">region</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>Noord-Holland</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">marketing</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>Website</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">drivingLicenses</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>B, BE, C</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">drivingLicenseNotes</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>Geldig tot 2026</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">description</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>Ervaren chauffeur met 10 jaar ervaring</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">status</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>active</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">phase</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Tekst</TableCell>
                        <TableCell>intake</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">dateAdded</TableCell>
                        <TableCell><Badge variant="secondary">Nee</Badge></TableCell>
                        <TableCell>Datum</TableCell>
                        <TableCell>2024-01-15</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Rijbewijs Categorieën</h3>
                <div className="grid grid-cols-3 gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">A</code> - Motorfiets</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">AM</code> - Bromfiets</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">B</code> - Personenauto</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">BE</code> - Auto + aanhanger</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">C</code> - Vrachtwagen</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">CE</code> - Vracht + aanhanger</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">D</code> - Autobus</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">DE</code> - Bus + aanhanger</div>
                  <div><code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">T</code> - Landbouwvoertuigen</div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExcelTemplateModal(false)}
                >
                  Sluiten
                </Button>
                <Button
                  onClick={() => {
                    setShowExcelTemplateModal(false);
                    document.getElementById('excel-upload')?.click();
                  }}
                  className="bg-primary hover:bg-primary-hover text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Selecteer Excel Bestand
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}