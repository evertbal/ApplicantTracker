import { useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CollapsibleFiltersProps {
  statusOptions: string[];
  regionOptions: string[];
  licenseOptions: string[];
  selectedStatuses: string[];
  selectedRegion: string;
  selectedLicenses: string[];
  onStatusChange: (statuses: string[]) => void;
  onRegionChange: (region: string) => void;
  onLicenseChange: (licenses: string[]) => void;
  activeFiltersCount: number;
}

export default function CollapsibleFilters({
  statusOptions,
  regionOptions,
  licenseOptions,
  selectedStatuses,
  selectedRegion,
  selectedLicenses,
  onStatusChange,
  onRegionChange,
  onLicenseChange,
  activeFiltersCount,
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {/* Collapsible Filter Panel */}
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {statusOptions.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onStatusChange([...selectedStatuses, status]);
                        } else {
                          onStatusChange(selectedStatuses.filter(s => s !== status));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="text-sm capitalize cursor-pointer"
                    >
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Region Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Regio</Label>
              <Select value={selectedRegion} onValueChange={onRegionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer regio" />
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rijbewijs</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {licenseOptions.map((license) => (
                  <div key={license} className="flex items-center space-x-2">
                    <Checkbox
                      id={`license-${license}`}
                      checked={selectedLicenses.includes(license)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onLicenseChange([...selectedLicenses, license]);
                        } else {
                          onLicenseChange(selectedLicenses.filter(l => l !== license));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`license-${license}`}
                      className="text-sm cursor-pointer font-mono"
                    >
                      {license}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onStatusChange([]);
                  onRegionChange("");
                  onLicenseChange([]);
                }}
                className="w-full"
              >
                Filters wissen
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}