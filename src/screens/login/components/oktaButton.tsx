import { CustomButton } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = {
  loading?: boolean;
  onPress?: () => void;
};

function OktaButton(props: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const { t } = useTranslation();

  return (
    <View style={styles.advisorLay}>
      <CustomButton
        style={styles.loginBtn}
        loading={props.loading}
        icon={{ source: Images.aboutMe, type: ImageType.svg }}
        onPress={props.onPress}
      >
        {t('AdvisorLogin')}
      </CustomButton>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    advisorLay: {
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      marginTop: 30,
    },
    loginBtn: {
      marginTop: 5,
    },
  });

export default OktaButton;
