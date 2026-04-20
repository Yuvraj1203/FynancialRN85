export type GetCurrentStatusModel = {
  userMessageStatus?: UserMessageStatus;
  availabilityStatus?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
  message?: string;
};

export type UserMessageStatus = {
  id?: string;
};
