import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { Control, Controller } from 'react-hook-form';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Checkbox, HelperText } from 'react-native-paper';
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
  control?: Control<any>;
  name: string;
  mode?: CheckBoxModeVariants;
  label?: string;
  disabled?: boolean;
  labelVariant?: TextVariants;
  color?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

function CustomFormCheckBox(props: Props) {
  const theme = useTheme(); //theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  return (
    <Controller
      control={props.control}
      name={props.name}
      rules={{ required: true }} // Add rules here
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={props.style}>
          <Tap
            style={styles.checkboxContainer}
            onPress={() => onChange(!value)}
          >
            <>
              <CustomText variant={TextVariants.labelLarge}>
                {props.label}
              </CustomText>

              <Checkbox.Android
                status={
                  value ? CheckBoxStatus.checked : CheckBoxStatus.unchecked
                }
                disabled={props.disabled}
                color={props.color || theme.colors.primary}
                style={props.style}
              />
            </>
          </Tap>

          {/* Show helper text when there's an error */}
          {error ? (
            <HelperText type="error" visible={!!error}>
              {error.message}
            </HelperText>
          ) : (
            <HelperText type="error" visible={true}>
              {''}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    label: {
      alignSelf: 'center',
      padding: 10,
      textAlign: 'left',
    },
    checkboxContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
  });
export default CustomFormCheckBox;
