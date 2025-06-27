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
    interview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    proposed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
    placed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  };
  
  return statusColors[status?.toLowerCase() as keyof typeof statusColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
  
  if (!trajectory.jobTitle) {
    errors.push("Functietitel ontbreekt");
  }
  
  if (!trajectory.candidate) {
    errors.push("Kandidaat informatie ontbreekt");
  }
  
  if (!trajectory.client) {
    errors.push("Opdrachtgever informatie ontbreekt");
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