export type ReferralDetailModel = {
  userId?: number;
  referredByUserId?: number;
  referredToUserId?: number;
  referralCode?: string;
  referralStatus?: number;
  referralRemarks?: null;
  referralBonus?: number;
  referredDate?: string;
  referredDateUTC?: string;
  sessionStartDate?: null;
  orderDate?: string;
  payoutMethod?: number;
  payoutDate?: null;
  orderId?: null;
  program?: null;
  session?: null;
  payoutMethodName?: null;
  referralStatusName?: null;
  referredBy?: null;
  referredTo?: string;
  emailReferredBy?: null;
  emailReferredTo?: string;
  lastUpdateDate?: null;
  programTypeID?: number;
  createdFromDateFilter?: null;
  createdToDateFilter?: null;
  phoneNo?: null;
  id?: number;
};

export type GetAllUserReferralsItemsModel = {
  referralDetail?: ReferralDetailModel;
  orderOrderNumber?: null;
};

export type GetAllUserReferralsModel = {
  totalCount?: number;
  items?: GetAllUserReferralsItemsModel[];
};

export interface ReferralDetailModelNew {
  totalCount?: number;
  items?: ReferralDetailItemNew[];
}
export interface ReferralDetailItemNew {
  referredDateUTC?: string;
  referredTo?: string;
  emailReferredBy?: string | null;
  emailReferredTo?: string;
  referredBy?: string | null;
  phoneNo?: string | null;
  role?: string | null;
}
