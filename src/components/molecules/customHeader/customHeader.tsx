import { Badge, CustomAvatar, CustomImage, Tap } from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import CustomText, {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { DrawerActions } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ColorValue,
  ImageSourcePropType,
  Keyboard,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Menu } from 'react-native-paper';
import CustomTextInput from '../customTextInput/customTextInput';
import {
  InputReturnKeyType,
  InputVariants,
} from '../customTextInput/formTextInput';

export type HeaderIconProps = {
  name: string;
  source: ImageSourcePropType;
  type?: ImageType;
  badgeCount?: number;
  onPress: () => void;
};

// options for component
type Props = {
  title?: string | React.ReactNode;
  subtitle?: string;
  subtitleColor?: ColorValue;
  showHamburger?: boolean;
  showBack?: boolean;
  profileImage?: string;
  showProfileStatusIcon?: boolean;
  onProfilePress?: () => void;
  profileViewStyle?: StyleProp<ViewStyle>;
  showAppIcon?: boolean;
  showAppBannerIcon?: boolean;
  showSearchIcon?: boolean;
  rightIcons?: HeaderIconProps[];
  maxVisibleIcon?: number;
  onBackPress?: () => boolean;
  onTitlePress?: () => void;
  searchText?: string;
  setSearchText?: (query: string) => void;
  onSearchSubmit?: (query?: string) => void;
  searchLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  actionButton?: React.ReactNode;
  statusIcon?: { color?: ColorValue; status?: string };
};

function CustomHeader({
  title = DeviceInfo.getApplicationName(),
  maxVisibleIcon = 2,
  ...props
}: Props) {
  const navigation = useAppNavigation(); // use navigation for drawer open and back navigation

  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  const [searchVisible, setSearchVisible] = useState(false); // to show search Text Input

  const [menuVisible, setMenuVisible] = useState(false); // to show menu if right icons are more than 2

  const textInputRef = useRef<TextInput>(null);

  // show and hide menu
  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
  };

  // close menu
  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  // If rights icons are present and are more than maxVisibleIcon than show only maxVisibleIcon icons
  const visibleIcons = props.rightIcons?.slice(0, maxVisibleIcon);
  // rest are shifted to menu
  const hiddenIcons = props.rightIcons?.slice(maxVisibleIcon);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack(); // navigate back
    }
  };
  const isImageURI = (value?: string) => {
    return !!value && (value.includes('/') || value.includes('.')); // Checks if it's likely a URI
  };

  return (
    <View style={styles.main}>
      {searchVisible ? (
        <CustomTextInput
          ref={textInputRef}
          style={styles.searchInput}
          mode={InputVariants.outlined}
          label={t('Search')}
          placeholder={t('Search')}
          showLabel={false}
          showError={false}
          text={props.searchText ?? ''}
          loading={props.searchLoading}
          onChangeText={props.setSearchText ? props.setSearchText : () => {}}
          returnKeyType={InputReturnKeyType.search}
          onSubmitEditing={() => {
            if (props.onSearchSubmit) {
              props.onSearchSubmit(props.searchText);
            }
          }}
          prefixIcon={{
            source: Images.back,
            type: ImageType.svg,
            tap() {
              setSearchVisible(!searchVisible);
            },
          }}
          suffixIcon={{
            source: Images.closeCircle,
            type: ImageType.svg,
            tap() {
              if (props.setSearchText) {
                props.setSearchText('');

                if (props.onSearchSubmit) {
                  props.onSearchSubmit('');
                }
              }
            },
          }}
        />
      ) : (
        <View style={styles.container}>
          <View style={styles.leftContainer}>
            {props.showHamburger && !searchVisible && (
              <Tap
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.dispatch(DrawerActions.openDrawer()); // open drawer
                }}
              >
                <CustomImage
                  source={Images.drawer}
                  type={ImageType.svg}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.headerIcon}
                />
              </Tap>
            )}
            {props.showBack && !searchVisible && (
              <Tap
                disableRipple
                onPress={() => {
                  if (props.onBackPress) {
                    if (props.onBackPress()) {
                      handleGoBack();
                    }
                  } else {
                    handleGoBack();
                  }
                }}
              >
                <CustomImage
                  source={Images.back}
                  type={ImageType.svg}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.headerIcon}
                />
              </Tap>
            )}
            {props.showAppIcon && (
              <CustomImage source={Images.appIcon} style={styles.headerIcon} />
            )}
            <View style={styles.headerWithProfile}>
              {props.profileImage && (
                <Tap
                  style={{ position: 'relative' }}
                  onPress={props.onProfilePress}
                >
                  <>
                    <CustomAvatar
                      source={
                        isImageURI(props.profileImage)
                          ? { uri: props.profileImage }
                          : undefined
                      } // Image URI
                      text={
                        !isImageURI(props.profileImage)
                          ? props.profileImage
                          : undefined
                      } // Show initials
                      viewStyle={[styles.profileImage, props.profileViewStyle]}
                      type={ImageType.png}
                    />

                    {!!props.showProfileStatusIcon &&
                      (props.statusIcon?.status?.trim().toLowerCase() ==
                        'out of office' ||
                      props.statusIcon?.status?.toLowerCase() == 'o' ? (
                        <View style={styles.outOfOffcIconLay}>
                          <CustomImage
                            source={Images.outofOffice}
                            type={ImageType.png}
                            style={styles.outofOfficeIcon}
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.statusIconLay,
                            {
                              backgroundColor: props.statusIcon?.color,
                              borderRadius: theme.extraRoundness,
                            },
                          ]}
                        ></View>
                      ))}
                  </>
                </Tap>
              )}
              {!searchVisible && !props.showAppBannerIcon && (
                <Tap
                  style={styles.titleTap}
                  disableRipple
                  onPress={() => {
                    if (props.onTitlePress) {
                      props.onTitlePress();
                    } else {
                      handleGoBack();
                    }
                  }}
                >
                  <View>
                    <CustomText
                      ellipsis={TextEllipsis.tail}
                      maxLines={1}
                      variant={TextVariants.titleLarge}
                      style={styles.title}
                    >
                      {title}
                    </CustomText>
                    {props.subtitle && (
                      <CustomText
                        color={props.subtitleColor}
                        variant={TextVariants.titleSmall}
                        style={styles.title}
                      >
                        {props.subtitle}
                      </CustomText>
                    )}
                  </View>
                </Tap>
              )}
            </View>
            {props.showAppBannerIcon && (
              <View style={styles.appBannerLay}>
                <CustomImage
                  source={Images.appBanner}
                  //color={theme.colors.onSurfaceVariant}
                  resizeMode={ResizeModeType.contain}
                  style={styles.headerBannerIcon}
                />
              </View>
            )}
          </View>

          <View style={styles.rightContainer}>
            {visibleIcons?.map((icon, index) => (
              <Tap
                key={icon.name}
                onPress={icon.onPress}
                style={[
                  {
                    paddingRight:
                      !props.showSearchIcon && visibleIcons.length - 1 == index
                        ? 17
                        : 0,
                  },
                  styles.rightIcon,
                ]}
              >
                <View>
                  <CustomImage
                    key={index}
                    source={icon.source}
                    type={icon.type}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.headerIcon}
                  />
                  {!!icon.badgeCount && (
                    <Badge style={styles.badge} value={icon.badgeCount} />
                  )}
                </View>
              </Tap>
            ))}
            {props.actionButton && props.actionButton}
            {props.showSearchIcon && (
              <Tap
                onPress={() => {
                  setSearchVisible(!searchVisible);
                  setTimeout(() => {
                    textInputRef.current?.focus();
                  }, 0);
                }}
                style={styles.rightIcon}
              >
                <CustomImage
                  source={Images.search}
                  type={ImageType.svg}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.headerIcon}
                />
              </Tap>
            )}
            {hiddenIcons ? (
              hiddenIcons?.length > 0 ? (
                <Menu
                  visible={menuVisible}
                  onDismiss={handleMenuClose}
                  anchorPosition="bottom"
                  style={{ marginRight: 50 }}
                  anchor={
                    <Tap
                      onPress={() => handleMenuToggle()}
                      style={styles.rightIcon}
                    >
                      <CustomImage
                        source={Images.options}
                        type={ImageType.svg}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.headerIcon}
                      />
                    </Tap>
                  }
                >
                  {hiddenIcons?.map((icon, index) => (
                    <Tap
                      key={index}
                      onPress={() => {
                        handleMenuClose();
                        icon.onPress();
                      }}
                      style={{ padding: 0 }}
                    >
                      <View style={styles.menuItems}>
                        <View>
                          <CustomImage
                            source={icon.source}
                            type={icon.type}
                            color={theme.colors.onSurfaceVariant}
                            style={styles.headerIcon}
                          />
                          {icon.badgeCount ? (
                            <Badge
                              style={styles.badge}
                              value={icon.badgeCount}
                            />
                          ) : (
                            <></>
                          )}
                        </View>
                        <CustomText
                          variant={TextVariants.bodyLarge}
                          style={styles.menuItemsName}
                        >
                          {icon.name}
                        </CustomText>
                      </View>
                    </Tap>
                  ))}
                </Menu>
              ) : (
                <></>
              )
            ) : (
              <></>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      paddingVertical: 5,
      paddingHorizontal: 0,
      backgroundColor: theme.colors.surface,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIcon: {
      height: 25,
      width: 25,
      marginLeft: 7,
    },
    headerBannerIcon: { height: 50, width: 250 },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 20,
    },
    rightIcon: {
      paddingHorizontal: 10,
    },
    outofOfficeIcon: {
      width: 17,
      height: 17,
    },
    statusIconLay: {
      position: 'absolute',
      right: 5,
      bottom: 7,
      borderRadius: theme.extraRoundness, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 10, // Ensure size consistency
      height: 10,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },

    groupDetailsLay: { flex: 1 },
    appBannerLay: { flex: 1, alignItems: 'center' },
    headerWithProfile: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleTap: {
      flex: 1,
      alignSelf: 'center',

      // marginRight: 20,
    },
    titleTapWithoutSubTitle: {
      alignSelf: 'flex-start',
      justifyContent: 'center',
      textAlignVertical: 'center',
    },
    title: {
      flexShrink: 1,
      marginLeft: 5,
      marginRight: 10,
    },
    editIcon: {
      height: 20,
      width: 20,
      marginLeft: 10,
    },
    searchInput: {
      marginHorizontal: 10,
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    menuItems: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 5,
    },
    menuItemsName: {
      //width: 100,
      margin: 10,
    },
    img: {
      height: 30,
      width: 30,
      borderRadius: 50,
    },
    profileImage: {
      borderRadius: theme.roundness,
    },

    outOfOffcIconLay: {
      position: 'absolute',
      right: 0,
      bottom: 4,
      borderRadius: theme.extraRoundness, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 16, // Ensure size consistency
      height: 16,
      backgroundColor: theme.dark
        ? theme.colors.onSurface
        : theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default CustomHeader;
