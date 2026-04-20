import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Tap from '../tap/tap';

type Props = {
  children: React.ReactNode;
  elevation?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disableRipple?: boolean;
  tapStyle?: StyleProp<ViewStyle>;
};

/**
 * Added by @Yuvraj 12-02-2025 -> Component to display a view with a shadow effect
 *
 * A customizable component that applies a shadow effect to its content, with configurable
 * elevation, additional styles, and press/long press interactions. This component supports
 * custom elevation levels and handles ripple effects when the user interacts with it.
 *
 * @param {Object} props - The props for the Shadow component.
 * @param {React.ReactNode} props.children - The nested UI components to be displayed inside the Shadow component.
 * @param {number} [props.elevation=5] - The elevation level for the shadow effect (default is 5).
 * @param {StyleProp<ViewStyle>} [props.style] - Additional styles for the container.
 * @param {() => void} [props.onPress] - Callback function triggered when the component is pressed.
 * @param {() => void} [props.onLongPress] - Callback function triggered when the component is long-pressed.
 * @param {boolean} [props.disableRipple=false] - Flag to disable the ripple effect on press (default is false).
 *
 * @returns {JSX.Element} The Shadow component with the specified styles and interactions.
 */
function Shadow({elevation = 3, ...props}: Props) {
  const theme = useTheme(); // Access the custom theme
  const styles = makeStyles(theme, elevation); // Generate styles with the theme

  return props.onPress ? (
    <Tap
      onPress={props.onPress}
      style={props.tapStyle}
      onLongPress={props.onLongPress}
      disableRipple={props.disableRipple}>
      <View style={[styles.container, props.style]}>{props.children}</View>
    </Tap>
  ) : (
    <View style={[styles.container, props.style]}>{props.children}</View>
  );
}

const makeStyles = (theme: CustomTheme, elevation: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface, // Background color from the theme
      borderRadius: theme.roundness, // Rounded corners (optional)
      padding: 14, // Default padding
      shadowColor: theme.colors.onSurfaceVariant, // Use shadow color from the theme
      shadowOffset: {width: 0, height: elevation / 2},
      shadowOpacity: 0.3,
      shadowRadius: elevation,
      elevation, // For Android shadow effect
    },
  });

export default Shadow;
