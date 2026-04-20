export type GetUserActiveTemplateModel = {
  groupID?: string;
  programSessionID?: string;
  programID?: string;
  startDate?: string;
  endDate?: string;
  programTypeID?: number;
  programName?: string;
  sessionName?: string;
};

export type GetActiveSessionDetailForUser = {
  programId?: string;
  programSessionID?: string;
  groupId?: string;
  programName?: string;
  userId?: number;
  startDate?: string;
};

export type ActiveSessionDetailForUser = {
  getActiveSessionDetailForUser?: GetActiveSessionDetailForUser[];
  status?: number;
  message?: string;
};
