import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import type { ReactNode } from 'react';
import { StatusBar, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  top?: boolean;
  bottom?: boolean;
};

function SafeScreen({ top = true, bottom = true, ...props }: Props) {
  const theme = useTheme(); // theme
  const insets = useSafeAreaInsets(); // Handle status/navigation bar safely
  const styles = makeStyles(theme, insets); // access StylesSheet with theme implemented

  const edges: Array<'top' | 'bottom' | 'left' | 'right'> = ['left', 'right'];
  if (top) edges.push('top');
  if (bottom) edges.push('bottom');

  return (
    <SafeAreaView style={[styles.container, props.style]} edges={edges}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      {props.children}
    </SafeAreaView>
  );
}

const makeStyles = (
  theme: CustomTheme,
  insets: { top: number; bottom: number },
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      // paddingTop: insets.top,
      // paddingBottom: insets.bottom,
    },
  });
export default SafeScreen;
