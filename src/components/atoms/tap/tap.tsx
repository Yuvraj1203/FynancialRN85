import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {TouchableRipple} from 'react-native-paper';

// options for component
type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disableRipple?: boolean;
  style?: StyleProp<ViewStyle>;
  onLongPressDelay?: number;
};

function Tap({onLongPressDelay = 300, disableRipple = true, ...props}: Props) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  // only use touchable ripple when onPress is not null
  return props.onPress || props.onLongPress ? (
    <TouchableRipple
      onPress={() => {
        // Vibration.vibrate(Platform.OS == 'ios' ? 100 : 10);
        props.onPress?.();
      }}
      onLongPress={() => {
        //Vibration.vibrate(50);
        props.onLongPress?.();
      }}
      delayLongPress={onLongPressDelay}
      borderless
      rippleColor={
        disableRipple
          ? theme.colors.elevation.level0
          : theme.colors.elevation.level3
      }
      style={[styles.container, props.style]}>
      {props.children}
    </TouchableRipple>
  ) : (
    <View style={[styles.container, props.style]}>{props.children}</View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      padding: 5,
    },
  });

export default Tap;
