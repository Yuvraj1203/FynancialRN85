import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {
  Animated,
  ColorValue,
  GestureResponderEvent,
  ImageStyle,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { FAB, Portal } from 'react-native-paper';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FabItems = {
  icon: IconSource;
  label?: string;
  color?: string;
  labelTextColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  containerStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  labelStyle?: StyleProp<TextStyle>;
  labelMaxFontSizeMultiplier?: number;
  onPress: (e: GestureResponderEvent) => void;
  size?: 'small' | 'medium';
  testID?: string;
  rippleColor?: ColorValue;
};

type Props = {
  open?: boolean;
  setOpen: (value: boolean) => void;
  visible?: boolean;
  items?: FabItems[];
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  labelStyle?: StyleProp<TextStyle>;
  FabIcon?: IconSource;
};

const FabGroup = ({ visible = true, ...props }: Props) => {
  const theme = useTheme(); // theme
  const insets = useSafeAreaInsets();

  const styles = makeStyles(theme); // styling

  const actionsWithDefaults = (props.items ?? []).map(item => ({
    ...item,
    labelMaxFontSizeMultiplier: item.labelMaxFontSizeMultiplier ?? 1,
  }));

  return (
    <Portal>
      <FAB.Group
        open={props.open ?? false}
        visible={visible}
        icon={props.FabIcon ? props.FabIcon : props.open ? 'close' : 'plus'}
        style={[
          props.style,
          {
            paddingBottom: insets.bottom + 60,
          },
        ]}
        actions={actionsWithDefaults}
        onStateChange={state => {
          props.setOpen(state.open);
        }}
        onPress={() => {}}
      />
    </Portal>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      // Adjust for tab bar
    },
  });

export default FabGroup;
