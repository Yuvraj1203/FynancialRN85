export type UpdateLastSignInForUserModel = {
  isInvitedIntoTemplate?: boolean;
  restrictLogin?: boolean;
  isOnboardingComplete?: boolean; //added by Shivang for First login TimeZone Capture
  status?: number;
  message?: string;
};
