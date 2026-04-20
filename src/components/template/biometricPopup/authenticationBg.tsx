import { CustomImage } from '@/components/atoms';
import { ResizeModeType } from '@/components/atoms/customImage/customImage';
import { biometricStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';
import SafeScreen from '../safeScreen/safeScreen';

/**
 * Added by @Tarun 05-02-2025 -> Biometric Authentication popup and session out popup (FYN-4204)
 */
function AuthenticationBg() {
  /** Added by @Tarun 05-02-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4204) */
  const theme = useTheme();

  /** Added by @Tarun 05-02-2025 -> access StylesSheet with theme implemented (FYN-4204) */
  const styles = makeStyles(theme);

  /** Added by @Tarun 05-02-2025 -> translations for labels (FYN-4204) */
  const { t } = useTranslation();

  const showBiometricBgPopup = biometricStore(
    state => state.showBiometricBgPopup,
  );

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (showBiometricBgPopup) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [showBiometricBgPopup]);

  return (
    <Portal>
      <Modal
        visible={show}
        transparent={true}
        onRequestClose={() => {}}
        animationType="fade"
      >
        <SafeScreen>
          <View style={styles.container}>
            <CustomImage
              source={Images.appBanner}
              style={styles.splashImage}
              resizeMode={ResizeModeType.contain}
            />
          </View>
        </SafeScreen>
      </Modal>
    </Portal>
  );
}

const { width, height } = Dimensions.get('window');

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    splashImage: {
      width: width * 0.5, // Adjust the size as needed
      height: height * 0.5, // Adjust the size as needed
    },
  });

export default AuthenticationBg;
