import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { TrajectoryWithRelations } from "@shared/schema";

// Centralized trajectory data formatters to ensure consistency across all components

export const formatTrajectoryTitle = (trajectory: TrajectoryWithRelations): string => {
  const jobTitle = trajectory.jobTitle || "Onbekende functie";
  const candidateName = trajectory.candidate?.name || "Onbekende kandidaat";
  const clientName = trajectory.client?.name || "Onbekende opdrachtgever";
  
  return `${jobTitle} – ${candidateName} bij ${clientName}`;
};

export const formatTrajectoryDate = (date: string | Date | null): string => {
  if (!date) return "Geen datum";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Ongeldige datum";
    return format(dateObj, "d MMM yyyy", { locale: nl });
  } catch (error) {
    return "Ongeldige datum";
  }
};

export const formatTrajectoryStatus = (status: string | null): string => {
  if (!status) return "Onbekend";
  
  const statusLabels = {
    geaccepteerd: "Geaccepteerd",
    voorgesteld_aan_klant: "Voorgesteld aan klant",
    gesprek_met_klant: "Gesprek met klant",
    geplaatst: "Geplaatst",
    niet_geplaatst: "Niet geplaatst",
    gestopt: "Gestopt"
  };
  
  return statusLabels[status as keyof typeof statusLabels] || status;
};

export const getTrajectoryStatusColor = (status: string | null): string => {
  const statusColors = {
    geaccepteerd: "bg-blue-600",
    voorgesteld_aan_klant: "bg-yellow-600",
    gesprek_met_klant: "bg-orange-600",
    geplaatst: "bg-green-600",
    niet_geplaatst: "bg-red-600",
    gestopt: "bg-gray-600"
  };
  
  return statusColors[status?.toLowerCase() as keyof typeof statusColors] || "bg-gray-600";
};

export const formatCandidateName = (trajectory: TrajectoryWithRelations): string => {
  return trajectory.candidate?.name || "Onbekende kandidaat";
};

export const formatClientName = (trajectory: TrajectoryWithRelations): string => {
  return trajectory.client?.name || "Onbekende opdrachtgever";
};

export const formatJobTitle = (trajectory: TrajectoryWithRelations): string => {
  return trajectory.jobTitle || "Onbekende functie";
};

export const formatHourlyRate = (hourlyRate: string | null): string => {
  if (!hourlyRate) return "Niet opgegeven";
  return `€${hourlyRate}`;
};

export const validateTrajectoryData = (trajectory: TrajectoryWithRelations | null): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!trajectory) {
    errors.push("Traject niet gevonden");
    return { isValid: false, errors };
  }
  
  if (!trajectory.id) {
    errors.push("Traject ID ontbreekt");
  }
  
  // For editing, we don't require jobTitle to be present - it can be empty and filled in the form
  // Only check for critical missing data that would prevent loading
  if (!trajectory.candidateId) {
    errors.push("Kandidaat ID ontbreekt");
  }
  
  if (!trajectory.clientId) {
    errors.push("Opdrachtgever ID ontbreekt");
  }
  
  return { isValid: errors.length === 0, errors };
};

// Helper function to get consistent trajectory subtitle for display
export const getTrajectorySubtitle = (trajectory: TrajectoryWithRelations): string => {
  const candidateName = formatCandidateName(trajectory);
  const clientName = formatClientName(trajectory);
  const startDate = formatTrajectoryDate(trajectory.startDate);
  
  return `${candidateName} bij ${clientName} • Start: ${startDate}`;
};

// Candidate status formatters
export const formatCandidateStatus = (status: string | null): string => {
  if (!status) return "Onbekend";
  
  const statusLabels = {
    nieuw: "Nieuw",
    beschikbaar: "Beschikbaar",
    in_bemiddeling: "In bemiddeling",
    werkend: "Werkend",
    nu_niet_beschikbaar: "Nu niet beschikbaar",
    inactief: "Inactief"
  };
  
  return statusLabels[status as keyof typeof statusLabels] || status;
};

export const getCandidateStatusColor = (status: string | null): string => {
  const statusColors = {
    nieuw: "bg-purple-600",
    beschikbaar: "bg-green-600",
    in_bemiddeling: "bg-blue-600",
    werkend: "bg-indigo-600",
    nu_niet_beschikbaar: "bg-orange-600",
    inactief: "bg-gray-600"
  };
  
  return statusColors[status?.toLowerCase() as keyof typeof statusColors] || "bg-gray-600";
};

// Get suggested candidate status based on trajectory status
export const getSuggestedCandidateStatus = (trajectoryStatus: string | null): string => {
  const statusMapping = {
    geaccepteerd: "in_bemiddeling",
    voorgesteld_aan_klant: "in_bemiddeling",
    gesprek_met_klant: "in_bemiddeling",
    geplaatst: "werkend",
    niet_geplaatst: "beschikbaar",
    gestopt: "beschikbaar"
  };
  
  return statusMapping[trajectoryStatus as keyof typeof statusMapping] || "beschikbaar";
};

// Get all candidate status options in order
export const getCandidateStatusOptions = () => [
  { value: "nieuw", label: "Nieuw" },
  { value: "beschikbaar", label: "Beschikbaar" },
  { value: "in_bemiddeling", label: "In bemiddeling" },
  { value: "werkend", label: "Werkend" },
  { value: "nu_niet_beschikbaar", label: "Nu niet beschikbaar" },
  { value: "inactief", label: "Inactief" }
];

// Get all trajectory status options
export const getTrajectoryStatusOptions = () => [
  { value: "geaccepteerd", label: "Geaccepteerd" },
  { value: "voorgesteld_aan_klant", label: "Voorgesteld aan klant" },
  { value: "gesprek_met_klant", label: "Gesprek met klant" },
  { value: "geplaatst", label: "Geplaatst" },
  { value: "niet_geplaatst", label: "Niet geplaatst" },
  { value: "gestopt", label: "Gestopt" }
];