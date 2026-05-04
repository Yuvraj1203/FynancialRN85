import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { hideKeyboard } from '@/utils/utils';
import { useMemo } from 'react';
import {
  GestureResponderEvent,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Button } from 'react-native-paper';
import CustomImage, {
  ImageType,
  ResizeModeType,
} from '../customImage/customImage';

export enum ButtonVariants {
  text = 'text',
  outlined = 'outlined',
  contained = 'contained',
  elevated = 'elevated',
  containedTonal = 'contained-tonal',
}

export enum Direction {
  left = 'left',
  right = 'right',
}

export type ButtonIcon = {
  color?: string;
  source?: ImageSourcePropType;
  type?: ImageType;
  resizeMode?: ResizeModeType;
  direction?: Direction;
};

// options for component
type Props = {
  children: React.ReactNode;
  mode?: ButtonVariants;
  color?: string;
  textColor?: string;
  loading?: boolean;
  icon?: ButtonIcon;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

function CustomButton(props: Props) {
  const theme = useTheme(); //theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  // handle on press event on button
  const handlePress = (e: GestureResponderEvent) => {
    // hide keyboard if keyboard is visible
    hideKeyboard();

    if (props.loading) return; // Prevent press if already loading

    // call the onPressButton function
    if (props.onPress) {
      props.onPress(e);
    }
  };
  const textColor = () => {
    return props.textColor
      ? props.textColor
      : props.mode
      ? props.mode == ButtonVariants.outlined
        ? theme.colors.onSurfaceVariant
        : theme.colors.surface
      : theme.colors.surface;
  };

  const memoizedIcon = useMemo(() => {
    if (!props.icon) return undefined;
    return ({ size, color }: { size: number; color: string }) => (
      <View style={{ height: size, width: size }}>
        <CustomImage
          source={props.icon?.source}
          type={props.icon?.type}
          style={{ height: size, width: size }}
          color={color}
        />
      </View>
    );
  }, [props.icon]);

  return (
    <Button
      mode={props.mode ? props.mode : ButtonVariants.contained}
      onPress={handlePress}
      labelStyle={props.textStyle}
      textColor={textColor()}
      buttonColor={props.color}
      loading={props.loading}
      style={[styles.button, props.style]}
      contentStyle={[
        props.contentStyle,
        {
          flexDirection:
            props.icon?.direction == Direction.right ? 'row-reverse' : 'row',
        },
      ]}
      maxFontSizeMultiplier={1}
      icon={memoizedIcon}
    >
      {props.children}
    </Button>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    button: {
      borderRadius: theme.roundness,
    },
  });
export default CustomButton;
