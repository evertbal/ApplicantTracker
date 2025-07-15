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
  return status;
};

export const getTrajectoryStatusColor = (status: string | null): string => {
  const statusColors = {
    interview: "bg-blue-600",
    proposed: "bg-yellow-600", 
    placed: "bg-green-600",
    active: "bg-green-600",
    completed: "bg-gray-600",
    cancelled: "bg-red-600",
    pending: "bg-yellow-600"
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
  
  // For form validation, we're being very lenient - just check that we have a trajectory object
  // All other validation will be handled by the form schema and server-side validation
  
  // Only log warnings for debugging, don't treat as validation errors
  if (!trajectory.id) {
    console.warn("Trajectory has no ID:", trajectory);
  }
  
  if (!trajectory.candidateId && trajectory.candidateId !== 0) {
    console.warn("Trajectory has no candidate ID:", trajectory.id);
  }
  
  if (!trajectory.clientId && trajectory.clientId !== 0) {
    console.warn("Trajectory has no client ID:", trajectory.id);
  }
  
  // Always return valid for now - let the form handle the validation
  return { isValid: true, errors };
};

// Helper function to get consistent trajectory subtitle for display
export const getTrajectorySubtitle = (trajectory: TrajectoryWithRelations): string => {
  const candidateName = formatCandidateName(trajectory);
  const clientName = formatClientName(trajectory);
  const startDate = formatTrajectoryDate(trajectory.startDate);
  
  return `${candidateName} bij ${clientName} • Start: ${startDate}`;
};