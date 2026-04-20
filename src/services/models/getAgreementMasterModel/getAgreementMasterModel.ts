export type GetAgreementMasterModel = {
  agreementMaster?: AgreementMaster;
};

export type AgreementMaster = {
  agreementUserType?: number;
  title?: string;
  content?: string;
  requireConsent?: boolean;
  requireConsentAgain?: boolean;
  id?: string;
  iFrameList?: string[];
};
