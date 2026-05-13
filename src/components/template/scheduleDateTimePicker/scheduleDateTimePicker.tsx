import { CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomDatePicker, CustomTextInput } from '@/components/molecules';
import { DatePickerMode } from '@/components/molecules/customDatePicker/customDatePicker';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  formatDate,
  getCurrentDateTime,
  getEndDateTime,
  isEmpty,
  parseDate,
} from '@/utils/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**  Added by @Ajay 08-04-2025 ---> Define the type for ScheduleDateTimePicker props */
type Props = {
  timezone?: string;
  startDateTime?: string;
  endDateTime?: string;
  startDateError?: string;
  endDateError?: string;
  loading?: boolean;
  showEndDate?: boolean;
  enabled?: boolean;
  startDatePress?: (value?: string) => void;
  endDatePress?: (value?: string) => void;
};

/**  Added by @Ajay 08-04-2025 ---> Enum for date selection types */
enum DateSelectionType {
  start = 'start',
  end = 'end',
}

/**  Added by @Ajay 08-04-2025 ---> Main component for scheduling date and time picker */
const ScheduleDateTimePicker = ({ enabled = true, ...props }: Props) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  /**  Added by @Ajay 08-04-2025 ---> Initialize translations for multi-language support */
  const { t } = useTranslation();

  /**  Added by @Ajay 08-04-2025 ---> Initialize start and end date/time states */
  const [startDateTime, setStartDateTime] = useState(
    props?.startDateTime ||
      formatDate({
        date: getCurrentDateTime(),
        returnFormat: 'MMM DD YYYY hh:mm A',
      }),
  );

  const [endDateTime, setEndDateTime] = useState(
    props?.endDateTime ||
      formatDate({
        date: getEndDateTime(),
        returnFormat: 'MMM DD YYYY hh:mm A',
      }),
  );

  /**  Added by @Ajay 08-04-2025 ---> State to manage date selection type and date picker visibility */
  const [dateSelection, setDateSelection] = useState<DateSelectionType>(
    DateSelectionType.start,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**  Added by @Ajay 08-04-2025 ---> Update start date/time when props change */
  useEffect(() => {
    if (props.startDateTime && startDateTime !== props.startDateTime) {
      setStartDateTime(props.startDateTime);
    }
  }, [props.startDateTime]);

  /**  Added by @Ajay 08-04-2025 ---> Update end date/time when props change */
  useEffect(() => {
    if (props.endDateTime && endDateTime !== props.endDateTime) {
      setEndDateTime(props.endDateTime);
    }
  }, [props.endDateTime]);

  /**  Added by @Ajay 08-04-2025 ---> Handle date selection based on type */
  const handleSetDate = () => {
    let datePickerDate = startDateTime;
    if (dateSelection === DateSelectionType.start) {
      datePickerDate = startDateTime;
    } else if (dateSelection === DateSelectionType.end) {
      datePickerDate = endDateTime;
    } else {
      datePickerDate = startDateTime;
    }

    return parseDate({
      date: datePickerDate,
      parseFormat: 'MMM DD YYYY hh:mm A',
    });
  };
  /**  Added by @Ajay 08-04-2025 ---> Handle selected date from date picker */
  const handleSelectedDate = (value: Date) => {
    /** Format the selected date to a readable format */
    const formattedDate = formatDate({
      date: value,
      returnFormat: 'MMM DD YYYY hh:mm A',
    });

    /**  Added by @Ajay 08-04-2025 ---> Handle start date-time selection */
    if (dateSelection === DateSelectionType.start) {
      if (formattedDate !== startDateTime) {
        setStartDateTime(
          formattedDate,
        ); /** Update the start date-time state if changed */
      }

      /** Set the end date-time as 30 minutes after the start date-time */
      const endDate = new Date(value);
      endDate.setMinutes(value.getMinutes() + 30);
      setEndDateTime(
        formatDate({
          date: endDate,
          returnFormat: 'MMM DD YYYY hh:mm A',
        }),
      );

      /** Trigger the startDatePress callback if defined */
      if (props.startDatePress) {
        props.startDatePress(formattedDate);
      }
      if (props.endDatePress) {
        props.endDatePress(
          formatDate({
            date: endDate,
            returnFormat: 'MMM DD YYYY hh:mm A',
          }),
        );
      }
    } else if (dateSelection === DateSelectionType.end) {
      /**  Added by @Ajay 08-04-2025 ---> Handle end date-time selection */
      if (formattedDate !== endDateTime) {
        setEndDateTime(
          formattedDate,
        ); /** Update the end date-time state if changed */
      }

      /** Trigger the endDatePress callback if defined */
      if (props.endDatePress) {
        props.endDatePress(formattedDate);
      }
    }
  };

  return (
    <View style={styles.main}>
      <CustomText
        style={styles.scheduledateText}
        variant={TextVariants.bodyLarge}
      >
        {t('DateTimeSelectionTitleMsg')}
      </CustomText>
      <Tap
        disableRipple
        onPress={() => {
          if (props.loading || !enabled) {
            return;
          }
          setDateSelection(DateSelectionType.start);
          if (isEmpty(startDateTime)) {
            setStartDateTime(
              formatDate({
                date: getCurrentDateTime(),
                returnFormat: 'MMM DD YYYY hh:mm a',
              }),
            );
          }
          setShowDatePicker(true);
        }}
        style={styles.dateLay}
      >
        <CustomTextInput
          label={props.showEndDate ? t('StartDate') : t('ScheduleDate')}
          enabled={false}
          text={startDateTime ?? ''}
          onChangeText={setStartDateTime}
          errorMsg={props.startDateError}
          pointerEvents="none"
          suffixIcon={{
            source: Images.calendar,
            type: ImageType.svg,
            color: theme.colors.onSurfaceVariant,
          }}
        />
      </Tap>
      {props.showEndDate && (
        <Tap
          disableRipple
          onPress={() => {
            // props.endDatePress?.(endDateTime);
            if (props.loading || !enabled) {
              return;
            }
            setDateSelection(DateSelectionType.end);
            setShowDatePicker(true);
          }}
          style={styles.dateLay}
        >
          <CustomTextInput
            label={t('EndDate')}
            enabled={false}
            text={endDateTime ?? ''}
            onChangeText={setStartDateTime}
            errorMsg={props.endDateError}
            pointerEvents="none"
            suffixIcon={{
              source: Images.calendar,
              type: ImageType.svg,
              color: theme.colors.onSurfaceVariant,
            }}
          />
        </Tap>
      )}
      <CustomText
        variant={TextVariants.bodySmall}
        color={theme.colors.labelLight}
        style={styles.timeZone}
      >{`${t('TimeZone')} : ${props.timezone}`}</CustomText>

      <CustomDatePicker
        showPopup={showDatePicker}
        setShowPopup={setShowDatePicker}
        title={t('SelectStartDateTime')}
        date={handleSetDate()}
        // minDate={new Date()}
        setDate={handleSelectedDate}
        mode={DatePickerMode.datetime}
      />
    </View>
  );
};
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      paddingTop: 10,
    },
    viewDevider: {
      marginBottom: 20,
      marginTop: 10,
      height: 0.8,
      width: '100%',
      backgroundColor: theme.colors.border,
    },
    timeZone: {
      alignSelf: 'flex-end',
      marginBottom: 7,
    },
    scheduledateText: {
      marginBottom: 20,
    },
    dateLay: {
      padding: 0,
    },
  });

export default ScheduleDateTimePicker;
