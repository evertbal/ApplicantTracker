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
  // Convert status to CSS class format matching the new system
  const statusKey = status?.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  
  const statusColors = {
    'geaccepteerd': "text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-900/20 dark:border-teal-800/50",
    'voorgesteld-aan-klant': "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800/50",
    'gesprek-met-klant': "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-800/50",
    'geplaatst': "text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700/50",
    'niet-geplaatst': "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50",
    'gestopt': "text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-300 dark:bg-gray-800/70 dark:border-gray-600/50"
  };
  
  return statusColors[statusKey as keyof typeof statusColors] || "text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-900/20 dark:border-teal-800/50";
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
  
  return `${candidateName} bij ${clientName}`;
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