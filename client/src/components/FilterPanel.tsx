import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface FilterPanelProps {
  onFiltersChange: (filters: {
    status: string[];
    region: string;
    drivingLicense: string[];
    dateFrom: string;
    dateTo: string;
  }) => void;
}

export default function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    status: [] as string[],
    region: "",
    drivingLicense: [] as string[],
    dateFrom: "",
    dateTo: "",
  });

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status);
    
    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDrivingLicenseChange = (license: string, checked: boolean) => {
    const newLicenses = checked
      ? [...filters.drivingLicense, license]
      : filters.drivingLicense.filter(l => l !== license);
    
    const newFilters = { ...filters, drivingLicense: newLicenses };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRegionChange = (region: string) => {
    const newFilters = { ...filters, region };
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
      status: [],
      region: "",
      drivingLicense: [],
      dateFrom: "",
      dateTo: "",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="w-full sm:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-3 sm:p-6 overflow-y-auto">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Filters</h3>
      
      {/* Status Filter */}
      <div className="mb-4 sm:mb-6">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</Label>
        <div className="space-y-1 sm:space-y-2">
          {[
            { value: "active", label: "Actief" },
            { value: "placed", label: "Geplaatst" },
            { value: "inactive", label: "Inactief" },
          ].map((status) => (
            <div key={status.value} className="flex items-center space-x-2">
              <Checkbox
                id={status.value}
                checked={filters.status.includes(status.value)}
                onCheckedChange={(checked) => handleStatusChange(status.value, checked as boolean)}
              />
              <Label htmlFor={status.value} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                {status.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Region Filter */}
      <div className="mb-4 sm:mb-6">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Regio</Label>
        <Select value={filters.region} onValueChange={handleRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Alle regio's" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle regio's</SelectItem>
            <SelectItem value="Noord-Holland">Noord-Holland</SelectItem>
            <SelectItem value="Zuid-Holland">Zuid-Holland</SelectItem>
            <SelectItem value="Utrecht">Utrecht</SelectItem>
            <SelectItem value="Gelderland">Gelderland</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Driving License Filter */}
      <div className="mb-4 sm:mb-6">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rijbewijs</Label>
        <div className="space-y-1 sm:space-y-2 max-h-48 overflow-y-auto">
          {[
            { value: "A", label: "A (Motor)" },
            { value: "AM", label: "AM (Brommer)" },
            { value: "B", label: "B (Auto)" },
            { value: "BE", label: "BE (Auto met aanhanger)" },
            { value: "C", label: "C (Vrachtwagen)" },
            { value: "CE", label: "CE (Vrachtwagen met aanhanger)" },
            { value: "D", label: "D (Bus)" },
            { value: "DE", label: "DE (Bus met aanhanger)" },
            { value: "T", label: "T (Trekker)" },
          ].map((license) => (
            <div key={license.value} className="flex items-center space-x-2">
              <Checkbox
                id={license.value}
                checked={filters.drivingLicense.includes(license.value)}
                onCheckedChange={(checked) => handleDrivingLicenseChange(license.value, checked as boolean)}
              />
              <Label htmlFor={license.value} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                {license.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4 sm:mb-6">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Datum Toegevoegd</Label>
        <div className="space-y-1 sm:space-y-2">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleDateChange("dateFrom", e.target.value)}
            placeholder="Van"
            className="text-xs sm:text-sm"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleDateChange("dateTo", e.target.value)}
            placeholder="Tot"
            className="text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Clear Filters */}
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
  );
}
