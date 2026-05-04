import { CustomFlatList, CustomText, Tap } from '@/components/atoms';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { CustomBottomPopup, CustomDonut } from '@/components/molecules';
import { DonutDataType } from '@/components/molecules/customDonut/customDonut';
import {
  ExtractedDataList,
  GetBDAssetAllocationModel,
  GetCardsForUserDashboardModel,
} from '@/services/models';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data: GetBDAssetAllocationModel;
  isPrimary: boolean;
};

function BlackDiamondAsset(props: Props) {
  /** Added by @Akshita 13-04-25 -> to access app theme(colors, roundness, fonts, etc) (FYN-5399) */
  const theme = useTheme();

  /** Added by @Akshita 13-04-25 -> access StylesSheet with theme implemented (FYN-5399) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 13-04-25 -> translations for labels (FYN-5399) */
  const { t } = useTranslation();

  const [bdAssetChartList, setBDAssetChartList] = useState<DonutDataType[]>([]);

  const [selectedChartItem, setSelectedChartItem] =
    useState<ExtractedDataList>();

  const [chartPopup, setChartPopup] = useState(false);

  const maxFontSize = 1.3;
  useEffect(() => {
    setBDAssetChartList(
      props.data?.extractedDataList?.map((item, index) => ({
        text: item.name,
        value: parseFloat(item.percentOfPortfolio?.replace('%', '') || '0'),
        color: item.colorCode,
      })) as DonutDataType[],
    );
  }, [props.data]);

  /** Added by @Akshita 24-03-2025 -> Render legend item using flash list (FYN-5399) */
  const renderLegendItem = (item: ExtractedDataList) => {
    return (
      <Tap
        onPress={() => {
          setSelectedChartItem(item);
        }}
      >
        <View style={styles.chartLegendLay}>
          <View
            style={{
              ...styles.chartLegendDot,
              backgroundColor: item.colorCode,
            }}
          />
          <View style={styles.chartLegendTitleLay}>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={theme.colors.assetCardText}
              variant={TextVariants.bodyLarge}
            >
              {item.name}
            </CustomText>
            <CustomText
              maxFontSizeMultiplier={maxFontSize}
              color={theme.colors.assetCardText}
            >{`${t('Value')} : ${item.value}`}</CustomText>
          </View>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            color={theme.colors.assetCardText}
          >
            {item.percentOfPortfolio}
          </CustomText>
        </View>
      </Tap>
    );
  };

  return (
    <View style={styles.cardMain}>
      <View style={styles.bdAssetLay}>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          color={theme.colors.assetCardText}
          variant={TextVariants.bodyLarge}
        >
          {props.cardData.title}
        </CustomText>
        {props.data?.status == 1 && (
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            color={theme.colors.assetCardText}
            variant={TextVariants.labelLarge}
          >
            {`(${t('AsOfPreviousMarketClose')})`}
          </CustomText>
        )}

        {props.data?.status == 1 ? (
          <View style={styles.bdAssetMain}>
            <View pointerEvents="none" style={styles.donutLay}>
              {bdAssetChartList.length > 0 && (
                <CustomDonut
                  data={bdAssetChartList}
                  selectedItem={selectedChartItem?.name}
                  label={
                    <View style={styles.donutChartCenter}>
                      <CustomText
                        maxFontSizeMultiplier={maxFontSize}
                        color={theme.colors.assetCardText}
                        maxLines={1}
                        ellipsis={TextEllipsis.tail}
                        style={{ textAlign: 'center' }}
                      >
                        {t('TotalValue')}
                      </CustomText>
                      <CustomText
                        maxFontSizeMultiplier={maxFontSize}
                        color={theme.colors.assetCardText}
                        style={{ textAlign: 'center' }}
                        variant={TextVariants.titleMedium}
                      >
                        {props.data?.totalValue}
                      </CustomText>
                    </View>
                  }
                />
              )}
            </View>

            {props.data.status == 1 && (
              <Tap
                onPress={() => {
                  setSelectedChartItem(undefined);
                  setChartPopup(true);
                }}
              >
                <View>
                  <CustomText
                    maxFontSizeMultiplier={maxFontSize}
                    color={theme.colors.assetCardText}
                    variant={TextVariants.bodyLarge}
                  >
                    {t('SeeMore')}
                  </CustomText>
                  <Divider style={styles.divider} />
                </View>
              </Tap>
            )}
          </View>
        ) : (
          props.data?.message &&
          props.data.status == 0 && <ErrorCard msg={props.data.message} />
        )}

        {props.cardData.customLink && (
          <CustomLinkIconCard url={props.cardData.customLink} />
        )}
      </View>

      <CustomBottomPopup
        shown={chartPopup}
        setShown={setChartPopup}
        title={
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            variant={TextVariants.titleLarge}
            style={{ width: '80%' }}
          >
            {props.cardData.title}
          </CustomText>
        }
        titleColor={theme.colors.assetCardText}
        popUpBgcolor={theme.colors.assetCardBg}
      >
        <View>
          <View pointerEvents="none" style={styles.donutLay}>
            {bdAssetChartList.length > 0 && (
              <CustomDonut
                data={bdAssetChartList}
                selectedItem={selectedChartItem?.name}
                label={
                  <View style={styles.donutChartCenter}>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={theme.colors.assetCardText}
                      maxLines={1}
                      ellipsis={TextEllipsis.tail}
                      style={styles.chartItemText}
                    >
                      {selectedChartItem
                        ? selectedChartItem?.name
                        : t('TotalValue')}
                    </CustomText>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={theme.colors.assetCardText}
                      variant={TextVariants.titleLarge}
                      style={styles.chartItemText}
                    >
                      {selectedChartItem
                        ? selectedChartItem?.value
                        : props.data?.totalValue}
                    </CustomText>
                  </View>
                }
              />
            )}
          </View>

          <Divider style={styles.popUpDivider} />

          {props.data?.extractedDataList && (
            <View style={styles.popUpMain}>
              <CustomFlatList
                data={props.data?.extractedDataList}
                keyExtractor={item => `${item.name!} ${item.valueDecimal}`}
                renderItem={({ item }) => renderLegendItem(item)}
              />
            </View>
          )}
        </View>
      </CustomBottomPopup>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    cardMain: {
      flex: 1,
      backgroundColor: theme.colors.assetCardBg,
      borderRadius: theme.roundness,
    },
    bdAssetLay: {
      flex: 1,
      padding: 20,
    },
    bdAssetMain: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    donutLay: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    chartLegendLay: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 10,
      marginTop: 7,
    },
    chartLegendDot: {
      height: 12,
      width: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      marginTop: 7,
    },
    chartLegendTitleLay: {
      flex: 1,
      gap: 1,
    },

    donutChartCenter: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    popUpMain: {
      height: Dimensions.get('window').height * 0.4,
      marginBottom: 20,
    },
    chartItemText: {
      textAlign: 'center',
    },
    divider: {
      width: 70,
      height: 1,
    },
    popUpDivider: {
      marginHorizontal: 20,
      height: 0.5,
      marginTop: 8,
    },
    bottomPopUpBg: {
      backgroundColor: theme.colors.assetCardBg,
    },
  });

export default BlackDiamondAsset;
