import { CustomFlatList, CustomText, Tap } from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomBottomPopup } from '@/components/molecules';
import {
  GetCardsForUserDashboardModel,
  GetClientGoalsModel,
} from '@/services/models';
import { goals } from '@/services/models/getClientGoalModel/getClientGoalModel';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Divider, ProgressBar } from 'react-native-paper';
import CustomLinkIconCard from './customLinkIconCard';
import ErrorCard from './errorCard';

type Props = {
  cardData: GetCardsForUserDashboardModel;
  data?: GetClientGoalsModel;
  isPrimary: boolean;
};

function EMGoal(props: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { t } = useTranslation();
  const maxFontSize = 1.3;

  const [goalPopup, setGoalPopup] = useState(false);

  const textColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const boxBorderColor = props.isPrimary
    ? theme.colors.surface
    : theme.colors.onSurfaceVariant;

  const getStatusColor = (status?: string) => {
    return status?.toLowerCase() === 'on track'
      ? theme.colors.statusAvailableColor
      : theme.colors.error;
  };

  const renderGoalItem = (item: goals) => {
    return (
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          variant={TextVariants.bodyLarge}
        >
          {item.goalName!}
        </CustomText>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            variant={TextVariants.labelMedium}
          >
            {`${t('Goal')}: ${item.targetAmount}`}
          </CustomText>
          <CustomText
            maxFontSizeMultiplier={maxFontSize}
            color={getStatusColor(item.status)}
            variant={TextVariants.labelLarge}
          >
            {item.status}
          </CustomText>
        </View>

        <ProgressBar
          style={styles.progressBar}
          animatedValue={item.percentage}
          color={getStatusColor(item.status)}
        />
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          variant={TextVariants.labelMedium}
        >
          {`${item.percentage}% ${t('Funded')}`}
        </CustomText>
        <Divider />
      </View>
    );
  };

  const firstGoal = props.data?.goals?.at(0);
  const goalCount = props.data?.goals?.length ?? 0;

  return (
    <View style={[styles.cardMain]}>
      <View style={styles.headerContainer}>
        <CustomText
          maxFontSizeMultiplier={maxFontSize}
          color={textColor}
          variant={TextVariants.bodyLarge}
        >
          {props.cardData.title}
        </CustomText>
      </View>

      {!props.data?.message && props.data?.status == 1 ? (
        <View style={styles.container}>
          <View style={styles.goalsCenterWrapper}>
            <View style={styles.goalsWrapper}>
              <View
                style={[styles.outlinedBox, { borderColor: boxBorderColor }]}
              >
                <View style={styles.goalNameRow}>
                  <CustomText
                    maxFontSizeMultiplier={maxFontSize}
                    color={textColor}
                    variant={TextVariants.bodyMedium}
                  >
                    {firstGoal?.goalName}
                  </CustomText>
                  {firstGoal?.status ? (
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={getStatusColor(firstGoal.status)}
                      variant={TextVariants.labelMedium}
                    >
                      {firstGoal.status}
                    </CustomText>
                  ) : null}
                </View>
                <CustomText
                  maxFontSizeMultiplier={maxFontSize}
                  color={textColor}
                  variant={TextVariants.bodyLarge}
                >
                  {firstGoal?.targetAmount}
                </CustomText>
                <ProgressBar
                  style={styles.progressBar}
                  animatedValue={firstGoal?.percentage}
                  color={getStatusColor(firstGoal?.status)}
                />
                <CustomText
                  maxFontSizeMultiplier={maxFontSize}
                  color={textColor}
                  variant={TextVariants.labelMedium}
                >
                  {`${firstGoal?.percentage}% ${t('Funded')}`}
                </CustomText>
              </View>

              {goalCount >= 2 && (
                <View
                  style={[styles.outlinedBox, { borderColor: boxBorderColor }]}
                >
                  <View style={styles.goalNameRow}>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={textColor}
                      variant={TextVariants.bodyMedium}
                    >
                      {props.data?.goals?.at(1)?.goalName}
                    </CustomText>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={textColor}
                      variant={TextVariants.labelMedium}
                    >
                      {`${props.data?.goals?.at(1)?.percentage}%`}
                    </CustomText>
                  </View>
                </View>
              )}

              {goalCount >= 3 && (
                <View
                  style={[styles.outlinedBox, { borderColor: boxBorderColor }]}
                >
                  <View style={styles.goalNameRow}>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={textColor}
                      variant={TextVariants.bodyMedium}
                    >
                      {props.data?.goals?.at(2)?.goalName}
                    </CustomText>
                    <CustomText
                      maxFontSizeMultiplier={maxFontSize}
                      color={textColor}
                      variant={TextVariants.labelMedium}
                    >
                      {`${props.data?.goals?.at(2)?.percentage}%`}
                    </CustomText>
                  </View>
                </View>
              )}
            </View>
          </View>

          <Tap
            style={styles.seeMoreContainer}
            onPress={() => setGoalPopup(true)}
          >
            <>
              <CustomText
                maxFontSizeMultiplier={maxFontSize}
                color={textColor}
                variant={TextVariants.bodyLarge}
              >
                {t('SeeMore')}
              </CustomText>
              <Divider style={styles.divider} />
            </>
          </Tap>
        </View>
      ) : (
        props.data?.message &&
        props.data.status == 0 && <ErrorCard msg={props.data.message} />
      )}

      {props.cardData.customLink && (
        <CustomLinkIconCard url={props.cardData.customLink} />
      )}

      <CustomBottomPopup
        shown={goalPopup}
        setShown={setGoalPopup}
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
          {goalCount > 0 && (
            <View style={styles.popUpMain}>
              <CustomFlatList
                data={props.data?.goals!}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => renderGoalItem(item)}
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
    cardMain: { flex: 1, padding: 20, borderRadius: theme.roundness },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 0,
    },
    container: {
      flex: 1,
      justifyContent: 'space-between',
    },
    goalsCenterWrapper: {
      flex: 1,
      justifyContent: 'center',
    },
    goalsWrapper: {
      gap: 10,
    },
    goalNameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    outlinedBox: {
      borderWidth: 0.6,

      borderRadius: theme.roundness,
      padding: 10,
      gap: 10,
    },

    progressBar: {
      height: 8,
      borderRadius: theme.roundness,
    },
    seeMoreContainer: {
      alignItems: 'center',
    },
    divider: {
      width: 70,
      height: 1,
    },
    popUpMain: {
      height: Dimensions.get('window').height * 0.4,
      marginBottom: 20,
    },
  });

export default EMGoal;
