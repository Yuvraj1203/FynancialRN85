export type TagList = {
  tag?: null;
  id?: number;
  tagName?: string;
  isSelected?: boolean;
  contactCount?: number;
};

export type TagUserList = {
  tagId?: number;
  tagName?: string;
  userTagId?: number;
};

export type SystemTimeZoneList = {
  timeZoneId?: string;
  standardName?: string;
  displayName?: string;
  daylightName?: string;
  baseUtcOffset?: string;
  supportsDaylightSavingTime?: boolean;
  id?: number;
};

export type CountryData = {
  name?: string;
  code?: string;
  isDefault?: boolean;
  flag?: string;
  countryCode?: null;
  id?: number;
};

type CountryList$5 = {
  country?: CountryData;
};

export type GetUserContactInfoModel = {
  emailAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  timeZoneName?: string;
  countryId?: number;
  stateId?: number;
  countryCodeId?: number;
  countryCode?: string;
  stateCode?: string;
  tagList?: Array<TagList>;
  tagUserList?: Array<TagUserList>;
  systemTimeZoneList?: Array<SystemTimeZoneList>;
  countryList?: Array<CountryList$5>;
  fullName?: string;
  fullAddress?: string;
  initials?: string;
  profileImage?: string;
  sourceName?: string;
  fynancialId?: string;
  crmId?: string;
  userStatus?: number;
  contactStatus?: string;
  websiteURL?: string;
};
