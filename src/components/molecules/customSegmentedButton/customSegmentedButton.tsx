import {CustomText, Shadow, Tap} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React, {useEffect} from 'react';
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native';

export type SegmentedButtonItem = {
  label?: string;
  value?: string;
  loading?: boolean;
};

type Props = {
  items?: SegmentedButtonItem[];
  selected?: SegmentedButtonItem;
  setSelected?: (item: SegmentedButtonItem) => void;
  style?: StyleProp<ViewStyle>;
  lableStyle?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
};

function CustomSegmentedButton({allowFontScaling = true, ...props}: Props) {
  const theme = useTheme();

  const styles = makeStyles(theme);

  useEffect(() => {
    if (props.items && props.items.length > 0 && !props.selected) {
      if (props.setSelected) {
        props.setSelected(props.items[0]);
      }
    }
  }, [props.items]);

  return (
    <View style={[styles.buttonContainer, props.style]}>
      {props.items?.map((item, index) => (
        <Tap
          key={`segmented${item.value}`}
          disableRipple
          style={styles.tapArea}
          onPress={() => {
            if (!item.loading) {
              if (props.setSelected) {
                props.setSelected(item);
              }
            }
          }}>
          {props.selected?.value == item.value ? (
            <Shadow style={styles.shadow}>
              <CustomText
                maxFontSizeMultiplier={props.maxFontSizeMultiplier}
                variant={TextVariants.labelMedium}
                style={props.lableStyle ? props.lableStyle : styles.label}
                allowFontScaling={allowFontScaling}
                color={theme.colors.onSurfaceVariant}>
                {item.label}
              </CustomText>
            </Shadow>
          ) : (
            <CustomText
              maxFontSizeMultiplier={props.maxFontSizeMultiplier}
              variant={TextVariants.labelMedium}
              color={theme.colors.onSurfaceVariant}
              allowFontScaling={allowFontScaling}
              style={props.lableStyle ? props.lableStyle : styles.label}>
              {item.label}
            </CustomText>
          )}
        </Tap>
      ))}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 10,
      backgroundColor: theme.dark
        ? theme.colors.secondaryContainer
        : theme.colors.elevation.level3,
      borderRadius: theme.roundness,
    },
    tapArea: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 2,
      paddingVertical: 5,
      borderRadius: theme.roundness,
    },
    shadow: {
      paddingVertical: 8,
      paddingHorizontal: 0,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 1,
    },
    label: {alignSelf: 'center', textAlign: 'center'},
  });

export default CustomSegmentedButton;
