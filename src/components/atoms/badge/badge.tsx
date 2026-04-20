import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import CustomText, {TextVariants} from '../customText/customText';

type Props = {
  value?: string | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

function Badge(props: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const {value, style} = props;

  if (value == undefined) {
    return <></>;
  }

  if (value === '') {
    // Render a small dot
    return <View style={[styles.dot, style]} />;
  }

  const text = String(value);
  const isLong = text.length > 2;

  return (
    <View style={[styles.badge, isLong ? styles.pill : styles.round, style]}>
      <CustomText
        maxFontSizeMultiplier={1.1}
        variant={TextVariants.labelSmall}
        style={styles.text}>
        {text}
      </CustomText>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    badge: {
      height: 16,
      minWidth: 16,
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    round: {
      borderRadius: 8,
    },
    pill: {
      borderRadius: theme.roundness,
      paddingHorizontal: 10,
    },
    text: {
      color: theme.colors.surface,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.error,
    },
  });

export default Badge;
