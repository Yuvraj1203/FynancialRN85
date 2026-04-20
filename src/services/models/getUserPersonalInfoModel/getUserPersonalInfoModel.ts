export type GetUserPersonalInfoModel = {
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  aboutMe?: string;
  dob?: string | null;
  gender?: number;
  userType?: string;
  isPrimaryCoachAssigned?: boolean;
  fullName?: string;
  initials?: string;
  jobTitle?: string;
  jobTitleId?: number;
  secureUploadURL?: string;
};
