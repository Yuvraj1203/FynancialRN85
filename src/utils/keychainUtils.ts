import { Credentials } from 'react-native-auth0';
import Log from './logger';

import Keychain from 'react-native-keychain';

export type UserCred = Credentials & {
  loggedIn?: boolean;
};

// Function to save credentials with biometric protection
export const saveAccessTokenInKeychain = async (password: string) => {
  try {
    await Keychain.setGenericPassword('accessToken', password, {
      service: 'accessToken',
    });
  } catch (error) {
    Log('Error saving credentials:' + error);
  }
};

// Function to retrieve credentials with biometric authentication
export const getAccessTokenFromKeychain = async () => {
  try {
    return Keychain.getGenericPassword({
      service: 'accessToken',
    })
      .then(credentials => {
        if (credentials) {
          const token = credentials;
          const tok: UserCred = JSON.parse(token.password);
          return tok;
        } else {
          Log('Error retrieving credentials else case:' + credentials);
          return undefined;
        }
      })
      .catch(error => {
        Log('Error retrieving credentials catch:' + error);
        return undefined;
      });
  } catch (error) {
    Log('Error retrieving credentials:' + error);
    return undefined;
  }
};

export const resetAccessToken = async () => {
  try {
    await Keychain.resetGenericPassword({
      service: 'accessToken',
    });
  } catch (error) {
    Log('Error reseting credentials:' + error);
  }
};
