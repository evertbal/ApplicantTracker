import {
  mapTrajectoryToCandidateStatus,
  getValidTrajectoryStatuses,
  getValidCandidateStatuses,
  requiresCandidateUpdate,
  getSuggestedCandidateUpdate,
  TRAJECTORY_TO_CANDIDATE_MAPPING
} from '../mapTrajectoryToCandidateStatus';

describe('mapTrajectoryToCandidateStatus', () => {
  describe('mapTrajectoryToCandidateStatus', () => {
    it('should map accepted trajectory to available candidate', () => {
      const result = mapTrajectoryToCandidateStatus('accepted');
      expect(result).toEqual({
        trajectoryStatus: 'accepted',
        candidateStatus: 'available',
        candidatePhase: 'matching'
      });
    });

    it('should map proposed trajectory to in_mediation candidate', () => {
      const result = mapTrajectoryToCandidateStatus('proposed');
      expect(result).toEqual({
        trajectoryStatus: 'proposed',
        candidateStatus: 'in_mediation',
        candidatePhase: 'matching'
      });
    });

    it('should map interview trajectory to in_mediation candidate', () => {
      const result = mapTrajectoryToCandidateStatus('interview');
      expect(result).toEqual({
        trajectoryStatus: 'interview',
        candidateStatus: 'in_mediation',
        candidatePhase: 'matching'
      });
    });

    it('should map placed trajectory to working candidate', () => {
      const result = mapTrajectoryToCandidateStatus('placed');
      expect(result).toEqual({
        trajectoryStatus: 'placed',
        candidateStatus: 'working',
        candidatePhase: 'placed'
      });
    });

    it('should map not_placed trajectory to not_available_now candidate', () => {
      const result = mapTrajectoryToCandidateStatus('not_placed');
      expect(result).toEqual({
        trajectoryStatus: 'not_placed',
        candidateStatus: 'not_available_now',
        candidatePhase: 'matching'
      });
    });

    it('should map stopped trajectory to inactive candidate', () => {
      const result = mapTrajectoryToCandidateStatus('stopped');
      expect(result).toEqual({
        trajectoryStatus: 'stopped',
        candidateStatus: 'inactive',
        candidatePhase: 'intake'
      });
    });

    it('should return null for invalid trajectory status', () => {
      const result = mapTrajectoryToCandidateStatus('invalid_status');
      expect(result).toBeNull();
    });
  });

  describe('getValidTrajectoryStatuses', () => {
    it('should return all valid trajectory statuses', () => {
      const statuses = getValidTrajectoryStatuses();
      expect(statuses).toEqual([
        'accepted',
        'proposed',
        'interview',
        'placed',
        'not_placed',
        'stopped'
      ]);
    });
  });

  describe('getValidCandidateStatuses', () => {
    it('should return all valid candidate statuses', () => {
      const statuses = getValidCandidateStatuses();
      expect(statuses).toEqual([
        'available',
        'in_mediation',
        'in_mediation',
        'working',
        'not_available_now',
        'inactive'
      ]);
    });
  });

  describe('requiresCandidateUpdate', () => {
    it('should return true when candidate status changes', () => {
      const result = requiresCandidateUpdate('accepted', 'placed');
      expect(result).toBe(true);
    });

    it('should return true when candidate phase changes', () => {
      const result = requiresCandidateUpdate('proposed', 'placed');
      expect(result).toBe(true);
    });

    it('should return false when status and phase remain the same', () => {
      const result = requiresCandidateUpdate('proposed', 'interview');
      expect(result).toBe(false);
    });

    it('should return false for invalid statuses', () => {
      const result = requiresCandidateUpdate('invalid', 'placed');
      expect(result).toBe(false);
    });
  });

  describe('getSuggestedCandidateUpdate', () => {
    it('should return suggested status and phase for valid trajectory status', () => {
      const result = getSuggestedCandidateUpdate('placed');
      expect(result).toEqual({
        status: 'working',
        phase: 'placed'
      });
    });

    it('should return null for invalid trajectory status', () => {
      const result = getSuggestedCandidateUpdate('invalid_status');
      expect(result).toBeNull();
    });
  });
});