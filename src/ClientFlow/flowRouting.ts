export type ClientFlowView =
  | 'callDetails'
  | 'assignTeam';

export const isPreProductionPhase = (currentPhase?: string | null) =>
  currentPhase === 'pre_production';

export const resolveClientFlowView = (
  currentStage?: string | null
): ClientFlowView => {
  switch (currentStage) {
    case 'creative_confirmation':
      return 'callDetails';
    case 'creative_planning':
    case 'team_assignment':
    case 'completed_assign_team':
      return 'assignTeam';
    default:
      return 'callDetails';
  }
};
