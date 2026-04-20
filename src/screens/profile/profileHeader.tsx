import {
  CustomButton,
  CustomImage,
  Shadow,
  Skeleton,
  Tap,
} from '@/components/atoms';
import {
  ButtonVariants,
  Direction,
} from '@/components/atoms/customButton/customButton';
import { ImageType } from '@/components/atoms/customImage/customImage';
import CustomText, {
  TextVariants,
} from '@/components/atoms/customText/customText';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { GetUserContactInfoModel } from '@/services/models';
import { userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing, ZoomIn, ZoomInRight } from 'react-native-reanimated';

type contactSummaryActionButtonsArray = {
  icon?: string;
  onPress?: () => void;
  enabled?: boolean;
};

// options for component
type Props = {
  route?: number;
  isAdvisorView?: boolean;
  individualContactLoading?: boolean;
  contactData?: GetUserContactInfoModel;
  contactSummaryActionButtons?: contactSummaryActionButtonsArray[];
  loading?: boolean;
  loadingButtons?: string;
  handleReset?: () => void;
  setShowImageSelectionPopup: (value: boolean) => void;
};

function ProfileHeader({
  route,
  isAdvisorView,
  individualContactLoading,
  contactData,
  contactSummaryActionButtons,
  loading,
  loadingButtons,
  handleReset,
  setShowImageSelectionPopup,
}: Props) {
  /** Added by @Yuvraj 19-03-2025 -> navigate to different screen (FYN-5821) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 19-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5821) */
  const theme = useTheme();

  /** Added by @Yuvraj 19-03-2025 -> access StylesSheet with theme implemented (FYN-5821) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 19-03-2025 -> translations for labels (FYN-5821) */
  const { t } = useTranslation();

  /**  Added by @Yuvraj 19-03-2025 -> Retrieve user details from store (FYN-5821)*/
  const userDetails = userStore(state => state.userDetails);

  return route ? (
    individualContactLoading ? (
      <Skeleton>
        <View style={styles.contactSummarySkeletonContainer}>
          <View style={styles.contactSummarySkeletonProfile}></View>
          <View style={styles.contactSummarySkeletonName}></View>

          {!isAdvisorView && (
            <View style={styles.contactSummarySkeletonActionItems}>
              <View style={styles.contactSummarySkeletonActionItem}></View>
              <View style={styles.contactSummarySkeletonActionItem}></View>
              <View style={styles.contactSummarySkeletonActionItem}></View>
              <View style={styles.contactSummarySkeletonActionItem}></View>
            </View>
          )}
        </View>
      </Skeleton>
    ) : (
      <View style={styles.contactHeaderContainer}>
        <Tap
          style={[styles.tapPaddingZero, styles.ContactSummaryDp]}
          onPress={() => {
            if (contactData?.profileImage) {
              const imageList = [contactData?.profileImage!];
              showImagePopup({
                imageList: imageList,
                defaultIndex: 0,
              });
            }
          }}
        >
          <CustomImage
            source={
              contactData?.profileImage
                ? { uri: contactData?.profileImage }
                : Images.name
            }
            type={contactData?.profileImage ? undefined : ImageType.svg}
            color={contactData?.profileImage ? undefined : theme.colors.outline}
            style={styles.ContactSummaryDp}
          />
        </Tap>

        <CustomText
          style={styles.fullNameAlign}
          variant={TextVariants.headlineMedium}
        >
          {contactData?.fullName}
        </CustomText>

        {!isAdvisorView && (
          <Shadow style={styles.tapPaddingZero}>
            <LinearGradient
              colors={[theme.colors.inversePrimary, theme.colors.primary]}
              useAngle={true}
              angle={180}
              style={styles.contactGradient}
            >
              <View style={styles.gradientView}>
                {contactSummaryActionButtons?.map((item, index) => (
                  <Tap
                    key={`contactsummaryIcons-${index}`}
                    onPress={item.onPress}
                    style={{
                      ...styles.contactHeaderItem,
                      borderRightWidth:
                        contactSummaryActionButtons.length - 1 == index ? 0 : 1,
                    }}
                  >
                    <CustomImage
                      source={item.icon}
                      type={ImageType.svg}
                      color={
                        !item.enabled
                          ? theme.colors.onSurfaceDisabled
                          : theme.colors.onPrimary
                      }
                      style={styles.editIcon}
                    />
                  </Tap>
                ))}
              </View>
            </LinearGradient>
          </Shadow>
        )}
      </View>
    )
  ) : loading ? (
    <Skeleton>
      <View style={styles.contactSkeletonContainer}>
        <View style={styles.contactSkeletonProfile}></View>
        <View style={styles.contactSkeletonButtonContainer}>
          <View style={styles.contactSkeletonButton}></View>
          <View style={styles.contactSkeletonButton}></View>
        </View>
      </View>
    </Skeleton>
  ) : (
    <View style={styles.headerContainer}>
      <Animated.View
        entering={ZoomIn.duration(700).easing(Easing.inOut(Easing.quad))}
      >
        <Tap
          style={styles.tapPaddingZero}
          onPress={() => {
            if (loadingButtons != 'edit') {
              if (userDetails?.profileImageUrl) {
                const imageList = [userDetails?.profileImageUrl!];
                showImagePopup({
                  imageList: imageList,
                  defaultIndex: 0,
                });
              } else {
                setShowImageSelectionPopup(true);
              }
            }
          }}
        >
          <CustomImage
            source={
              userDetails?.profileImageUrl
                ? { uri: userDetails?.profileImageUrl }
                : Images.name
            }
            type={userDetails?.profileImageUrl ? undefined : ImageType.svg}
            color={
              userDetails?.profileImageUrl ? undefined : theme.colors.outline
            }
            style={styles.profilePicture}
          />
        </Tap>
      </Animated.View>

      <Animated.View
        entering={ZoomInRight.duration(700).easing(Easing.inOut(Easing.quad))}
        style={styles.headerButtonContainer}
      >
        <CustomButton
          loading={loadingButtons == 'reset'}
          onPress={handleReset}
          icon={{
            source: Images.lock,
            type: ImageType.svg,
            direction: Direction.left,
          }}
        >
          {t('ResetPassword')}
        </CustomButton>

        <CustomButton
          mode={ButtonVariants.outlined}
          loading={loadingButtons == 'edit'}
          onPress={() => setShowImageSelectionPopup(true)}
          icon={{
            source: Images.addPicture,
            type: ImageType.svg,
            direction: Direction.left,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          {t('ChangePicture')}
        </CustomButton>
      </Animated.View>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    skeletonMainContainer: {
      marginHorizontal: 20,
      marginVertical: 10,
      gap: 15,
      flex: 1,
    },
    skeletonOpenAccordian: {
      borderColor: theme.colors.outline,
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      width: '100%',
      padding: 10,
      gap: 10,
    },
    skeletonAccordian: {
      borderColor: theme.colors.outline,
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      width: '100%',
      padding: 10,
    },
    skeletonAccordianTitle: {
      width: '55%',
      height: 30,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    skeletonAccordianContentContainer: {
      borderTopWidth: 0.5,
      gap: 10,
      paddingTop: 10,
    },
    skeletonAccordianContentView: {
      flexDirection: 'row',
      gap: 50,
    },
    skeletonAccordianContent: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
      height: 20,
      width: '30%',
    },
    contactSkeletonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginVertical: 10,
      gap: 10,
    },
    contactSkeletonProfile: {
      height: 120,
      width: 120,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactSkeletonButtonContainer: {
      justifyContent: 'space-between',
      gap: 40,
    },
    contactSkeletonButton: {
      height: 35,
      width: 140,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactSummarySkeletonContainer: {
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 20,
      marginVertical: 10,
    },
    contactSummarySkeletonProfile: {
      height: 100,
      width: 100,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactSummarySkeletonName: {
      height: 25,
      width: '60%',
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactSummarySkeletonActionItems: {
      height: 45,
      width: '100%',
      marginTop: 5,
      borderColor: theme.colors.outline,
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      justifyContent: 'space-around',
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactSummarySkeletonActionItem: {
      height: 20,
      width: 20,
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
    },
    contactHeaderContainer: {
      alignItems: 'center',
      gap: 10,
      marginVertical: 10,
      marginHorizontal: 20,
    },
    ContactSummaryDp: {
      height: 100,
      width: 100,
      //borderRadius: 999,
    },
    contactGradient: {
      flexDirection: 'row',
      width: '100%',
      borderRadius: theme.roundness,
      //paddingVertical: 10,
    },
    contactHeaderItem: {
      borderRightColor: theme.colors.onPrimary,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: 20,
      width: 20,
    },
    headerContainer: {
      flexDirection: 'row',
      padding: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 20,
    },
    fullNameAlign: {
      textAlign: 'center',
    },
    tapPaddingZero: {
      padding: 0,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    profilePicture: {
      height: 120,
      width: 120,
    },
    headerButtonContainer: {
      gap: 20,
    },
    accordianContainer: {
      padding: 0,
      marginHorizontal: 20,
      marginVertical: 10,
    },
    accordianTap: {
      padding: 15,
    },
    accordianTapView: {
      flexDirection: 'row',
      gap: 15,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accordianTitle: {
      flex: 1,
    },
    editIcon: {
      height: 20,
      width: 20,
    },
    accordianDrawerContainer: {
      paddingVertical: 0,
    },
    accordianDrawer: {
      padding: 10,
      borderTopWidth: 0.5,
      borderColor: theme.colors.outline,
      gap: 15,
    },
    accordianDrawerItem: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    accordianItemIcon: {
      height: 20,
      width: 20,
      marginTop: 1,
    },
    labelText: {
      width: 70,
      marginTop: 1,
    },
    labelTextColon: {
      marginTop: 1,
    },
    valueText: {
      flex: 1,
      marginBottom: 'auto',
    },
    bottomMessage: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 5,
    },
    logoutContainer: {
      justifyContent: 'flex-end',
    },
    logoutButton: {
      marginHorizontal: 20,
      marginVertical: 10,
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.gradientColorLevel2,
    },
    date: {
      marginTop: 10,
    },
    status: {
      borderRadius: theme.roundness,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primaryHighlight1,
    },
    titleLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    programName: {
      flex: 1,
    },
    flatListContainer: {
      borderRadius: theme.roundness,
      borderColor: theme.colors.outline,
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    noteAccordianAddButton: {
      borderRadius: theme.roundness,
    },
    accordianDrawerNotes: {
      padding: 10,
      borderTopWidth: 0.5,
      borderColor: theme.colors.outline,
      gap: 10,
    },
    accordianDrawerNotesItems: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      paddingBottom: 10,
      borderColor: theme.colors.outline,
    },
    accordianNoteDeleteIconTap: {
      width: 30,
      height: 30,
      borderRadius: theme.roundness,
    },
    accordianNoteDeleteIcon: {
      height: 20,
      width: 20,
    },
    notesAddBottomPopup: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
      maxHeight: 400,
    },
    addNoteInput: {
      maxHeight: 300,
    },
    skeletonNotesAccordianContainer: {
      padding: 10,
    },
    skeletonNotesAccordian: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      height: 40,
      width: '100%',
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      marginBottom: 10,
    },
    skeletonNotesAccordianKey: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
      height: 15,
      width: '60%',
    },
    skeletonNotesAccordianValue: {
      backgroundColor: theme.colors.outline,
      borderRadius: theme.roundness,
      height: 20,
      width: 20,
    },
    gradientView: { paddingVertical: 10, flexDirection: 'row', flex: 1 },
  });

export default ProfileHeader;
