import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Checkbox } from 'react-native-paper';
import CustomText, { TextVariants } from '../customText/customText';
import Tap from '../tap/tap';

export enum CheckBoxModeVariants {
  android = 'android',
  ios = 'ios',
}

export enum CheckBoxStatus {
  checked = 'checked',
  unchecked = 'unchecked',
  indeterminate = 'indeterminate',
}

// options for component
type Props = {
  mode?: CheckBoxModeVariants;
  label?: string;
  disabled?: boolean;
  labelVariant?: TextVariants;
  color?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  onClick?: () => void;
  value?: boolean;
};

function CustomCheckBox({
  labelVariant = TextVariants.bodyLarge,
  disabled = false,
  ...props
}: Props) {
  const theme = useTheme(); //theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const [color, setColor] = useState(
    props.color ? props.color : theme.colors.primary,
  );

  return (
    <>
      {props.label ? (
        <Tap
          style={[styles.checkboxContainer, props.style]}
          onPress={() => (!disabled && props.onClick ? props.onClick() : null)}
        >
          <>
            <CustomText
              style={[styles.flexOne, props.labelStyle]}
              variant={labelVariant}
            >
              {props.label}
            </CustomText>

            <Checkbox.Android
              style={[styles.flexOne, props.labelStyle]}
              disabled={disabled}
              status={
                props.value ? CheckBoxStatus.checked : CheckBoxStatus.unchecked
              }
              color={color}
            />
          </>
        </Tap>
      ) : (
        <Checkbox.Android
          style={[styles.flexOne, props.labelStyle]}
          disabled={disabled}
          status={
            props.value ? CheckBoxStatus.checked : CheckBoxStatus.unchecked
          }
          color={color}
        />
      )}
    </>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    checkboxContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    flexOne: {
      flex: 1,
    },
  });
export default CustomCheckBox;
