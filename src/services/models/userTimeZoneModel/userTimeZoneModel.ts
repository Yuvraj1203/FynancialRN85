export type UserTimeZoneModel = {
  timeZoneId?: string;
  standardName?: string;
  displayName?: string;
  daylightName?: string;
  baseUtcOffset?: string;
  supportsDaylightSavingTime?: boolean;
  id?: number;
  isSelectedTimeZone?: boolean;
};
