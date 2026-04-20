export type GetUserDetailForProfileModel = {
  email?: string;
  roleName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  phone?: string;
  phoneNumber?: string;
  dob?: string;
  timeZoneName?: string;
  countryID?: number;
  stateID?: number;
  userID?: number;
  address?: string;
  aboutMe?: string;
  iFrameList?: string[];
  isOnboardingComplete?: boolean;
  profileImageUrl?: string;
  referralCode?: string;
  customerID?: string;
  isAgreementComplete?: boolean;
  imageDataID?: number;
  isTenant?: boolean;
  isActive?: boolean;
  isEmailConfirmed?: boolean;
  userName?: string;
  tenantId?: number;
  emailAddressForDisplay?: string;
  zipCode?: string;
  isEmoneyEnabled?: boolean;
  emoneyId?: string;
  isBlackDiamondEnabled?: boolean;
  blackDiamondId?: string;
  isAddeparEnabled?: boolean;
  addeparId?: string;
  isNitrogenEnabled?: boolean;
  nitrogenId?: string;
  isTamaracEnabled?: boolean;
  clientTamaracId?: number;
  clientTamaracHouseholdId?: number;
  orionId?: string;
  isOrionEnabled?: boolean;
  zoomConnected?: boolean;
  zoomAccessToken?: string;
  countryCodeID?: number;
  addressLine2?: string;
  preferredName?: string;
  calenderLink?: string;
  isEmoneySSOLogon?: boolean;
  isInvitedIntoTemplate?: boolean;
  inviteLoadingMsg?: string;
  totalUnread?: number;
  isReferralAllowed?: boolean;
  loginWith?: LoginWith;
  isOnboarding?: boolean;
  notificationCount?: number;
  hasNewFeed?: boolean;
  isAdvisor?: boolean;
  restrictLogin?: boolean;
  chacheChatImagesCreationTime?: string;
  IsOnboardingComplete?: boolean;
  messageCount?: number;
  shouldChangePasswordOnNextLogin?: boolean;
  role?: string;
  accountsPermission?: AccountsPermissionModel;
};

export enum LoginWith {
  auth0 = 'auth0',
  okta = 'okta',
  oktaWithAuth0 = 'oktaWithAuth0',
  multiTenant = 'multiTenant',
}

export type AccountsPermissionModel = {
  canAccessAccountsView?: boolean;
  canAccessAccountTransactions?: boolean;
  canAccessAccountHoldings?: boolean;
};

export enum UserRoleEnum {
  Customer = 'Customer',
  Lead = 'Lead',
  Prospect = 'Prospect',
  Client = 'Client',
  Admin = 'Admin',
  Advisor = 'Advisor',
  Coach = 'Coach',
  OfficeAdmin = 'OfficeAdmin',
  Marketing = 'Marketing',
  Compliance = 'Compliance',
  Operations = 'Operations',
  SupportStaff = 'SupportStaff',
  ContentEditor = 'ContentEditor',
  OfficeAdminSpace = 'Office Admin',
  SupportStaffSpace = 'Support Staff',
}
