import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

export let showLoader: () => void;

export let hideLoader: () => void;

type Props = {
  title?: string;
  msg?: string;
};

function Loader(props: Props) {
  const theme = useTheme(); // theme
  const styles = makeStyles(theme); // access StylesSheet with theme implemented
  const { t } = useTranslation(); //translation

  const [showPopup, setShowPopup] = useState(false); // show global popup

  useEffect(() => {
    showLoader = () => {
      setShowPopup(true);
    };

    hideLoader = () => {
      setTimeout(() => {
        setShowPopup(false);
      }, 100);
    };
  }, []);

  /** added by @YUvraj 10-10-2025 --> dismiss the popup when security minimize popup shows */
  //handlePopupDismiss(showPopup, () => setShowPopup(false));

  return (
    <Portal>
      <Modal visible={showPopup} transparent={true}>
        <View style={styles.background}>
          <View style={styles.cardContent}>
            <ActivityIndicator />
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderColor: theme.colors.primary,
      borderTopWidth: 0.3,
      borderLeftWidth: 0.3,
      borderRightWidth: 0.3,
      marginBottom: -5,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    cardContent: {
      alignSelf: 'center',
      backgroundColor: theme.colors.surface,
      padding: 10,
      borderRadius: theme.roundness,
    },
    background: {
      backgroundColor: theme.colors.popupBg,
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
    },
    loaderView: {
      marginHorizontal: 20,
    },
    loaderMsg: {
      marginTop: 5,
    },
  });

export default Loader;
