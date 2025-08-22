import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FilterPanelProps {
  onFiltersChange: (filters: {
    phase: string[];
    region: string;
    drivingLicense: string[];
    dateFrom: string;
    dateTo: string;
  }) => void;
}

export default function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    phase: [] as string[],
    region: "",
    drivingLicense: [] as string[],
    dateFrom: "",
    dateTo: "",
  });

  // Fetch all candidates for counting
  const { data: allCandidates = [] } = useQuery({
    queryKey: ["/api/candidates"],
  });

  const getPhaseCount = (phase: string) => {
    if (!Array.isArray(allCandidates)) return 0;
    return (allCandidates as any[]).filter((candidate: any) => candidate.phase === phase).length;
  };

  const getDrivingLicenseCount = (license: string) => {
    if (!Array.isArray(allCandidates)) return 0;
    return (allCandidates as any[]).filter((candidate: any) => 
      candidate.drivingLicenses && candidate.drivingLicenses.includes(license)
    ).length;
  };

  const handlePhaseChange = (phase: string, checked: boolean) => {
    const newPhase = checked
      ? [...filters.phase, phase]
      : filters.phase.filter(s => s !== phase);

    const newFilters = { ...filters, phase: newPhase };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRegionChange = (region: string) => {
    const newFilters = { ...filters, region };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDrivingLicenseChange = (license: string, checked: boolean) => {
    const newDrivingLicense = checked
      ? [...filters.drivingLicense, license]
      : filters.drivingLicense.filter(l => l !== license);
    
    const newFilters = { ...filters, drivingLicense: newDrivingLicense };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateChange = (field: "dateFrom" | "dateTo", value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      phase: [],
      region: "",
      drivingLicense: [],
      dateFrom: "",
      dateTo: "",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="w-full sm:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-3 sm:p-6 flex flex-col min-h-0">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex-shrink-0">Filters</h3>
      
      <div className="flex-1 space-y-4 sm:space-y-6 min-h-0 overflow-y-auto">
        {/* Status Filter */}
        <div className="flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Fase</Label>
          <div className="space-y-1 sm:space-y-2">
            {[
              { value: "intake", label: "Intake" },
              { value: "matching", label: "Matching" },
              { value: "placed", label: "Geplaatst" },
            ].map((phase) => (
              <div key={phase.value} className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <Checkbox
                    id={phase.value}
                    checked={filters.phase.includes(phase.value)}
                    onCheckedChange={(checked) => handlePhaseChange(phase.value, checked as boolean)}
                    className="flex-shrink-0"
                  />
                  <Label htmlFor={phase.value} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                    {phase.label}
                  </Label>
                </div>
                <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                  {getPhaseCount(phase.value)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Region Filter */}
        <div className="flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Regio</Label>
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex-1 min-w-0">
              <SearchableSelect
                options={[
                  { value: "", label: "Alle regio's" },
                  { value: "Noord-Holland", label: "Noord-Holland" },
                  { value: "Zuid-Holland", label: "Zuid-Holland" },
                  { value: "Utrecht", label: "Utrecht" },
                  { value: "Gelderland", label: "Gelderland" },
                  { value: "Noord-Brabant", label: "Noord-Brabant" },
                  { value: "Overijssel", label: "Overijssel" },
                  { value: "Groningen", label: "Groningen" },
                  { value: "Friesland", label: "Friesland" },
                  { value: "Drenthe", label: "Drenthe" },
                  { value: "Flevoland", label: "Flevoland" },
                  { value: "Zeeland", label: "Zeeland" },
                  { value: "Limburg", label: "Limburg" }
                ]}
                value={filters.region}
                onValueChange={handleRegionChange}
                placeholder="Alle regio's"
                searchPlaceholder="Zoek regio..."
                emptyMessage="Geen regio's gevonden."
              />
            </div>
            {filters.region && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRegionChange("")}
                className="px-2 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Driving License Filter */}
        <div className="flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rijbewijs</Label>
          <div className="space-y-1 sm:space-y-2">
            {["AM", "A1", "A2", "A", "B", "BE", "C1", "C1E", "C", "CE", "D1", "D1E", "D", "DE", "T"].map((license) => (
              <div key={license} className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <Checkbox
                    id={license}
                    checked={filters.drivingLicense.includes(license)}
                    onCheckedChange={(checked) => handleDrivingLicenseChange(license, checked as boolean)}
                    className="flex-shrink-0"
                  />
                  <Label htmlFor={license} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                    {license}
                  </Label>
                </div>
                <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                  {getDrivingLicenseCount(license)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex-shrink-0">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Datum Toegevoegd</Label>
          <div className="space-y-1 sm:space-y-2">
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleDateChange("dateFrom", e.target.value)}
              placeholder="Van"
              className="text-xs sm:text-sm w-full"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleDateChange("dateTo", e.target.value)}
              placeholder="Tot"
              className="text-xs sm:text-sm w-full"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters - Fixed at bottom */}
      <div className="flex-shrink-0 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="w-full text-xs sm:text-sm"
          size="sm"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Filters Wissen
        </Button>
      </div>
    </div>
  );
}