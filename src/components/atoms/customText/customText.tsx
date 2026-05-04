import { useTheme } from '@/theme/themeProvider/paperTheme';
import { ColorValue, StyleProp, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';

export enum TextVariants {
  displayLarge = 'displayLarge',
  displayMedium = 'displayMedium',
  displaySmall = 'displaySmall',

  headlineLarge = 'headlineLarge',
  headlineMedium = 'headlineMedium',
  headlineSmall = 'headlineSmall',

  titleLarge = 'titleLarge',
  titleMedium = 'titleMedium',
  titleSmall = 'titleSmall',

  labelLarge = 'labelLarge',
  labelMedium = 'labelMedium',
  labelSmall = 'labelSmall',

  bodyLarge = 'bodyLarge',
  bodyMedium = 'bodyMedium',
  bodySmall = 'bodySmall',
}

export enum TextEllipsis {
  head = 'head',
  middle = 'middle',
  tail = 'tail',
  clip = 'clip',
}

// options for component
type Props = {
  children: React.ReactNode;
  variant?: TextVariants;
  color?: ColorValue;
  maxLines?: number;
  ellipsis?: TextEllipsis;
  selectable?: boolean;
  allowFontScaling?: boolean;
  allowAdjustsFontSizeToFit?: boolean;
  maxFontSizeMultiplier?: number;
  style?: StyleProp<TextStyle>;
};

function CustomText({
  variant = TextVariants.bodyMedium,
  allowFontScaling = false,
  allowAdjustsFontSizeToFit = false,

  ...props
}: Props) {
  const theme = useTheme(); //theme

  return (
    <Text
      adjustsFontSizeToFit={allowAdjustsFontSizeToFit}
      variant={variant}
      allowFontScaling={allowFontScaling}
      style={[
        {
          color: props.color ? props.color : theme.colors.onSurfaceVariant,
        },
        props.style,
      ]}
      selectable={props.selectable}
      numberOfLines={props.maxLines}
      ellipsizeMode={props.ellipsis}
      maxFontSizeMultiplier={props.maxFontSizeMultiplier}
    >
      {props.children}
    </Text>
  );
}

export default CustomText;
