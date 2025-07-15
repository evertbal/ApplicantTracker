/**
 * Utility for mapping trajectory status to candidate status
 * Based on the ATS business rules mapping
 */

export interface TrajectoryToCandidateMapping {
  trajectoryStatus: string;
  candidateStatus: string;
  candidatePhase?: string;
}

export const TRAJECTORY_TO_CANDIDATE_MAPPING: Record<string, TrajectoryToCandidateMapping> = {
  'Geaccepteerd': {
    trajectoryStatus: 'Geaccepteerd',
    candidateStatus: 'Beschikbaar',
    candidatePhase: 'matching'
  },
  'Voorgesteld aan klant': {
    trajectoryStatus: 'Voorgesteld aan klant',
    candidateStatus: 'In bemiddeling',
    candidatePhase: 'matching'
  },
  'Gesprek met klant': {
    trajectoryStatus: 'Gesprek met klant',
    candidateStatus: 'In bemiddeling',
    candidatePhase: 'matching'
  },
  'Geplaatst': {
    trajectoryStatus: 'Geplaatst',
    candidateStatus: 'Werkend',
    candidatePhase: 'placed'
  },
  'Niet geplaatst': {
    trajectoryStatus: 'Niet geplaatst',
    candidateStatus: 'Nu niet beschikbaar',
    candidatePhase: 'matching'
  },
  'Gestopt': {
    trajectoryStatus: 'Gestopt',
    candidateStatus: 'Inactief',
    candidatePhase: 'intake'
  }
};

/**
 * Maps trajectory status to suggested candidate status
 */
export function mapTrajectoryToCandidateStatus(trajectoryStatus: string): TrajectoryToCandidateMapping | null {
  const mapping = TRAJECTORY_TO_CANDIDATE_MAPPING[trajectoryStatus];
  return mapping || null;
}

/**
 * Gets all valid trajectory statuses
 */
export function getValidTrajectoryStatuses(): string[] {
  return Object.keys(TRAJECTORY_TO_CANDIDATE_MAPPING);
}

/**
 * Gets all valid candidate statuses that can be mapped from trajectory
 */
export function getValidCandidateStatuses(): string[] {
  return Object.values(TRAJECTORY_TO_CANDIDATE_MAPPING).map(m => m.candidateStatus);
}

/**
 * Validates if a trajectory status change requires candidate update
 */
export function requiresCandidateUpdate(oldStatus: string, newStatus: string): boolean {
  const oldMapping = mapTrajectoryToCandidateStatus(oldStatus);
  const newMapping = mapTrajectoryToCandidateStatus(newStatus);
  
  if (!oldMapping || !newMapping) return false;
  
  return oldMapping.candidateStatus !== newMapping.candidateStatus ||
         oldMapping.candidatePhase !== newMapping.candidatePhase;
}

/**
 * Gets the suggested candidate status and phase for a trajectory status
 */
export function getSuggestedCandidateUpdate(trajectoryStatus: string): {
  status: string;
  phase: string;
} | null {
  const mapping = mapTrajectoryToCandidateStatus(trajectoryStatus);
  if (!mapping) return null;
  
  return {
    status: mapping.candidateStatus,
    phase: mapping.candidatePhase || 'matching'
  };
}