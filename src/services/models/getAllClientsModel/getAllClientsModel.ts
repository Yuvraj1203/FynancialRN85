export type GetAllClientsModelItems = {
  name?: string;
  surname?: string;
  userName?: string;
  emailAddress?: string;
  lockoutEndDateUtc?: null;
  phoneNumber?: string;
  profilePictureId?: null;
  isEmailConfirmed?: boolean;
  roles?: null;
  isActive?: boolean;
  creationTime?: string;
  program?: null;
  enrollDate?: null;
  session?: null;
  showStatusName?: null;
  profilePictureURL?: string;
  programTypeID?: number;
  primaryAdvisor?: string;
  userType?: string;
  lastLogin?: string;
  countryCode?: string;
  hasLoggedIn?: boolean;
  assignedTemplates?: number;
  assignedContacts?: number;
  primaryAdvisorContactCount?: number;
  primaryAdvisorprogramCount?: number;
  programName?: string;
  id?: number;
  status?: number;
  statusName?: string;
};

export type GetAllClientsModel = {
  totalCount?: number;
  items?: GetAllClientsModelItems[];
};
