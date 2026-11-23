// The inspected ASP.NET Core API serializes these enums as numbers.
export type NotificationTemplate = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type NotificationCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type NotificationAudienceRole = 1 | 2; // Member, Administrator
export type NotificationJobState = 0 | 1 | 2; // Scheduled, Published, Cancelled

export interface NotificationTarget {
  readonly category: NotificationCategory;
  readonly id: string;
}

export interface NotificationAudienceFilter {
  readonly role?: NotificationAudienceRole | null;
  readonly district?: string | null;
  readonly userIds?: readonly string[] | null;
}

export interface NotificationAdminCommand {
  readonly operationId: string;
  readonly template: NotificationTemplate;
  readonly target?: NotificationTarget | null;
  readonly audience: NotificationAudienceFilter;
  readonly sendAtUtc?: string | null;
  // The DTO defines both fields, but the composer rejects non-null values.
  readonly text?: null;
  readonly deepLink?: null;
}

export interface NotificationAdminSendRequest {
  readonly command: NotificationAdminCommand;
  readonly confirmBulk: boolean;
  readonly previewReceiptId?: string | null;
}

export interface NotificationOperationRequest {
  readonly operationId: string;
  // Callers supply the known revision even though the backend model defaults to 1.
  readonly revision: number;
}

export interface NotificationAudiencePreview {
  readonly receiptId: string;
  readonly count: number;
  readonly expiresAtUtc: string;
}

export interface NotificationJobReceipt {
  readonly jobId: string;
  readonly revision: number;
  readonly state: NotificationJobState;
  readonly dueAtUtc: string;
}
