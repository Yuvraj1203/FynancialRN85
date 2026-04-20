import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {ActivityIndicator} from 'react-native-paper';

// options for component
type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function LoadingView(props: Props) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  // only use touchable ripple when onPress is not null
  return props.children ? (
    <View style={styles.loadingContainer}>{props.children}</View>
  ) : (
    <View style={styles.loadingContainer}>
      <ActivityIndicator />
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    loadingContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.gradientColorLevel2,
    },
  });

export default LoadingView;
