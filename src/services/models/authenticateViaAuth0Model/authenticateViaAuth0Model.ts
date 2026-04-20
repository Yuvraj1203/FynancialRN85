export type AuthenticateViaAuth0Model = {
  accessToken?: string;
  encryptedAccessToken?: string;
  expireInSeconds?: number;
  waitingForActivation?: boolean;
  returnUrl?: string;
  refreshToken?: string;
  refreshTokenExpireInSeconds?: number;
  userId?: number;
};
