// Reported, Verified, Resolved, Expired, serialized as numbers by ASP.NET Core.
export type HazardStatus = 1 | 2 | 3 | 4;

export interface ResolveTripHazardRequest {
  readonly reason: string;
}

export interface HazardWarningDto {
  readonly hazardId: string;
  readonly status: HazardStatus;
  readonly isVerified: boolean;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly description: string | null;
  readonly hasPhotoEvidence: boolean;
  readonly photoCapturedAtUtc: string;
  readonly reportedAtUtc: string;
  readonly expiresAtUtc: string;
  readonly verifiedAtUtc: string | null;
  readonly resolvedAtUtc: string | null;
}
