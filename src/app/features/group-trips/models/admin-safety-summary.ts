// ASP.NET Core uses numeric JSON values for these enums in the inspected API.
export type TripDraftStatus = 0 | 1; // Draft, Cancelled
export type LiveTripStatus = 1 | 2 | 3; // Active, Paused, Finished
export type HazardStatus = 1 | 2 | 3 | 4; // Reported, Verified, Resolved, Expired

export interface AdminSafetyTarget {
  readonly tripPlanId: string;
  readonly sessionId: string;
}

export interface AdminSafetyHazard {
  readonly status: HazardStatus;
  readonly photoCapturedAtUtc: string;
  readonly expiresAtUtc: string;
}

export interface AdminSafetySummary {
  readonly target: AdminSafetyTarget;
  readonly tripStatus: TripDraftStatus;
  readonly sessionStatus: LiveTripStatus;
  readonly activeParticipantCount: number | null;
  readonly hazards: readonly AdminSafetyHazard[] | null;
  readonly activeSeparationCount: number | null;
  readonly checkedInParticipantCount: number | null;
}
