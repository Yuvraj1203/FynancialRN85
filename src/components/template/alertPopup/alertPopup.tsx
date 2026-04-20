import {CustomImageProps} from '@/components/atoms/customImage/customImage';
import {CustomPopup} from '@/components/molecules';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet} from 'react-native';

// options for component
type GLobalPopupProps = {
  title?: string;
  msg?: string;
  compact?: boolean;
  dismissOnBackPress?: boolean;
  PositiveText?: string;
  NegativeText?: string;
  onPositivePress?: () => void;
  onNegativePress?: () => void;
  shown?: boolean;
  statusIcon?: CustomImageProps;
};

export let showAlertPopup: (props: GLobalPopupProps) => void;
export let hideAlertPopup: () => void;

function AlertPopup() {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const {t} = useTranslation(); //translation

  const [popupProps, setPopupProps] = useState<GLobalPopupProps>({});

  const [showPopup, setShowPopup] = useState(false); // show global popup

  useEffect(() => {
    showAlertPopup = (props: GLobalPopupProps) => {
      setPopupProps(props);
      setShowPopup(true);
    };

    hideAlertPopup = () => {
      setShowPopup(false);
    };
  }, []);

  return (
    <>
      {popupProps.NegativeText ? (
        <CustomPopup
          shown={showPopup}
          setShown={setShowPopup}
          title={popupProps.title}
          msg={popupProps.msg}
          statusIcon={popupProps.statusIcon}
          compact={popupProps.compact}
          dismissOnBackPress={popupProps.dismissOnBackPress}
          PositiveText={popupProps.PositiveText}
          NegativeText={popupProps.NegativeText}
          onPositivePress={() => {
            setShowPopup(false);
            if (popupProps.onPositivePress) {
              popupProps.onPositivePress();
            }
          }}
          onNegativePress={() => {
            setShowPopup(false);
            if (popupProps.onNegativePress) {
              popupProps.onNegativePress();
            }
          }}
        />
      ) : (
        <CustomPopup
          shown={showPopup}
          setShown={setShowPopup}
          title={popupProps.title}
          msg={popupProps.msg}
          statusIcon={popupProps.statusIcon}
          compact={popupProps.compact}
          dismissOnBackPress={popupProps.dismissOnBackPress}
          PositiveText={popupProps.PositiveText}
          onPositivePress={() => {
            setShowPopup(false);
            if (popupProps.onPositivePress) {
              popupProps.onPositivePress();
            }
          }}
        />
      )}
    </>
  );
}

const makeStyles = (theme: CustomTheme) => StyleSheet.create({});

export default AlertPopup;
