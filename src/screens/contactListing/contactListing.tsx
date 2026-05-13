import {
  CustomAvatar,
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomHeader,
  CustomTextInput,
  EmptyView,
  LoadMore,
} from '@/components/molecules';
import { HeaderIconProps } from '@/components/molecules/customHeader/customHeader';
import {
  InputReturnKeyType,
  InputVariants,
} from '@/components/molecules/customTextInput/formTextInput';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  CheckIfUserIsEnrolledModel,
  ContactStatusModel,
  GetAllClientsModel,
  GetAllClientsModelItems,
} from '@/services/models';
import { GetCommunityTemplateListItem } from '@/services/models/getCommunityTemplateListModel/getCommunityTemplateListModel';
import signalRService from '@/services/signalRService';
import { appStartStore, badgesStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
  useTabPress,
} from '@/utils/navigationUtils';
import {
  handleKeyboardDismiss,
  isEmpty,
  showSnackbar,
  useDebouncedSearch,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, TextInput, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';
import { FeedParentScreenType } from '../feed/feed';

export type ContactListingProps = {
  fromNotification?: boolean;
};

type ListItem = string | GetAllClientsModelItems;

function ContactListing() {
  /** Added by @Yuvraj 29-03-2025 -> navigate to different screen (FYN-5908) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 29-03-2025 -> get params from parent screen (FYN-5908) */
  const route = useAppRoute('ContactListing');

  /** Added by @Yuvraj 29-03-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-5908) */
  const theme = useTheme();

  /** Added by @Yuvraj 29-03-2025 -> access StylesSheet with theme implemented (FYN-5908) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 29-03-2025 -> translations for labels (FYN-5908) */
  const { t } = useTranslation();

  /**  Added by @Yuvraj 29-03-2025 -> Retrieve user details from store (FYN-5908)*/
  const userDetails = userStore();

  const badges = badgesStore(state => state.badges);

  const ContactStatusList: ContactStatusModel[] = [
    { statusName: t('All'), statusId: -1 },
    { statusName: t('Active'), statusId: 3 },
    { statusName: t('Assigned'), statusId: 1 },
    { statusName: t('NotAssigned'), statusId: 0 },
    { statusName: t('Invited'), statusId: 2 },
  ];

  /** Added by @Yuvraj 29-03-2025 -> loading state for whole ui (FYN-5908) */
  const [loading, setLoading] = useState(false);

  const [apiLoading, setApiLoading] = useState(false);

  /** Added by @Yuvraj 29-03-2025 -> text of search text input state (FYN-5908) */
  const [search, setSearch] = useState<string>('');

  const debouncedSearch = useDebouncedSearch(search, 200);

  const [contactsData, setContactsData] = useState<GetAllClientsModelItems[]>(
    [],
  );

  //loader for search bar
  const [searchLoading, setSearchLoading] = useState(false);

  /** Added by @Yuvraj 29-03-2025 -> state for selected contact to delete (FYN-5908) */
  const [selectedContact, setSelectedContact] =
    useState<GetAllClientsModelItems>();
  /** Added by @Yuvraj 29-03-2025 -> state for selected contact to delete loading (FYN-5908) */
  const [deletingContactLoading, setDeletingContactLoading] =
    useState<GetAllClientsModelItems>();

  /** Added by @Yuvraj 29-03-2025 -> state for poping action sheet for delete (FYN-6256) */
  const [showActionSheetDelete, setShowActionSheetDelete] = useState(false);

  /** Added by @Yuvraj 29-03-2025 -> state to store each contact (FYN-5908) */
  const [allContactsData, setAllContactsData] = useState<
    (string | GetAllClientsModelItems)[]
  >([]);

  /** Added by @Yuvraj 29-03-2025 -> state for poping action sheet for action item and feed (FYN-5997) */
  const [showActionSheet, setShowActionSheet] = useState(false);

  /** Added by @Yuvraj 29-03-2025 -> data as per this detail for actionsheet (FYN-5997) */
  const [actionSheetItem, setActionSheetItem] = useState<
    'actionItem' | 'feedItem'
  >();

  /** Added by @Yuvraj 08-04-2025 -> set selcted contact item (FYN-6456) */
  const [selectedContactItem, setSelectedContactItem] =
    useState<GetAllClientsModelItems>();

  const [hasMoreData, setHasMoreData] = useState(true);

  const setAppStarted = appStartStore(
    state => state.setAppStartedFromNotification,
  ); // set app started value

  const [communityTemplateList, setCommunityTemplateList] =
    useState<GetCommunityTemplateListItem[]>();

  const [selectedFilterItem, setSelectedFilterItem] =
    useState<ContactStatusModel>(ContactStatusList[0]);

  /** Added by @Yuvraj 29-03-2025 -> data for details sections/accordian (FYN-5997) */
  const contactSummaryActionButtons = [
    {
      icon: Images.message,
      onPress: (item: GetAllClientsModelItems) => {
        if (item.status == 3) {
          navigation.navigate('Chat', {
            userChatData: {
              targetUserId: item.id,
              targetUserName: item.userName,
              userFullName: item.userName,
              targetProfilePicture: item.profilePictureURL,
            },
          });
        } else {
          showSnackbar(t('ContactNotActive'), 'danger');
        }
      },
    },
    {
      icon: Images.actionItem,
      onPress: (item: GetAllClientsModelItems) => {
        if (item.status == 3) {
          setSelectedContactItem(item);
          setActionSheetItem('actionItem');
          setShowActionSheet(true);
        } else {
          showSnackbar(t('ContactNotActive'), 'danger');
        }
      },
    },
    {
      icon: Images.newspaper,
      onPress: (item: GetAllClientsModelItems) => {
        if (item.status == 3) {
          setSelectedContactItem(item);
          setActionSheetItem('feedItem');
          setShowActionSheet(true);
        } else {
          showSnackbar(t('ContactNotActive'), 'danger');
        }
      },
    },
    {
      icon: Images.contactUs,
      onPress: (item: GetAllClientsModelItems) => {
        if (item.phoneNumber && item?.countryCode) {
          let phoneNumber = '';
          if (Platform.OS === 'android') {
            phoneNumber = `tel:${item?.countryCode} ${item?.phoneNumber}`;
          } else {
            phoneNumber = `telprompt:${item?.countryCode} ${item?.phoneNumber}`;
          }
          Linking.openURL(phoneNumber);
        } else {
          if (item.status !== 3) {
            showSnackbar(t('ContactNotActive'), 'danger');
          } else {
            showSnackbar(t('PhoneNumberNotAvail'), 'danger');
          }
        }
      },
    },
  ];

  const { receiveDataBack } = useReturnDataContext();

  /** Added by @Yuvraj 29-03-2025 -> initial api call (FYN-5908) */
  useEffect(() => {
    if (userDetails.userDetails) {
      //initializeSignalR();
      signalRService.start();
      setAppStarted(true);
      fetchAllContacts({ skipCounts: 0 });
    }
  }, []);

  const inputRef = useRef<TextInput>(null); // Ref to control blur

  /** Added by @Yuvraj 05-08-2025 -> dismiss keyboard on blur */
  handleKeyboardDismiss(inputRef);

  /** Added by @Yuvraj 22-04-2025 -> to call api on tap (FYN-5908) */
  useTabPress(() => {
    if (userDetails.userDetails) {
      setSearch('');
      fetchAllContacts({ skipCounts: 0 });
    }
  });

  useEffect(() => {
    if (route.params?.fromNotification) {
      hideLoader();
    }
  }, [route.params?.fromNotification]);

  /** Added by @Yuvraj 29-03-2025 -> rapidly search handling of contact (FYN-5908) */
  useEffect(() => {
    if (userDetails.userDetails) {
      if (debouncedSearch !== undefined && debouncedSearch.length > 0) {
        setSearchLoading(true);
        fetchAllContacts({
          skipCounts: 0,
          filterString: debouncedSearch.trim().toLowerCase(),
        });
      }
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (userDetails.userDetails != undefined) {
      setHeaderRightIcons();
    }
  }, [userDetails.userDetails, badges]);

  const handleSearch = (query: string) => {
    setSearch(query);
    if (query.length === 0) {
      fetchAllContacts({ skipCounts: 0 });
    }
  };

  /** Added by @Yuvraj 29-03-2025 -> header icons function (FYN-5908) */
  const setHeaderRightIcons = (notificationCount?: number) => {
    const menuOptions: HeaderIconProps[] = [];

    menuOptions.push({
      name: t('Notification'),
      source: Images.notification,
      type: ImageType.svg,
      badgeCount: notificationCount ?? badges?.notificationCount,
      onPress: () => navigation.navigate('Notifications'),
    });

    return menuOptions;
  };

  const loadMoreItems = () => {
    if (hasMoreData && !apiLoading) {
      fetchAllContacts({
        skipCounts: contactsData.length,
        filterString: search?.trim(),
      });
    }
  };

  //handle more data on contact api call
  const handleMoreData = (
    totalCount?: number,
    items?: GetAllClientsModelItems[],
  ) => {
    if (totalCount && items && totalCount > items?.length) {
      setHasMoreData(true);
    } else {
      setHasMoreData(false);
    }
  };

  /* setting variable if we are heading to second page but the name category
        is same so wont show the name category again */
  const handlePageSectionData = (
    data: GetAllClientsModel,
    skipCount: number,
  ) => {
    if (skipCount > 0) {
      const lastItem = allContactsData[allContactsData.length - 1];
      var currentAlphabet =
        typeof lastItem === 'string'
          ? lastItem
          : lastItem.userName?.slice(0, 1)!;
    } else {
      var currentAlphabet = '';
    }

    // manipulating the api data
    const newItems =
      data?.items?.flatMap(item => {
        if (!item.userName) return []; // Ensure no undefined values
        if (
          currentAlphabet.toLowerCase() ==
          item.userName.slice(0, 1).toLowerCase()
        ) {
          return [{ ...item }];
        } else {
          currentAlphabet = item.userName.slice(0, 1).toLowerCase();
          return [item.userName.slice(0, 1).toUpperCase(), { ...item }];
        }
      }) || [];
    // Remove duplicates based on id
    const updatedContacts = [
      ...(skipCount === 0 ? [] : allContactsData),
      ...newItems,
    ].filter((item, index, self) => {
      if (typeof item === 'string') {
        return true; // Keep all strings — do not deduplicate
      }
      // Deduplicate objects by id
      return (
        index === self.findIndex(t => typeof t !== 'string' && t.id === item.id)
      );
    });
    setAllContactsData(updatedContacts);
  };

  /** Added by @Yuvraj 29-03-2025 -> to remove contact from contact
   * list but remove category also if only contact is there (FYN-5908) */
  function removeItemAndHeaderIfEmptyById(
    list: ListItem[],
    idToRemove: number,
  ): ListItem[] {
    const newList = [...list];
    const index = newList.findIndex(
      item => typeof item === 'object' && item.id === idToRemove,
    );

    if (index === -1) return newList; // Item not found

    // Step 1: Remove the item
    newList.splice(index, 1);

    // Step 2: Find the preceding header
    let headerIndex = index - 1;
    while (headerIndex >= 0 && typeof newList[headerIndex] !== 'string') {
      headerIndex--;
    }

    // Step 3: Check if any more items under that header
    const nextHeaderIndex = newList.findIndex(
      (item, i) => i > headerIndex && typeof item === 'string',
    );

    const itemsUnderHeader = newList.slice(
      headerIndex + 1,
      nextHeaderIndex === -1 ? newList.length : nextHeaderIndex,
    );

    const hasItemsLeft = itemsUnderHeader.some(
      item => typeof item === 'object',
    );

    if (!hasItemsLeft && headerIndex !== -1) {
      newList.splice(headerIndex, 1); // remove the header too
    }

    return newList;
  }

  const renderContactStatusFilter = (item: ContactStatusModel) => {
    const ellipsis = item?.statusName && item?.statusName?.length > 20;
    return (
      <Tap
        key={item.statusId}
        onPress={() => {
          setSelectedFilterItem(item);
          fetchAllContacts({
            skipCounts: 0,
            filterString: debouncedSearch,
            statusId: item.statusId,
          });
        }}
        style={{
          ...styles.filterContainer,
          backgroundColor:
            item.statusId == selectedFilterItem?.statusId
              ? theme.colors.primary
              : undefined,
        }}
      >
        <CustomText
          color={
            item.statusId == selectedFilterItem?.statusId
              ? theme.colors.onPrimary
              : undefined
          }
          style={styles.filterText}
          variant={TextVariants.bodyMedium}
        >
          {ellipsis ? `${item.statusName?.slice(0, 20)}...` : item.statusName}
        </CustomText>
      </Tap>
    );
  };

  /** Added by @Yuvraj 29-03-2025 -> render item for customflatlist (FYN-5908) */
  const renderContactItem = (item: GetAllClientsModelItems | string) => {
    return typeof item == 'string' ? (
      <Shadow style={styles.categoryTitle}>
        <CustomText
          variant={TextVariants.titleLarge}
          color={theme.colors.onPrimary}
        >
          {item}
        </CustomText>
      </Shadow>
    ) : (
      <Shadow
        onLongPress={() => {
          setShowActionSheetDelete(true);
          setSelectedContact(item);
        }}
        style={styles.contactItemContainer}
      >
        <>
          <Tap
            onPress={() =>
              navigation.navigate('Profile', {
                userId: item.id,
              })
            }
            style={styles.contactTileHeader}
          >
            <>
              <Tap
                style={styles.contactImageTap}
                onPress={
                  item.profilePictureURL
                    ? () => {
                        if (item.profilePictureURL) {
                          const imageList = [item?.profilePictureURL!];
                          showImagePopup({
                            imageList: imageList,
                            defaultIndex: 0,
                          });
                        }
                      }
                    : undefined
                }
              >
                <CustomAvatar
                  source={
                    !isEmpty(item.profilePictureURL) && {
                      uri: item.profilePictureURL,
                    }
                  }
                  text={
                    isEmpty(item.profilePictureURL) ? item.userName : undefined
                  }
                  viewStyle={styles.contactImage}
                  imageStyle={styles.contactImage}
                />
              </Tap>
              <View style={styles.main}>
                <View style={styles.contactNameContainer}>
                  <CustomText
                    style={styles.main}
                    maxLines={1}
                    ellipsis={TextEllipsis.tail}
                    variant={TextVariants.bodyLarge}
                  >
                    {item.userName}
                  </CustomText>
                  <Tap
                    onPress={() => {
                      setShowActionSheetDelete(true);
                      setSelectedContact(item);
                    }}
                    style={styles.contactOption}
                  >
                    <CustomImage
                      source={Images.options}
                      type={ImageType.svg}
                      color={theme.colors.outline}
                      style={styles.editIcon}
                    />
                  </Tap>
                </View>
                <CustomText variant={TextVariants.bodySmall}>
                  {item.emailAddress}
                </CustomText>
                <View
                  style={{
                    ...styles.active,
                    backgroundColor:
                      item.status == 3
                        ? theme.colors.green
                        : item.status == 1
                        ? theme.colors.orange
                        : item.status == 0
                        ? theme.colors.outlineVariant
                        : item.status == 2
                        ? theme.colors.blue
                        : undefined,
                  }}
                >
                  <CustomText
                    color={
                      item.statusName == 'Not Assigned'
                        ? theme.colors.onSurface
                        : theme.dark
                        ? theme.colors.inverseSurface
                        : theme.colors.surface
                    }
                    variant={TextVariants.labelSmall}
                  >
                    {item.statusName}
                  </CustomText>
                </View>
              </View>
            </>
          </Tap>
          <View style={styles.actionItemsContainer}>
            <View style={styles.contactGradient}>
              {contactSummaryActionButtons.map((actionItem, index) => (
                <Tap
                  key={`contactsummaryIcons-${index}`}
                  onPress={() => actionItem.onPress(item)}
                  style={{
                    ...styles.contactHeaderItem,
                    borderRightWidth:
                      contactSummaryActionButtons.length - 1 == index ? 0 : 1,
                  }}
                >
                  <CustomImage
                    source={actionItem.icon}
                    type={ImageType.svg}
                    color={
                      item.phoneNumber && actionItem.icon == Images.contactUs
                        ? theme.colors.onSurfaceVariant
                        : item.status == 3 &&
                          actionItem.icon !== Images.contactUs
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onSurfaceDisabled
                    }
                    style={styles.editIcon}
                  />
                </Tap>
              ))}
            </View>
          </View>
          {deletingContactLoading?.id == item.id && (
            <ActivityIndicator style={styles.contactActivityIndicator} />
          )}
        </>
      </Shadow>
    );
  };

  /** Added by @Yuvraj 29-03-2025 -> function for calling api (FYN-5908) */
  const fetchAllContacts = ({
    skipCounts,
    filterString,
    statusId,
  }: {
    skipCounts: number;
    filterString?: string;
    statusId?: number;
  }) => {
    getAllClientsApi.mutate({
      SkipCount: skipCounts,
      Filter: !isEmpty(filterString) ? filterString : undefined,
      callPoint: 'App',
      status:
        statusId || statusId == 0 ? statusId : selectedFilterItem.statusId,
    });
  };

  /** Added by @Yuvraj 29-03-2025 -> detils for all contacts (FYN-5908) */
  const getAllClientsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllClientsModel>({
        endpoint: ApiConstants.GetAllClients,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setApiLoading(true); // api loading true to stop multiple api calls
      if (variables.SkipCount == 0) {
        // using page no from variable as it is updating more fast than state
        if (!loading) {
          setLoading(true); // to show skeleton loader
        }
      }
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false); // api loading false
      setSearchLoading(false);
      if (variables.SkipCount == 0) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result?.items && data.result.items.length > 0) {
        // Map the statusId to statusName for each item
        data.result.items = data.result.items.map(item => {
          const status = ContactStatusList.find(
            status => status.statusId === item.status,
          );
          return {
            ...item,
            statusName: status?.statusName, // Add statusName to each item
          };
        });

        const updatedList =
          variables.SkipCount > 0
            ? [...contactsData, ...data.result.items]
            : [...data.result.items];

        setContactsData(updatedList);
        handleMoreData(data.result.totalCount, updatedList);

        /* setting variable if we are heading to second page but the name category
        is same so wont show the name category again */
        handlePageSectionData(data?.result, variables.SkipCount);
      } else {
        setHasMoreData(false);
        if (variables.SkipCount == 0) {
          setAllContactsData([]);
        }
      }
    },
    onError(error, variables, context) {
      setHasMoreData(false);
      setSearchLoading(false);
      if (variables.SkipCount == 0) {
        setAllContactsData([]);
      }
    },
  });

  /** Added by @Yuvraj 29-03-2025 -> detils for all contacts (FYN-5908) */
  const CheckIfUserIsEnrolledApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<CheckIfUserIsEnrolledModel>({
        endpoint: ApiConstants.CheckIfUserIsEnrolled,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setDeletingContactLoading(selectedContact);
    },
    onSettled(data, error, variables, context) {
      setShowActionSheetDelete(false);
      setDeletingContactLoading({});
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        if (data.result?.isUserEnrolled) {
          // CancelAllEnrollment
          showAlertPopup({
            title: t('Confirm'),
            msg: data.result?.message,
            PositiveText: t('Yes'),
            NegativeText: t('No'),
            onPositivePress: () => {
              CancelAllEnrollmentApi.mutate({
                id: selectedContact?.id,
              });
            },
            onNegativePress: () => setSelectedContact({}),
          });
        } else {
          // DeleteUser
          showAlertPopup({
            title: t('Confirm'),
            msg: t('DeleteContact'),
            PositiveText: t('Yes'),
            NegativeText: t('No'),
            onPositivePress: () => {
              DeleteUserApi.mutate({
                id: selectedContact?.id,
              });
            },
            onNegativePress: () => setSelectedContact({}),
          });
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 29-03-2025 -> to cancel all enrollments if enrolled (FYN-5908) */
  const CancelAllEnrollmentApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.CancelAllEnrollment,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setDeletingContactLoading(selectedContact);
    },
    onSettled(data, error, variables, context) {
      setDeletingContactLoading(selectedContact);
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        DeleteUserApi.mutate({
          id: selectedContact?.id,
        });
      } else {
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 29-03-2025 -> to delete the contact (FYN-5908) */
  const DeleteUserApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.DeleteUser,
        method: HttpMethodApi.Delete,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setDeletingContactLoading(selectedContact);
    },
    onSettled(data, error, variables, context) {
      setDeletingContactLoading({});
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        const result = removeItemAndHeaderIfEmptyById(
          allContactsData,
          selectedContact?.id!,
        );

        setAllContactsData(result);

        showSnackbar(t('ContactDeleted'), 'success');
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader
          showHamburger
          title={t('Contacts')}
          rightIcons={setHeaderRightIcons()}
        />
        <CustomTextInput
          ref={inputRef}
          style={styles.searchInput}
          mode={InputVariants.outlined}
          label={t('Search')}
          placeholder={t('Search')}
          showLabel={false}
          showError={false}
          text={search}
          loading={searchLoading}
          onChangeText={handleSearch}
          returnKeyType={InputReturnKeyType.search}
          onSubmitEditing={() => {
            handleSearch(search);
          }}
          prefixIcon={{
            source: Images.search,
            type: ImageType.svg,
          }}
          suffixIcon={
            search.length > 0
              ? {
                  source: Images.closeCircle,
                  type: ImageType.svg,
                  tap() {
                    handleSearch('');
                  },
                }
              : undefined
          }
        />
        <View style={styles.blankContainer}></View>
        <View>
          <ScrollView horizontal={true} style={styles.filterScrollView}>
            {ContactStatusList.map(item => {
              return renderContactStatusFilter(item);
            })}
          </ScrollView>
        </View>
        {loading ? (
          <SkeletonList count={9}>
            <View style={styles.shadowContainerSkeleton}>
              <View style={styles.skeletonUpperContainer}>
                <View style={styles.skeletonContactImageTap}></View>
                <View style={styles.skeletonTitleContainer}>
                  <View style={styles.skeletonTitle}></View>
                  <View style={styles.skeletonSubTitle}></View>
                </View>
              </View>
              <View style={styles.contactSummarySkeletonActionItems}>
                <View style={styles.contactSummarySkeletonActionItem} />
                <View style={styles.contactSummarySkeletonActionItem} />
                <View style={styles.contactSummarySkeletonActionItem} />
                <View style={styles.contactSummarySkeletonActionItem} />
              </View>
            </View>
          </SkeletonList>
        ) : (
          <View style={{ flex: 1 }}>
            <CustomFlatList
              data={allContactsData}
              keyExtractor={(item, index) =>
                `${typeof item == 'string' ? item : item.id}-${
                  typeof item == 'string' ? index : item.primaryAdvisor
                }`
              }
              refreshing={loading}
              onRefresh={() => {
                fetchAllContacts({ skipCounts: 0 });
                setSearch('');
              }}
              extraData={[selectedContact, deletingContactLoading]}
              onEndReachedThreshold={0.6}
              onEndReached={loadMoreItems}
              ListEmptyComponent={
                <EmptyView
                  style={styles.noDataContainer}
                  imageColor={theme.colors.onSurfaceVariant}
                  label={t('NoContacts')}
                />
              }
              ListFooterComponent={
                hasMoreData ? <LoadMore /> : <View style={styles.listFooter} />
              }
              renderItem={({ item }) => renderContactItem(item)}
            />
          </View>
        )}
        <CustomActionSheetPoup
          shown={showActionSheet}
          setShown={setShowActionSheet}
          centered={false}
          hideIcons={false}
          title={actionSheetItem == 'actionItem' ? t('ActionItem') : t('Feed')}
          children={[
            {
              image: Images.addSquare,
              imageType: ImageType.svg,
              title:
                actionSheetItem == 'actionItem'
                  ? t('AddActionItem')
                  : t('AddPost'),
              onPress: () => {
                if (actionSheetItem == 'actionItem') {
                  navigation.navigate('AddActionItem', {
                    userId: selectedContactItem?.id,
                  });
                } else {
                  navigation.navigate('CreatePost', {
                    selectedUserId: selectedContactItem?.id,
                    navigationFrom: FeedParentScreenType.contactListing,
                  });
                }
              },
            },
            {
              title:
                actionSheetItem == 'actionItem'
                  ? t('ViewActionItem')
                  : t('ViewFeed'),
              image:
                actionSheetItem == 'actionItem'
                  ? Images.actionItem
                  : Images.newspaper,
              imageType: ImageType.svg,
              onPress: () => {
                if (actionSheetItem == 'actionItem') {
                  navigation.navigate('ActionItemList', {
                    userId: selectedContactItem?.id,
                  });
                } else {
                  navigation.navigate('ContactFeed', {
                    selectedUserId: selectedContactItem?.id,
                    navigationFrom: FeedParentScreenType.contactListing,
                  });
                }
              },
            },
          ]}
        />
        <CustomActionSheetPoup
          shown={showActionSheetDelete}
          setShown={setShowActionSheetDelete}
          centered={false}
          hideIcons={false}
          onCancelClick={() => {}}
          children={[
            {
              title: t('Delete'),
              titleColor: theme.colors.error,
              imageColor: theme.colors.error,
              image: Images.delete,
              imageType: ImageType.svg,
              onPress: () => {
                CheckIfUserIsEnrolledApi.mutate({
                  userId: selectedContact?.id,
                });
              },
            },
          ]}
        />
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    searchInput: {
      marginHorizontal: 14,
    },
    blankContainer: {
      height: 10,
    },
    shadowContainerSkeleton: {
      padding: 0,
      borderWidth: 1,
      marginVertical: 15,
      marginHorizontal: 15,
      borderRadius: theme.roundness,
    },
    skeletonUpperContainer: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 5,
      alignItems: 'center',
      gap: 20,
    },
    skeletonTitleContainer: {
      gap: 5,
    },
    skeletonTitle: {
      height: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: 150,
    },
    skeletonSubTitle: {
      height: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: 100,
    },
    contactSummarySkeletonActionItems: {
      padding: 15,
      width: '100%',
      marginTop: 5,
      borderColor: theme.colors.surface,
      borderTopWidth: 0.5,
      borderRadius: theme.roundness,
      justifyContent: 'space-around',
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactSummarySkeletonActionItem: {
      height: 25,
      width: 25,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    skeletonContactImageTap: {
      height: 50,
      width: 50,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    contactImageTap: {
      height: 50,
      width: 50,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    contactImage: {
      height: 50,
      width: 50,
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    contactGradient: {
      flexDirection: 'row',
      width: '100%',
      borderRadius: theme.roundness,
      paddingVertical: 10,
    },
    contactHeaderItem: {
      borderRightColor: theme.colors.onSurfaceVariant,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: 20,
    },
    editIcon: {
      height: 20,
      width: 20,
    },
    noDataContainer: {
      height: 500,
    },
    categoryTitle: {
      backgroundColor: theme.colors.primary,
      marginHorizontal: 15,
      marginVertical: 7,
      paddingVertical: 2,
    },
    contactItemContainer: {
      padding: 0,
      marginVertical: 7,
      marginHorizontal: 15,
    },
    contactTileHeader: {
      flexDirection: 'row',
      padding: 10,
      gap: 15,
      //alignItems: 'center',
      borderRadius: theme.roundness,
    },
    contactNameContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    contactOption: {
      width: 40,
      height: 27,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionItemsContainer: {
      borderRadius: theme.roundness,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.onSurfaceVariant,
    },
    contactActivityIndicator: {
      position: 'absolute',
      alignSelf: 'center',
      top: 0,
      bottom: 0,
    },
    listFooter: {
      height: 20,
    },
    titleLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    programName: {
      flex: 1,
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

    skeletonMain: {
      marginHorizontal: 16,
      marginVertical: 10,
      borderWidth: 0.5,
      borderColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 10,
    },
    skeletonNameLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    nameSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 120,
      height: 20,
    },
    dateSkel: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: 100,
      height: 20,
    },
    descriptionSkeleton: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '50%',
      height: 10,
      marginTop: 20,
    },
    descriptionSkeleton1: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 10,
      marginTop: 10,
    },
    filterContainer: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      borderColor: theme.colors.primary,
      padding: 5,
      marginVertical: 5,
      marginRight: 10,
      alignSelf: 'center',
    },
    filterText: {
      marginHorizontal: 4,
      marginBottom: 2,
    },
    filterScrollView: {
      marginHorizontal: 15,
      paddingBottom: 5,
    },
    active: {
      paddingTop: Platform.OS == 'ios' ? 3 : 1,
      paddingBottom: 2,
      paddingHorizontal: 8,
      textAlignVertical: 'center',
      marginTop: 5,
      alignSelf: 'flex-start',
      borderRadius: theme.roundness,
    },
  });

export default ContactListing;
