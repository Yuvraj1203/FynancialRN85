import { CustomButton, CustomText } from '@/components/atoms';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomSegmentedButton } from '@/components/molecules';
import { SegmentedButtonItem } from '@/components/molecules/customSegmentedButton/customSegmentedButton';
import {
  GetCardsForUserDashboardModel,
  GetPerformanceTwrModel,
} from '@/services/models';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetPerformanceTwrModel;
  isPrimary: boolean;
};

function OrionTwr(props: Props) {
  /** Added by @Yuvraj 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4299) */
  const theme = useTheme();

  /** Added by @Yuvraj 31-01-2025 -> access StylesSheet with theme implemented (FYN-4299) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 31-01-2025 -> translations for labels (FYN-4299) */
  const { t } = useTranslation();
  const maxFontSize = 1.3;

  const [orionPerformanceTwrSelected, setOrionPerformanceTwrSelected] =
    useState<SegmentedButtonItem>();

  const [selectedValue, setSelectedValue] = useState(props.data.sinceInception);

  const [showTwoSegmentedBtn, setShowTwoSegmentedBtn] = useState(false);

  const [availableTimePeriods, setAvailableTimePeriods] = useState<number[]>(
    [],
  );

  useEffect(() => {
    if (props.data.defaultTimePeriod) {
      Log('Default Time Period:' + props.data.defaultTimePeriod);
      handleOrionTwrDefaultBtnSelection(props.data.defaultTimePeriod);
    } else {
      setOrionPerformanceTwrSelected({
        label: 'Since Inception',
        value: 'Inception',
      });
      setSelectedValue(props.data.sinceInception);
    }
    if (props.data.timePeriod) {
      const timePeriods = parseCommaNumbersSorted(props.data.timePeriod);
      setAvailableTimePeriods(timePeriods);

      if (timePeriods.length == 4) {
        setShowTwoSegmentedBtn(timePeriods.length == 4);
      }
    }
  }, [props.data]);

  const parseCommaNumbersSorted = (input?: string): number[] => {
    if (!input?.trim()) return [];

    const nums = input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => Number.isFinite(n));

    return Array.from(new Set(nums)).sort((a, b) => a - b);
  };

  const handleOrionPerformanceTwrSelected = (value: SegmentedButtonItem) => {
    setOrionPerformanceTwrSelected(value);
    if (value.value == 'Inception') {
      setSelectedValue(props.data.sinceInception);
    } else if (value.value == 'YearToDate') {
      setSelectedValue(props.data.yearToDate);
    } else if (value.value == 'Threeyear') {
      setSelectedValue(props.data.threeYear);
    } else if (value.value == 'OneYear') {
      setSelectedValue(props.data.oneYear);
    }
  };

  const handleOrionTwrDefaultBtnSelection = (value: string) => {
    if (value == '1') {
      setOrionPerformanceTwrSelected({
        label: 'Since Inception',
        value: 'Inception',
      });

      setSelectedValue(props.data.sinceInception);
    } else if (value == '2') {
      setOrionPerformanceTwrSelected({
        label: 'Year To Date',
        value: 'YearToDate',
      });

      setSelectedValue(props.data.yearToDate);
    } else if (value == '3') {
      setOrionPerformanceTwrSelected({
        label: 'One Year',
        value: 'OneYear',
      });

      setSelectedValue(props.data.oneYear);
    } else if (value == '4') {
      setOrionPerformanceTwrSelected({
        label: 'Three Year',
        value: 'Threeyear',
      });
      setSelectedValue(props.data.threeYear);
    }
  };

  const getButtonMode = (value: string) => {
    return orionPerformanceTwrSelected?.value === value
      ? ButtonVariants.contained
      : ButtonVariants.outlined;
  };

  return (
    <View style={styles.cardMain}>
      <View style={styles.orionTwrLay}>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          variant={TextVariants.bodyLarge}
          color={
            props.isPrimary
              ? theme.colors.surface
              : theme.colors.onSurfaceVariant
          }
        >
          {props.cardData.title}
        </CustomText>

        {props.data.status == 1 ? (
          <View style={styles.orionTwrMain}>
            <CustomText
              variant={TextVariants.displayMedium}
              color={
                props.isPrimary
                  ? theme.colors.surface
                  : theme.colors.onSurfaceVariant
              }
            >
              {selectedValue}
            </CustomText>
          </View>
        ) : (
          props.data.message && <ErrorCard msg={props.data.message} />
        )}
      </View>
      {props.data.status == 1 && (
        <View>
          {showTwoSegmentedBtn ? (
            <>
              <View style={styles.timePerioudBtnContainer}>
                <View style={styles.timePerioudBtn}>
                  <CustomButton
                    mode={getButtonMode('Inception')}
                    onPress={() => {
                      handleOrionTwrDefaultBtnSelection('1');
                    }}
                    style={styles.orionTwrSegmented}
                  >
                    {t('SinceInception')}
                  </CustomButton>
                  <CustomButton
                    mode={getButtonMode('OneYear')}
                    onPress={() => handleOrionTwrDefaultBtnSelection('3')}
                    style={{ paddingHorizontal: 30 }}
                  >
                    {t('OneYear')}
                  </CustomButton>
                </View>
                <View style={styles.timePerioudBtn}>
                  <CustomButton
                    mode={getButtonMode('YearToDate')}
                    onPress={() => handleOrionTwrDefaultBtnSelection('2')}
                    style={{ paddingHorizontal: 10 }}
                  >
                    {t('YearToDate')}
                  </CustomButton>
                  <CustomButton
                    mode={getButtonMode('Threeyear')}
                    onPress={() => handleOrionTwrDefaultBtnSelection('4')}
                    style={{ paddingHorizontal: 30 }}
                  >
                    {t('ThreeYears')}
                  </CustomButton>
                </View>
              </View>
            </>
          ) : (
            <CustomSegmentedButton
              items={[
                ...(availableTimePeriods.includes(1)
                  ? [
                      {
                        label: t('SinceInception'),
                        value: 'Inception',
                      },
                    ]
                  : []),
                ...(availableTimePeriods.includes(2)
                  ? [
                      {
                        label: t('YearToDate'),
                        value: 'YearToDate',
                      },
                    ]
                  : []),
                ...(availableTimePeriods.includes(3)
                  ? [
                      {
                        label: t('OneYear'),
                        value: 'OneYear',
                      },
                    ]
                  : []),
                ...(availableTimePeriods.includes(4)
                  ? [
                      {
                        label: t('ThreeYears'),
                        value: 'Threeyear',
                      },
                    ]
                  : []),
              ]}
              maxFontSizeMultiplier={maxFontSize}
              selected={orionPerformanceTwrSelected}
              setSelected={handleOrionPerformanceTwrSelected}
              style={styles.orionTwrSegmented}
            />
          )}
        </View>
      )}

      {props.cardData.customLink && (
        <CustomLinkIconCard url={props.cardData.customLink} />
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    cardMain: { flex: 1 },
    orionTwrLay: {
      flex: 1,
      padding: 20,
    },
    orionTwrItemTitle: {
      flex: 1,
    },
    orionTwrMain: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    orionTwrSegmented: { marginHorizontal: 10 },
    timePerioudBtn: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    timePerioudBtnContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      paddingRight: 30,
    },
  });

export default OrionTwr;
