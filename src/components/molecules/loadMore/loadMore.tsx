import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {ActivityIndicator} from 'react-native-paper';

type Props = {
  style?: StyleProp<ViewStyle>;
};

const LoadMore = (props: Props) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling

  return <ActivityIndicator style={[styles.loadMore, props.style]} />;
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    loadMore: {padding: 20},
  });

export default LoadMore;
