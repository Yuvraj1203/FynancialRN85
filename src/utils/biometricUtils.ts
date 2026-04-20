import {
  authenticateWithOptions,
  isSensorAvailable,
} from '@sbaiahmed1/react-native-biometrics';
import { t } from 'i18next';
import { Platform } from 'react-native';
import Log from './logger';

type Props = {
  withPasscode?: boolean;
  onDone: (value: boolean) => void;
};

/* If Biometric exist on user device START */
export const biometricExist = async () => {
  const resultObject = await isSensorAvailable();
  const { available, biometryType } = resultObject;

  if (
    available &&
    (biometryType === 'TouchID' ||
      biometryType === 'FaceID' ||
      biometryType === 'Biometrics')
  ) {
    return biometryType;
  } else {
    return false;
  }
};
/* If Biometric exist on user device END */

/* Authenticate user for biometric START */
export const checkBiometric = ({ withPasscode = true, ...props }: Props) => {
  isSensorAvailable().then(resultObject => {
    const { available, biometryType } = resultObject;

    var biometricSupported = false;
    var msg = 'Authenticate';
    Log(
      'Biometric Available=>' + available + ' biometricType=>' + biometryType,
    );
    if (Platform.OS === 'ios') {
      if (available && biometryType === 'TouchID') {
        biometricSupported = true;
        msg = t('TouchId');
      } else if (available && biometryType === 'FaceID') {
        biometricSupported = true;
        msg = t('FaceId');
      } else {
        biometricSupported = false;
      }
    } else if (Platform.OS === 'android') {
      if (available && biometryType === 'Biometrics') {
        biometricSupported = true;
        msg = t('Fingerprint');
      } else {
        biometricSupported = false;
      }
    }

    if (biometricSupported) {
      Log('biometricSupported=>');

      authenticateWithOptions({
        title: msg,
        //description: msg,
        allowDeviceCredentials: withPasscode,
        disableDeviceFallback: !withPasscode,
        fallbackLabel: t('EnterPasscodeToProceed'),
      })
        .then(resultObject => {
          const { success } = resultObject;

          if (success) {
            Log('successful biometrics provided');
            props.onDone(true);
          } else {
            Log('user cancelled biometric prompt');
            props.onDone(false); // proceed when user denies biometric
          }
        })
        .catch(() => {
          Log('biometrics failed');
          props.onDone(false); // proceed when user denies biometric
        });
    } else {
      Log('biometricSupported=> false');
      props.onDone(false); // proceed when user denies biometric
    }
  });
};
/* Authenticate user for biometric END */
