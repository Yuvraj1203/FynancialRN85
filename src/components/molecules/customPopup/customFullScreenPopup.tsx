import { SafeScreen } from '@/components/template';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { handlePopupDismiss } from '@/utils/utils';
import { useTranslation } from 'react-i18next';
import { Modal, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

// options for component
type Props = {
  children: React.ReactNode;
  shown: boolean;
  setShown: (value: boolean) => void;
  transparentBg?: boolean;
  dismissOnBackPress?: boolean;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
};

function CustomFullScreenPopup({
  dismissOnBackPress = true,
  transparentBg = false,
  ...props
}: Props) {
  const theme = useTheme(); // theme

  const safeAreaInsets = useSafeAreaInsets();

  const styles = makeStyles(theme, safeAreaInsets); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  /** added by @YUvraj 10-10-2025 --> dismiss the popup when security minimize popup shows */
  handlePopupDismiss(props.shown, () =>
    props.setShown ? props.setShown(false) : undefined,
  );

  return (
    <Portal>
      <Modal
        visible={props.shown}
        transparent={true}
        onRequestClose={() => {
          if (dismissOnBackPress) {
            props.setShown(false);
            if (props.onClose) {
              props.onClose();
            }
          }
        }}
      >
        <Animated.View
          entering={FadeIn.springify()}
          exiting={FadeOut.springify()}
          style={styles.container}
        >
          <SafeScreen style={transparentBg ? styles.transparentBg : undefined}>
            {props.children}
          </SafeScreen>
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const makeStyles = (theme: CustomTheme, safeAreaInsets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      flex: 1,
      justifyContent: 'center',
      paddingTop: safeAreaInsets.top,
      paddingBottom: safeAreaInsets.bottom,
    },
    transparentBg: {
      backgroundColor: 'transparent',
      paddingTop: safeAreaInsets.top,
      paddingBottom: safeAreaInsets.bottom,
    },
  });

export default CustomFullScreenPopup;
