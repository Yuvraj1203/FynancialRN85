import {CustomText} from '@/components/atoms';
import {TextVariants} from '@/components/atoms/customText/customText';
import {CustomSegmentedButton} from '@/components/molecules';
import {SegmentedButtonItem} from '@/components/molecules/customSegmentedButton/customSegmentedButton';
import {
  GetAddeparModel,
  GetCardsForUserDashboardModel,
} from '@/services/models';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetAddeparModel;
  isPrimary: boolean;
};

function AddeparRORV2(props: Props) {
  /** Added by @Akshita 31-01-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5399) */
  const theme = useTheme();

  /** Added by @Akshita 31-01-2025 -> access StylesSheet with theme implemented (FYN-5399) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 31-01-2025 -> translations for labels (FYN-5399) */
  const {t} = useTranslation();

  const [addeparRORV2Selected, setAddeparRORV2Selected] =
    useState<SegmentedButtonItem>();

  const [selectedValue, setSelectedValue] = useState(
    props.data.rorSinceInception,
  );

  const textColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const handleAddeparRORV2Selected = (value: SegmentedButtonItem) => {
    setAddeparRORV2Selected(value);
    if (value.value == 'Inception') {
      setSelectedValue(props.data.rorSinceInception);
    } else if (value.value == 'YearToDate') {
      setSelectedValue(props.data.rorytd);
    }
  };
  const maxFontSize = 1.3;

  return (
    <View style={styles.cardMain}>
      <View style={styles.AdRORV2Lay}>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          variant={TextVariants.bodyLarge}
          color={textColor}>
          {props.cardData.title}
        </CustomText>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          color={textColor}
          style={styles.headerSubTitle}
          variant={TextVariants.labelLarge}>
          {`(${t('AsOfPreviousMarketClose')})`}
        </CustomText>

        {props.data.status == 1 ? (
          <View style={styles.orionTwrMain}>
            <CustomText variant={TextVariants.displayMedium} color={textColor}>
              {selectedValue}
            </CustomText>
          </View>
        ) : (
          props.data.message && <ErrorCard msg={props.data.message} />
        )}
      </View>
      {props.data.status == 1 && (
        <CustomSegmentedButton
          items={[
            {
              label: t('SinceInception'),
              value: 'Inception',
            },
            {
              label: t('YearToDate'),
              value: 'YearToDate',
            },
          ]}
          maxFontSizeMultiplier={maxFontSize}
          selected={addeparRORV2Selected}
          setSelected={handleAddeparRORV2Selected}
          style={styles.orionTwrSegmented}
        />
      )}

      {props.cardData.customLink && (
        <CustomLinkIconCard url={props.cardData.customLink} />
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    cardMain: {flex: 1},
    AdRORV2Lay: {
      flex: 1,
      padding: 20,
    },
    orionTwrItemTitle: {
      flex: 1,
    },
    orionTwrMain: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 40,
    },
    orionTwrSegmented: {marginHorizontal: 20, marginBottom: 20},
    headerSubTitle: {
      marginTop: 5,
    },
  });

export default AddeparRORV2;
