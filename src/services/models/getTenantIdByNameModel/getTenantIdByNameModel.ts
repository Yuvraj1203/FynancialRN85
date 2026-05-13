export type GetTenantIdByNameModel = {
  tenantId?: string;
  tenancyName?: string;
  tenantName?: string;
  tenantURL?: string;
  isAuth0Enable?: boolean;
  isOktaEnabled?: boolean;
  allowCommunityTemplateCreation?: boolean;
  secureFilesAdminAccess?: boolean;
  secureFilesAdvisorAccess?: boolean;
  secureFilesContactAccess?: boolean;
  secureFilesContactUpload?: boolean;
  useManagedPackage?: boolean;
  isSessionTimeoutAllowed?: boolean;
  sessionTimeoutNotifBody?: string;
};
