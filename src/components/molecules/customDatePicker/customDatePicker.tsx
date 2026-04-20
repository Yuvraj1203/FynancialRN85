import { CustomButton } from '@/components/atoms';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Picker } from 'react-native-wheel-pick';
import CustomBottomPopup from '../customPopup/customBottomPopup';

export enum DatePickerMode {
  datetime = 'datetime',
  date = 'date',
  time = 'time',
  monthYear = 'monthYear',
}

const monthsArray = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type Props = {
  mode?: DatePickerMode;
  showPopup: boolean;
  setShowPopup: (value: boolean) => void;
  title?: string;
  date?: Date;
  setDate: (value: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  minYear?: number;
};

const CustomDatePicker = ({
  mode = DatePickerMode.date,
  date = new Date(),
  minYear = 1990,
  ...props
}: Props) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling

  const { t } = useTranslation(); // translations

  const [loading, setLoading] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<Date>(date);

  //fetching year and month from date
  const getMonthYear = (d: Date) => {
    return {
      month: monthsArray[d.getMonth()],
      year: d.getFullYear(),
    };
  };

  //takes month and year, and gives date
  const createDate = (month: string, year: number): Date => {
    return new Date(year, monthsArray.indexOf(month), 1);
  };

  //month and year
  const [selectedMonthYear, setSelectedMonthYear] = useState(
    getMonthYear(date),
  );

  //years picker data
  const totalYearsArray = () => {
    const currentYear = new Date().getFullYear();
    const numberOfYears = currentYear - minYear + 20;
    const yearsArray = Array.from(
      { length: numberOfYears },
      (_, index) => minYear + index,
    );
    return yearsArray;
  };

  return (
    <CustomBottomPopup
      shown={props.showPopup}
      setShown={props.setShowPopup}
      dismissOnBackPress={false} // on back press don't allow user to close poup till api get's called
      title={props.title}
    >
      <View style={styles.main}>
        {mode == DatePickerMode.monthYear ? (
          <View style={styles.customPickerContainer}>
            <Picker
              style={styles.customPickerStyle}
              selectedValue={selectedMonthYear.month}
              pickerData={monthsArray}
              onValueChange={(value: string) => {
                setSelectedMonthYear({
                  month: value,
                  year: selectedMonthYear.year,
                });
              }}
            />
            <Picker
              style={styles.customPickerStyle}
              selectedValue={selectedMonthYear.year.toString()}
              pickerData={totalYearsArray()}
              onValueChange={(value: string) => {
                setSelectedMonthYear({
                  month: selectedMonthYear.month,
                  year: Number(value),
                });
              }}
            />
          </View>
        ) : (
          <DatePicker
            mode={mode}
            date={date}
            maximumDate={props.maxDate}
            minimumDate={props.minDate}
            onDateChange={date => {
              setSelectedDate(date);
            }}
            onStateChange={value => {
              if (value == 'spinning') {
                setLoading(true);
              } else if (value == 'idle') {
                setLoading(false);
              }
            }}
            theme={theme.dark ? 'dark' : 'light'}
          />
        )}

        <CustomButton
          mode={ButtonVariants.outlined}
          style={{
            ...styles.confirmBtn,
            borderColor: loading ? theme.colors.outline : theme.colors.primary,
          }}
          textColor={loading ? theme.colors.outline : theme.colors.primary}
          onPress={() => {
            if (!loading) {
              if (mode == DatePickerMode.monthYear) {
                const returnMonthAndYear = createDate(
                  selectedMonthYear.month,
                  selectedMonthYear.year,
                );
                props.setDate(returnMonthAndYear);
              } else {
                props.setDate(selectedDate);
              }
              props.setShowPopup(false);
            }
          }}
        >
          {t('Confirm')}
        </CustomButton>
      </View>
    </CustomBottomPopup>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      alignItems: 'center',
    },
    confirmBtn: {
      margin: 20,
      alignSelf: 'flex-end',
    },
    customPickerStyle: {
      backgroundColor: theme.colors.surface,
      flex: 1,
      width: '100%',
      height: 250,
    },
    customPickerContainer: {
      flexDirection: 'row',
    },
  });

export default CustomDatePicker;
