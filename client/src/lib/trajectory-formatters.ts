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

// Candidate phase formatters
export const formatCandidatePhase = (phase: string | null): string => {
  if (!phase) return "Onbekend";

  const phaseLabels = {
    intake: "Intake",
    matching: "Matching",
    placed: "Geplaatst",
  };

  return phaseLabels[phase as keyof typeof phaseLabels] || phase;
};

export const getCandidatePhaseColor = (phase: string | null): string => {
  const phaseColors = {
    intake: "bg-purple-600",
    matching: "bg-amber-600",
    placed: "bg-green-600",
  };

  return phaseColors[phase?.toLowerCase() as keyof typeof phaseColors] || "bg-gray-600";
};

// Get suggested candidate phase based on trajectory status
export const getSuggestedCandidatePhase = (trajectoryStatus: string | null): string => {
  const phaseMapping = {
    geaccepteerd: "matching",
    voorgesteld_aan_klant: "matching",
    gesprek_met_klant: "matching",
    geplaatst: "placed",
    niet_geplaatst: "intake",
    gestopt: "intake",
  };

  return phaseMapping[trajectoryStatus as keyof typeof phaseMapping] || "intake";
};

// Get all candidate phase options in order
export const getCandidatePhaseOptions = () => [
  { value: "intake", label: "Intake" },
  { value: "matching", label: "Matching" },
  { value: "placed", label: "Geplaatst" },
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