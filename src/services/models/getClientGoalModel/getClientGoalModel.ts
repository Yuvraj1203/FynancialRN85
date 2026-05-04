export type GetClientGoalsModel = {
  goals?: goals[];
  appDate?: string;
  status?: number;
  message?: string;
};

export type goals = {
  goalName?: string;
  currentAmount?: number;
  targetAmount?: number;
  status?: string;
  percentage?: number;
};
