export interface NotificationDeliverySummary {
  readonly jobId: string;
  readonly queued: number;
  readonly delivered: number;
  readonly suppressed: number;
  readonly failed: number;
  readonly read: number;
}
