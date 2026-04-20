import {
  CachedImage,
  ClickRotateIcon,
  CustomAvatar,
  CustomFlatList,
  CustomImage,
  CustomText,
  HtmlRender,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import CustomFlatListNew from '@/components/atoms/customFlatList/customFlatListNew';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomBottomPopup,
  CustomHeader,
  CustomImagePicker,
  CustomPopup,
  CustomTextInput,
  EmptyView,
  LoadMore,
} from '@/components/molecules';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetLinkPreviewHTMLModel,
  GetProfilePictureModel,
  GetUserChatMessagesModel,
  SignalRMessageModel,
  UploadFileListToS3Model,
  UserChatList,
} from '@/services/models';
import { UserChatMessageItem } from '@/services/models/getUserChatMessagesModel/getUserChatMessagesModel';
import signalRService from '@/services/signalRService';
import { tenantDetailStore, useFailedMessageStore, userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { checkIsFileExist, DownloadChatFile } from '@/utils/fileDownloadUtils';
import Log from '@/utils/logger';
import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { removeMessageNotifications } from '@/utils/notificationUtils';
import {
  extractLinkPreviewHtml,
  formatDate,
  formatDateUtcReturnLocalTime,
  getUtcWithTimeOnly,
  HapticFeedbackTypes,
  hapticTrigger,
  internetReachable,
  isEmpty,
  processHtmlContent,
  showSnackbar,
  useBackPressHandler,
  useCustomInAppBrowser,
} from '@/utils/utils';
import {
  LegendListRef,
  ViewabilityConfigCallbackPair,
  ViewToken,
} from '@legendapp/list';
import Clipboard from '@react-native-clipboard/clipboard';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Asset } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { ActivityIndicator, Divider } from 'react-native-paper';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import { ChatGroupMemberParent } from '../chatGroupMember/chatGroupMember';
import { MessageReturnProp } from '../message/message';
import { UserStatus } from '../profile/profile';

const screenWidth = Dimensions.get('window').width * 0.75;
const screenHeight = Dimensions.get('window').height * 0.4;

/**
 *  Added by @Akshita 05-02-25 --->  Enum to identify from which screen user
 * to coming on the chat screen (FYN-4314)*/
export enum ChatScreenParent {
  fromNotification = 'fromNotification',
  fromMessages = 'fromMessages',
}

/**
 *  Added by @Akshita 05-02-25 --->  Chat screen prop type sent by the parent screen (FYN-4314)*/
export type ChatProps = {
  screenType?: ChatScreenParent;
  userChatData?: UserChatList;
  type?: string;
};

/** Added by @Akshita 05-02-25 --->  Chat screen ChatReturnProp type (FYN-4314)*/
export type ChatReturnProp = {
  memberList: UserChatList[];
  groupName: string;
  groupImage: string;
  memberCount: number;
  leftGroup: boolean;
  media?: Asset[];
  message?: string;
};

function Chat() {
  /** Added by @Akshita 05-02-25 --->Hook to handle navigation within the app (FYN-4314)*/
  const navigation = useAppNavigation();

  /** Added by @Akshita 05-02-25 ---> Hook to handle screen params route (FYN-4314)*/
  const route = useAppRoute('Chat');

  /** Added by @Akshita 05-02-25 ---> theme for consistent UI styling throughout the component (FYN-4314)*/
  const theme = useTheme();

  /** Added by @Akshita 05-02-25 --->  Dynamically creating styles based on the current theme(FYN-4314)*/
  const styles = makeStyles(theme);

  /** Added by @Akshita 05-02-25 ---> Translation hook for handling multilingual support  (FYN-4314)*/
  const { t } = useTranslation();

  /** Added by @Akshita 05-02-25 --->  Fetching user details from the global store(FYN-4314)*/
  const userDetails = userStore(state => state.userDetails);

  /** Added by @Akshita 05-02-2025 -> tenant details store  */
  const tenantDetail = tenantDetailStore();

  /** Added by @Akshita 05-02-25 ---> Tracks the current page of chat data for pagination. (FYN-4314)*/
  const [pageNumber, setPageNumber] = useState(1);

  /** Added by @Akshita 05-02-25 ---> Controls loading status for refreshing data. (FYN-4314)*/
  const [loading, setLoading] = useState(false);

  const [isRetrying, setIsRetrying] = useState(false);

  /** Added by @Akshita 05-02-25 ---> Tracks if more data is available for infinite scroll (FYN-4314)*/
  const [moreFeedsAvailable, setMoreFeedsAvailable] = useState(true);

  /** Added by @Akshita 05-02-25 ---> Tracks the loading status while adding a new message  (FYN-4314)*/
  const [newMessageLoading, setNewMessageLoading] =
    useState<SignalRMessageModel>();

  const [newMessageReceived, setNewMessageReceived] = useState(false);

  const internetAvailable = internetReachable();

  /**
   * Added by @Akshita 05-02-25 ---> Prevents multiple API calls simultaneously to
   * handle the pagination  (FYN-4314)*/
  const [apiLoading, setApiLoading] = useState(false);

  //Added by @akshita 15-11-24---> Reference to the FlatList for programmatic scrolling (#15657)
  const flatListRef = useRef<LegendListRef>(null);

  /** Added by @Akshita 05-02-25 --->  Stores the chat messages fetched from the server (FYN-4314)*/
  const [allChatList, setAllChatList] = useState<
    (string | UserChatMessageItem)[]
  >([]);

  /** Added by @Akshita 05-02-25 --->  Controls visibility of the image picker popup (FYN-4314)*/
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);

  /** Added by @Akshita 05-02-25 --->   Controls visibility of the admin action sheet popup (FYN-4314)*/
  const [showAdminActionSheetPopUp, setShowAdminActionSheetPopUp] =
    useState(false);

  /** Added by @Akshita 05-02-25 --->   Controls visibility of the admin action sheet popup (FYN-4314)*/
  const [isSystemCreatedGroup, setIsSystemCreatedGroup] = useState(false);

  /** Added by @Akshita 05-02-25 ---> List of selected media (images/videos) to be sent with messages (FYN-4314)*/
  const [mediaList, setMediaList] = useState<Asset[]>([]);

  /** Added by @Akshita 05-02-25 ---> to open in app browser links from comments(FYN-4314)*/
  const openInAppBrowser = useCustomInAppBrowser();

  /** Added by @Akshita 05-02-25 ---> List to store the members added in the group (FYN-4314)*/
  const [selectedContacts, setSelectedContacts] = useState<UserChatList[]>([]);

  const [groupMemberApiLoading, setGroupMemberApiLoading] = useState(true);

  /** Added by @Akshita 05-02-25 ---> List to store the members added in the group (FYN-4314)*/
  const [outOfOfficeMembers, setOutOfOfficeMembers] = useState<UserChatList[]>(
    [],
  );

  /** Added by @Akshita 05-02-25 ---> List to store the members added in the group (FYN-4314)*/
  const [showOutOfOfcPopUp, setShowOutOfOfcPopUp] = useState(false);

  /** Added by @Akshita 05-02-25 ---> state to store the chat info sent from the parent screen (FYN-4314)*/
  const [userChatData, setUserChatData] = useState<UserChatList>(
    route.params?.userChatData!,
  );

  /**
   * Added by @Akshita 05-02-25 ---> hooks to handle data whenever chat screen info gets
   *  updated from parent or child screen (FYN-4314)*/
  const { sendDataBack, receiveDataBack } = useReturnDataContext();

  const [userAvailabilityStatus, setUserAvailabilityStatus] = useState('');
  /** Added by @Yuvraj 01-09-25 ---> haptice restriction triggering on first render */
  const isFirstRender = useRef(true);

  const lastMessage = useRef<SignalRMessageModel>(undefined);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showOutOfOfcMsgAboveTextBox, setShowOutOfOfcMsgAboveTextBox] =
    useState(false);
  const [deletePopupLoading, setDeletePopupLoading] = useState(false);

  const signalRStore = useSignalRStore();

  const [message, setMessage] = useState('');

  const [subtitle, setSubtitle] = useState<{ text: string; color?: string }>();

  const [linkPreviewResult, setLinkPreviewResult] =
    useState<GetLinkPreviewHTMLModel>();

  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  // // ✅ collapse state: key is ALWAYS string
  // const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  // // ✅ normalize any id (string/number/undefined) into a safe string key
  // const getCollapseKey = (id: string | number | null | undefined) =>
  //   id === null || id === undefined ? '' : String(id);

  // // ✅ read collapsed state (default: true)
  // const isCollapsed = (id: string | number | null | undefined) => {
  //   const key = getCollapseKey(id);
  //   if (!key) return true;
  //   return collapsedMap[key] ?? true;
  // };

  // // ✅ toggle collapsed state safely
  // const toggleCollapsed = (id: string | number | null | undefined) => {
  //   const key = getCollapseKey(id);
  //   if (!key) return;

  //   setCollapsedMap(prev => ({
  //     ...prev,
  //     [key]: !(prev[key] ?? true),
  //   }));
  // };

  const toggleMessageCollapsed = (id?: string | number | null) => {
    if (!id) return;
    const key = String(id);

    setAllChatList(prev => {
      const idx = prev.findIndex(
        x => typeof x !== 'string' && String(x.id) === key,
      );
      if (idx === -1) return prev;

      const msg = prev[idx] as UserChatMessageItem;

      // create a new array but change ONLY one item reference
      const next = prev.slice();
      next[idx] = { ...msg, collapsed: !(msg as any).collapsed };
      return next;
    });
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      if (pageNumber == 1) {
        setTimeout(() => {
          scrollToBottom();
        }, 200); // smooth layout
      }
    });

    return () => {
      showSub.remove();
    };
  }, []);

  useEffect(() => {
    // initializeSignalR();
    signalRService.start();

    signalRStore.setMessageList(undefined);
    signalRStore.setUserWithUpdatedStatus(undefined);
    setNewMessageLoading(undefined);
    handleStatusHeader();

    if (isEmpty(userChatData.groupId)) {
      setShowOutOfOfcMsgAboveTextBox(true);
    }

    if (route.params?.screenType == 'fromMessages' && userChatData?.groupId) {
      callGetUserChatMessagesApi(1);
      getFriendsForGroupV2Api.mutate({
        GroupId: userChatData?.groupId,
      });
    } else if (route.params?.screenType != 'fromNotification') {
      callGetUserChatMessagesApi(1);
    }
  }, []);

  useEffect(() => {
    if (route.params?.screenType == 'fromNotification') {
      initializeChat();
      callGetUserChatMessagesApi(1);

      const isGroup =
        userChatData?.groupId &&
        userChatData.groupId != '00000000-0000-0000-0000-000000000000';

      getProfilePictureApi.mutate({
        userId: !isGroup ? userChatData?.targetUserId : undefined,
        groupId: isGroup ? userChatData?.groupId : undefined,
      });
      hideLoader();

      if (isGroup) {
        getFriendsForGroupV2Api.mutate({
          GroupId: userChatData?.groupId,
        });
      }
    }
  }, [route.params?.screenType]);

  /**
   *  Added by @Akshita 25-03-25 ---> useEffect to handle incoming SignalR
   *  messages and update chat list dynamically (FYN-4314) */

  useEffect(() => {
    if (userDetails) {
      /**
       * Added by @Akshita 25-03-25 ---> Function to process received message and
       * update the chat list accordingly (FYN-4314) */
      const handleMessageReceived = (message: SignalRMessageModel) => {
        if (!lastMessage.current) {
          lastMessage.current = message;
        } else if (
          message.sharedMessageId != lastMessage.current?.sharedMessageId
        ) {
          lastMessage.current = message;
        } else {
          // to stop repeating message count
          return;
        }

        // Check if this message belongs to the opened group or chat
        const isCurrentChat =
          (message.groupId &&
            message.groupId.toLowerCase() ==
              userChatData.groupId?.toLowerCase()) ||
          (!message.groupId &&
            message.targetUserId &&
            message.targetUserId === userChatData.targetUserId);

        if (!isCurrentChat) {
          Log('⚡ Message ignored: Different group or chat.');
          // 🛑 Important: Clear new message loading if not for this chat
          setNewMessageLoading(undefined);
          return;
        } else {
          setNewMessageLoading(message);
          if (scrolledPastThree) {
            setNewMessageReceived(true);
          }

          // Trigger haptic effect before binding message to UI

          if (message.side == 2 && !isFirstRender.current) {
            hapticTrigger(HapticFeedbackTypes.impactHeavy);
          }

          isFirstRender.current = false;

          // Parse metaData if it's a string and not already an object
          if (
            !isEmpty(message.metaData) &&
            typeof message.metaData === 'string'
          ) {
            message.metaData = JSON.parse(message.metaData);
          }

          const newMsg = JSON.stringify(message);
          const parsedNewMsg: UserChatMessageItem = JSON.parse(newMsg);
          // Call checkUserMessage with the properly formatted message
          checkUserMessage(parsedNewMsg, 'signalR');
        }
      };

      /**
       * Added by @Akshita 25-03-25 ---> Call handleMessageReceived only when
       * signalRMessageReceived is available (FYN-4314) */
      if (signalRStore.messageList) {
        handleMessageReceived(signalRStore.messageList);
      }
    }
  }, [signalRStore.messageList]); // ✅ Added dependencies

  useEffect(() => {
    if (userDetails) {
      /**
       *Added by @Akshita 23-07-25 ---> Function to handle the status update and update the 
       outOfOfficeMembers status in the list */

      const handleStatusUpdate = (data: SignalRMessageModel) => {
        Log('Status update received=>' + JSON.stringify(data));
        if (data.status) {
          const isCurrentGroupChat = !isEmpty(userChatData.groupId);

          if (isCurrentGroupChat) {
            const updatedMembers = outOfOfficeMembers.filter(
              member => member.userId !== data.userId,
            );

            const updatedTotalContactList = selectedContacts.map(contact => {
              if (contact.userId === data.userId) {
                return {
                  ...contact,
                  status: data.status,
                };
              }
              return contact;
            });

            const updatedAllChatList = allChatList.map(item => {
              // Skip date headers
              if (typeof item === 'string') return item;
              // Check if this message belongs to the user
              if (item.targetUserId == data.userId) {
                return {
                  ...item,
                  status: data.status, // update the status
                };
              }

              return item; // return unchanged if not matching
            });

            setSelectedContacts(updatedTotalContactList);
            setOutOfOfficeMembers(updatedMembers);
            setAllChatList(updatedAllChatList);

            if (updatedMembers.length === 1) {
              setShowOutOfOfcMsgAboveTextBox(true);
              setShowOutOfOfcPopUp(false);
            } else if (updatedMembers.length === 0) {
              setShowOutOfOfcMsgAboveTextBox(false);
              setShowOutOfOfcPopUp(false);
            }
          }
          // If it's a one-on-one chat, update the status in userChatData
          else if (userChatData.targetUserId == data.userId) {
            // Update the status of the target user in the one-on-one chat
            setUserChatData(prevData => ({
              ...prevData,
              status: data.status, // Update status based on SignalR message
            }));

            /**
             * Added by @Akshita 1-09-25 ---> setting the status for one on one chat user */

            setUserAvailabilityStatus(data.status);
          }
        }
      };
      /**
       * Assign the handler to the status change event
       */
      if (signalRStore.userWithUpdatedStatus) {
        handleStatusUpdate(signalRStore.userWithUpdatedStatus);
      }
    }
  }, [signalRStore.userWithUpdatedStatus]);

  useEffect(() => {
    if (userDetails) {
      /**
       * Added by @Akshita 25-03-25 ---> Function to process received message and
       * update the chat list accordingly (FYN-4314) */
      const handleGroupRemoval = (data: SignalRMessageModel) => {
        // Check if this message belongs to the opened group
        Log('group deletion update received on chat =>' + JSON.stringify(data));
        if (data.groupId) {
          removeMessageNotifications({
            groupId: data.groupId,
            targetUserId: data.userId,
          });

          const isCurrentGroupChat = !isEmpty(userChatData.groupId);

          if (
            isCurrentGroupChat &&
            userChatData.groupId?.toLowerCase() == data.groupId.toLowerCase()
          ) {
            handleGoBack(navigation);
            showSnackbar(t('GroupDeletionMsgForUser'), 'danger');
          }
        }
        signalRStore.setDeletedGroup(undefined);
      };

      /**
       * Added by @Akshita 25-03-25 ---> Call handleMessageReceived only when
       * signalRMessageReceived is available (FYN-4314) */
      if (signalRStore.deletedGroup) {
        handleGroupRemoval(signalRStore.deletedGroup);
      }
    }
  }, [signalRStore.deletedGroup]); // ✅ Added dependencies

  const initializeChat = () => {
    setLoading(true);
    setUserAvailabilityStatus('');
    // setUserChatData({});
  };

  const mergeAndSortChatList = (
    chatList: (string | UserChatMessageItem)[],
    failedMessages: UserChatMessageItem[],
  ): (string | UserChatMessageItem)[] => {
    // Step 1: Flatten existing chatList (skip headers)
    const existingMessages: UserChatMessageItem[] = chatList.filter(
      (item): item is UserChatMessageItem => typeof item !== 'string',
    );

    // Step 2: Filter & prepare failedMessages
    const failedMsgs = failedMessages
      .filter(msg => {
        if (msg.groupId && msg.groupId !== userChatData.groupId) return false;
        if (!msg.groupId && msg.targetUserId !== userChatData.targetUserId)
          return false;
        return true;
      })
      .map(msg => ({
        ...msg,
        side: 1,
        sendFailed: true,
        creationTime: undefined,
        fileName: !isEmpty(msg.messageAttachment)
          ? extractPdfName(msg?.messageAttachment!)
          : '',
        text: msg.text,
        fileTitle: !isEmpty(msg.messageAttachment)
          ? extractPdfName(msg?.messageAttachment!)
          : '',
        animate: false,
      }));

    // Step 3: Merge all messages
    const allMessages = [...existingMessages, ...failedMsgs];

    // Step 4: Sort messages by creationTime or creationTimeStr
    allMessages.sort((a, b) => {
      const timeA = a.sendFailed
        ? dayjs(a.creationTimeStr)
        : dayjs(a.creationTime);
      const timeB = b.sendFailed
        ? dayjs(b.creationTimeStr)
        : dayjs(b.creationTime);
      return timeA.isBefore(timeB) ? -1 : timeA.isAfter(timeB) ? 1 : 0;
    });

    // Step 5: Rebuild chat list with date headers + UI flags
    const finalList: (string | UserChatMessageItem)[] = [];
    let lastHeader = '';

    allMessages.forEach((msg, index, arr) => {
      const msgDate = msg.sendFailed
        ? dayjs(msg.creationTimeStr).format('DD-MM-YYYY')
        : dayjs(msg.creationTime).format('DD-MM-YYYY');

      // Insert date header if needed
      if (msgDate !== lastHeader) {
        finalList.push(msgDate);
        lastHeader = msgDate;
      }

      // Calculate showProfile & marginTop
      const prevMsg = arr[index - 1];
      const prevDate =
        prevMsg && !prevMsg.sendFailed
          ? dayjs(prevMsg.creationTime).format('DD-MM-YYYY')
          : prevMsg && prevMsg.sendFailed
          ? dayjs(prevMsg.creationTimeStr).format('DD-MM-YYYY')
          : null;

      const showProfile =
        !prevMsg ||
        prevDate !== msgDate ||
        prevMsg.targetUserId !== msg.targetUserId;

      const marginTop = getMessageSpacing(msg, prevMsg);

      finalList.push({
        ...msg,
        showProfile,
        marginTop,
      });
    });

    return finalList;
  };

  // 👇 This will re-evaluate every render automatically
  const hideDeleteOrLeave =
    isSystemCreatedGroup && tenantDetail.tenantDetails?.useManagedPackage;

  const handleStatusHeader = () => {
    setSubtitle({
      text:
        userChatData?.isInactive ||
        userChatData?.groupInactive ||
        !internetAvailable ||
        loading
          ? ''
          : userChatData?.groupId &&
            userChatData.groupId != '00000000-0000-0000-0000-000000000000' &&
            selectedContacts.length > 0
          ? `${selectedContacts.length} ${t('Members')}`
          : isEmpty(userChatData?.groupId) && !isEmpty(userAvailabilityStatus)
          ? userAvailabilityStatus
          : '',
      color:
        userChatData?.groupId &&
        userChatData.groupId != '00000000-0000-0000-0000-000000000000' &&
        selectedContacts.length > 0
          ? ''
          : handleUserStatusColor(
              !isEmpty(userAvailabilityStatus)
                ? userAvailabilityStatus
                : UserStatus.Available,
            ),
    });
  };

  const markMessageAsFailed = (item?: UserChatMessageItem, retry?: boolean) => {
    let matchedMessage: UserChatMessageItem = {
      ...item,
      targetTenantId: item?.targetTenantId,
      sendFailed: true,
      isImageLoading: false,
      creationTimeStr: new Date().toISOString(),
      animate: false,
    };

    if (matchedMessage?.targetUserId) {
      useFailedMessageStore
        .getState()
        .addFailedMessage(matchedMessage.targetUserId, matchedMessage);

      if (retry) {
        checkUserMessage(matchedMessage, 'instant');
      } else {
        setAllChatList(prev =>
          prev.map(aitem =>
            typeof aitem !== 'string' && aitem.id === item?.id
              ? {
                  ...aitem,
                  targetTenantId: item?.targetTenantId,
                  sendFailed: true,
                  isImageLoading: false,
                  creationTimeStr: new Date().toISOString(),
                  animate: false,
                }
              : aitem,
          ),
        );
      }
    }
  };

  /**  Added by @Akshita 26-12-24 ---> handle hardware back press(FYN-4314)*/
  useBackPressHandler(() => updateMessagingListData());

  /** Added by @Akshita 26-12-24 ---> update the comment count before going to previous screen(FYN-4314)*/
  const updateMessagingListData = (changed?: boolean) => {
    /**
     *  Added by @Akshita 26-12-24 ---> if user add or remove fasting logs than call
     the sendDataBack function to let previous screen know to update the fasting progress(FYN-4314)*/

    if (changed || route.params?.screenType == 'fromNotification') {
      sendDataBack('Message', {
        isMessageListModified: true,
        showRefreshLoader:
          route.params?.screenType == 'fromNotification' ? true : false,
      } as MessageReturnProp);
    } else {
      sendDataBack('Message', {
        userChatData: userChatData,
      } as MessageReturnProp);
    }

    return true;
  };

  receiveDataBack('Chat', (data: ChatReturnProp) => {
    if (data) {
      if (data.media || data.message) {
        setMediaList(data.media ?? []);
        if (isEmpty(data.message) && !data.media) {
          return;
        }

        handleSendMessage(data.message, undefined, data.media);
        return;
      }

      if (data.leftGroup) {
        if (updateMessagingListData(true)) {
          handleGoBack(navigation);
        }
      }

      /**  Added by @akshita 29-11-24 ---> Updates state with daily dashboard data*/
      setSelectedContacts([...data.memberList]);
      setUserChatData({
        ...userChatData,
        userFullName: data.groupName,
        targetProfilePicture: data.groupImage,
        groupMemberCount: `${data.memberList.length} ${t('Members')}`,
      });
    }
  });
  const buildSignalRMessage = ({
    tempId,
    messageContent,
    fileName,
    contentType,
    imagePathS3,
    fullImagePath,
    isLocal = false,
    localUri,
  }: {
    tempId: string;
    messageContent?: string;
    fileName?: string;
    contentType?: string;
    imagePathS3?: string;
    fullImagePath?: string;
    isLocal?: boolean;
    localUri?: string;
  }): UserChatMessageItem => {
    const timestamp = new Date().toISOString();

    // CASE 1: TEXT ONLY
    if (!imagePathS3 && !fileName && !localUri) {
      // ✅ add preview html before your processHtmlContent runs
      const textWithPreview = buildTextWithPreview(messageContent ?? '');

      const htmlText =
        processHtmlContent({ html: textWithPreview ?? '' })?.Content ?? '';
      return {
        id: tempId,
        sharedMessageId: tempId,
        message: messageContent ?? '',
        text: messageContent ?? '',
        messageAttachment: undefined,
        fileName: undefined,
        userName: userChatData.userFullName,
        userId: userDetails?.userID,
        targetUserId: userChatData.targetUserId,
        targetTenantId: Number(tenantDetail?.tenantDetails?.tenantId),
        groupId: userChatData?.groupId!,
        fullName: userChatData.userFullName,
        profileImage: userChatData?.targetProfilePicture,
        creationTimeStr: timestamp,
        phoneIdentifier: JSON.stringify({ localTimestamp: timestamp }),
        side: 1,
        isImageLoading: false,
        imageS3Url: undefined,
        imageOrFileId: undefined,
        sendFailed: false,
        textHtmlPreview: textWithPreview,
      };
    }

    // htmlText = processHtmlContent({ html: textWithPreview ?? '' })?.Content ?? '';
    // CASE 2: IMAGE OR PDF (local upload)
    const attachment =
      contentType === 'application/pdf'
        ? buildFileAttachment(imagePathS3 ?? '', fileName ?? 'file.pdf')
        : buildImageAttachment(imagePathS3 ?? '', fileName ?? 'image.jpg');

    return {
      id: tempId,
      sharedMessageId: tempId,
      message: `${attachment}${messageContent}`,
      text: messageContent ?? '',
      messageAttachment: attachment,
      fileName: fileName,
      contentType,
      userName: userChatData.userFullName,
      userId: userDetails?.userID,
      targetUserId: userChatData.targetUserId,
      targetTenantId: Number(tenantDetail?.tenantDetails?.tenantId),
      groupId: userChatData?.groupId!,
      fullName: userChatData.userFullName,
      profileImage: userChatData?.targetProfilePicture,
      fullImagePath: fullImagePath ?? '',
      creationTimeStr: timestamp,
      phoneIdentifier: JSON.stringify({ localTimestamp: timestamp }),
      side: 1,
      isImageLoading: isLocal,
      imageS3Url: localUri,
      imageOrFileId: imagePathS3,
      sendFailed: false,
    };
  };

  const checkUserMessage = (
    message: UserChatMessageItem,
    source: 'instant' | 'signalR' = 'instant',
  ) => {
    // Extract link preview HTML before truncation so it renders outside See more/less
    const { cleanHtml: cleanText, linkPreviewHtml: linkPreviewFromText } =
      extractLinkPreviewHtml(message.text ?? '');
    const {
      cleanHtml: cleanHtmlPreview,
      linkPreviewHtml: linkPreviewFromHtmlPreview,
    } = extractLinkPreviewHtml(message.textHtmlPreview ?? '');
    const linkPreviewHtml = linkPreviewFromText ?? linkPreviewFromHtmlPreview;

    const htmlData = processHtmlContent({
      html: cleanText,
      linkColor: theme.colors.links,
      showMore: true,
    });

    const normalizedText = htmlData?.Content ?? cleanText;
    const normalizedShortText = htmlData?.shortContent ?? normalizedText;

    /**  Added by @akshita 29-11-24 --->  Get the last non-string message from the chat list*/
    const lastMessage = allChatList
      .slice()
      .reverse()
      .find(item => typeof item !== 'string') as
      | UserChatMessageItem
      | undefined;

    const isImage = message.messageAttachment?.includes('[image]');
    const isFile = message.messageAttachment?.includes('[file]');
    /**  Added by @akshita 29-11-24 --->  Process each message before adding it to the list*/
    const userChatMessage: UserChatMessageItem = {
      ...message,
      text: normalizedText,
      shorttext: normalizedShortText,
      textHtmlPreview: cleanHtmlPreview,
      linkPreviewHtml,
      targetTenantId: message.targetTenantId,
      /**
       * Added by @akshita 29-11-24 --->
       * Show profile only if the new message's userId is different from the last message's userId*/
      showProfile: lastMessage
        ? lastMessage.targetUserId !== message.targetUserId
        : true,
      marginTop: getMessageSpacing(message, lastMessage),
      animate: true,
      creationTimeDisplay: message.creationTime
        ? getUtcWithTimeOnly(message.creationTime)
        : '',
      fileTitle: isFile ? extractPdfName(message?.messageAttachment!) : '',
      collapsed: true,
    };

    /**  Added by @akshita 29-11-24 --->  Function to update the chat list safely*/
    const updateChatList = (
      updatedMessage: UserChatMessageItem,
      source: 'instant' | 'signalR' = 'instant',
    ) => {
      let preservedLocalPath: string | undefined;
      let alreadyExists = false;

      // Instant message: push directly
      if (source === 'instant') {
        setAllChatList(prev => {
          const todayHeader = formatDate({
            date: new Date(),
            returnFormat: 'DD-MM-YYYY',
          });

          if (isFile) {
            if (updatedMessage.messageAttachment) {
              let jsonMessage = JSON.parse(
                updatedMessage.messageAttachment.substring('[file]'.length),
              );
              updatedMessage.imageOrFileId = jsonMessage.id;

              // updatedMessage.message = extractPdfName(
              //   updatedMessage.messageAttachment,
              // );
            }
          }
          // Only add the header if it doesn’t exist
          const newList = prev.some(item => item === todayHeader)
            ? [...prev, updatedMessage]
            : [...prev, todayHeader, updatedMessage];
          Log(
            'signal r list INSTANTTTTTTTTTTTTTTTT : = ' +
              JSON.stringify(newList),
          );

          return newList;
        });

        setTimeout(() => {
          if (updatedMessage.side === 1) scrollToBottom();
        }, 0);
      } else {
        setAllChatList(prevList => {
          const filteredList = prevList.filter(item => {
            if (typeof item === 'string') return true;

            // Remove exact same message ID (if already delivered)
            if (item.id === updatedMessage.id) return false;

            let phoneIdLocalTimestamp: string | undefined;
            let updatedPhoneIdLocalTimestamp: string | undefined;
            try {
              if (
                item?.phoneIdentifier &&
                typeof item.phoneIdentifier === 'string'
              ) {
                phoneIdLocalTimestamp = JSON.parse(
                  item.phoneIdentifier,
                )?.localTimestamp;
              }
              if (
                updatedMessage?.phoneIdentifier &&
                typeof updatedMessage.phoneIdentifier === 'string'
              ) {
                updatedPhoneIdLocalTimestamp = JSON.parse(
                  updatedMessage.phoneIdentifier,
                )?.localTimestamp;
              }
            } catch (e) {}

            const isTemp =
              typeof item.id === 'string' &&
              item.id.startsWith('temp_') &&
              phoneIdLocalTimestamp &&
              updatedPhoneIdLocalTimestamp &&
              phoneIdLocalTimestamp === updatedPhoneIdLocalTimestamp;

            if (isTemp) {
              if (
                message.messageAttachment?.includes('[image]') &&
                item.imageS3Url
              ) {
                preservedLocalPath = item.imageS3Url;
              }
              alreadyExists = true;
              return false; // remove temp version
            }

            return true;
          });

          if (alreadyExists) {
            updatedMessage.animate = false;
          }

          // Preserve image local path if applicable
          if (isImage && preservedLocalPath) {
            updatedMessage.imageS3Url = preservedLocalPath;
            updatedMessage.isImageLoading = false;
          }

          // If the message type is I or F, bind imageOrFileId
          if (isImage || isFile) {
            if (updatedMessage.messageAttachment) {
              let jsonMessage = JSON.parse(
                updatedMessage.messageAttachment.substring(
                  isImage ? '[image]'.length : '[file]'.length,
                ),
              );
              updatedMessage.imageOrFileId = jsonMessage.id;
              if (isImage) {
                Getfilefroms3.mutate({
                  apiPayload: { fileName: jsonMessage.id },
                });
              } else {
                updatedMessage.message = extractPdfName(
                  updatedMessage.messageAttachment,
                );
              }
            }
          }

          const todayHeader = formatDate({
            date: new Date(),
            returnFormat: 'DD-MM-YYYY',
          });

          // Only add the header if it doesn’t exist
          const finalList = filteredList.some(item => item === todayHeader)
            ? [...filteredList, updatedMessage]
            : [...filteredList, todayHeader, updatedMessage];
          Log('signal r list : = ' + JSON.stringify(finalList));
          return finalList;
        });

        // Optional scroll & read handling
        setTimeout(() => {
          if (updatedMessage.side === 1) scrollToBottom();
        }, 0);

        setNewMessageLoading(undefined);

        if (updatedMessage.side === 2) {
          callMarkAllUnreadMessagesOfUserAsReadApi(true);
        }
      }
      handleAnimationCancel();
    };
    updateChatList(userChatMessage, source); // Update list immediately if no image
    return userChatMessage;
  };

  const handleAnimationCancel = () => {
    setTimeout(() => {
      setAllChatList(prev =>
        prev.map(item =>
          typeof item !== 'string' && item.animate
            ? { ...item, animate: false }
            : item,
        ),
      );
    }, 0);
  };

  const handleCopyMessage = (html: string) => {
    const plain = stripHtml(html);
    if (plain) {
      hapticTrigger(HapticFeedbackTypes.impactHeavy);

      Clipboard.setString(plain);
      // showSnackbar(t('CopiedToClipboard'), 'success');
    }
  };

  const callGetUserChatMessagesApi = (
    page: number,
    isChatRefreshed?: boolean,
  ) => {
    /**  Added by @akshita 29-11-24 --->Update current page state */

    setPageNumber(page);
    getUserChatMessagesApi.mutate({
      groupId:
        userChatData?.groupId &&
        userChatData.groupId != '00000000-0000-0000-0000-000000000000'
          ? userChatData.groupId
          : '',
      UserId:
        userChatData?.groupId &&
        userChatData.groupId != '00000000-0000-0000-0000-000000000000'
          ? undefined
          : userChatData?.targetUserId,
      TenantId: tenantDetail.tenantDetails?.tenantId,
      PageNo: page,
      FromWebOrApp: 'App',
      isChatRefreshed: isChatRefreshed,
    });
  };

  const callMarkAllUnreadMessagesOfUserAsReadApi = (stopApiCall?: boolean) => {
    markAllUnreadMessagesOfUserAsReadApi.mutate({
      tenantId: tenantDetail.tenantDetails?.tenantId,
      userId:
        userChatData?.groupId &&
        userChatData.groupId != '00000000-0000-0000-0000-000000000000'
          ? userDetails?.userID
          : userChatData?.targetUserId,
      // userId: userDetails?.userID,
      groupId:
        userChatData?.groupId &&
        userChatData.groupId != '00000000-0000-0000-0000-000000000000'
          ? userChatData.groupId
          : undefined,
      stopApiCall: stopApiCall ? stopApiCall : false,
    });
  };

  /** Added by @Akshita 07-08-25 --->  function to set the color of the status value (FYN-9294)*/
  const handleUserStatusColor = (value?: string) => {
    if (
      value?.trim().toLowerCase() == 'available' ||
      value?.toLowerCase() == 'a'
    ) {
      return theme.colors.statusAvailableColor;
    } else if (
      value?.trim().toLowerCase() == 'busy' ||
      value?.toLowerCase() == 'b'
    ) {
      return theme.colors.statusBusyColor;
    } else if (
      value?.trim().toLowerCase() == 'out of office' ||
      value?.toLowerCase() == 'o'
    ) {
      return theme.colors.error;
    }
  };

  const handleOnClickChatHeader = (value: ChatGroupMemberParent) => {
    Log('GroupMemberApiLoading valueev' + groupMemberApiLoading);
    /** Added by @akshita 05-02-25 --->Navigate to the ChatGroupMember's profile page (FYN-4314)*/
    if (userChatData?.isInactive) {
      return;
    } else if (!isEmpty(userChatData?.groupId)) {
      navigation.navigate('ChatGroupMember', {
        memberList: selectedContacts,
        groupName: userChatData.userFullName,
        groupId: userChatData.groupId!,
        isAdmin: userChatData.isGroupAdmin,
        groupImage: userChatData?.targetProfilePicture
          ? userChatData?.targetProfilePicture
          : '',
        groupImageId: userChatData?.targetProfilePictureId || '',
        teamHeaderId: userChatData.teamHeaderId,
        screenType: value,
        isGroupCreatedBySystem: isSystemCreatedGroup,
      });
    } else if (isEmpty(userChatData?.groupId)) {
      navigation.navigate('MemberProfile', {
        userId: userChatData.targetUserId,
        AvailabilityStatus: userAvailabilityStatus,
      });
    }
  };

  const bytesToMB = (bytes: number, decimals = 2): number | undefined => {
    if (bytes === 0) return 0;
    const mb = bytes / (1024 * 1024);
    return parseFloat(mb.toFixed(decimals));
  };

  /** Added by @Yuvraj 19-03-2025 -> on selecting new picture from local device (FYN-5821) */
  const handleMediaList = (mediaList: Asset[]) => {
    // initializeSignalR();
    signalRService.start();
    if (mediaList.at(0)?.type == 'application/pdf') {
      if (
        mediaList.at(0)?.fileSize &&
        bytesToMB(mediaList.at(0)?.fileSize!)! > 30
      ) {
        showSnackbar(t('MinimumFileSizeMsg'), 'danger');
        return;
      } else {
        setMediaList(mediaList);
      }
    } else {
      setMediaList(mediaList);
    }

    //setShowImageSendPopup(true);
    navigation.navigate('ChatImageUpload', {
      media: mediaList,
      message: message,
      name: userChatData?.userFullName,
    });
  };

  const removeMessageFromChatList = (messageId: string) => {
    setAllChatList(prev =>
      prev.filter(
        message => typeof message === 'string' || message.id !== messageId,
      ),
    );
    if (userChatData?.targetUserId) {
      useFailedMessageStore
        .getState()
        .removeFailedMessage(userChatData.targetUserId, messageId);
    }
  };

  // Extract attachment JSON safely
  const parseAttachment = (attachment?: string) => {
    if (!attachment) return null;

    const isImg = attachment.startsWith('[image]');
    const isPdf = attachment.startsWith('[file]');

    const prefix = isImg ? '[image]' : '[file]';
    try {
      const json = JSON.parse(attachment.substring(prefix.length).trim());
      return { ...json, type: isImg ? 'image' : 'file' };
    } catch (e) {
      return null;
    }
  };

  // Build attachment for image
  const buildImageAttachment = (id: string, name: string) =>
    `[image]{ "id": "${id}", "name": "${name}", "contentType": "image/jpeg" }`;

  // Build attachment for file (PDF)
  const buildFileAttachment = (id: string, name: string) =>
    `[file]{ "id": "${id}", "name": "${name}", "contentType": "application/pdf" }`;

  const buildTextWithPreview = (rawText: string) => {
    const trimmed = rawText?.trim() ?? '';
    if (!trimmed) return trimmed;

    // If we have preview HTML for last URL, append it after typed text
    if (linkPreviewResult?.previewHtml && linkPreviewResult?.originalUrl) {
      // (Optional safe check) Append only if message includes that URL
      const urlExistsInMessage =
        trimmed.includes(linkPreviewResult.originalUrl) ||
        trimmed.includes(
          linkPreviewResult.originalUrl.replace('https://', ''),
        ) ||
        trimmed.includes(linkPreviewResult.originalUrl.replace('http://', ''));

      if (urlExistsInMessage) {
        return `${trimmed}${linkPreviewResult.previewHtml}`;
      }
    }

    return trimmed;
  };

  const handleSendMessage = async (
    text?: string,
    message?: UserChatMessageItem,
    media?: Asset[],
  ) => {
    setMessage('');
    signalRService.start();

    let tempId = `temp_${Date.now()}`;

    setTimeout(() => {
      const hasText = text && text.trim().length > 0;

      text =
        processHtmlContent({
          html: text ?? '',
          showMore: false,
        })?.Content ?? '';

      const hasMedia = media ? media?.length > 0 : mediaList.length > 0;

      // CASE 1 — Editing or Resending existing message
      if (message) {
        const parsed = parseAttachment(message.messageAttachment);
        const rebuilt = buildSignalRMessage({
          tempId: message.id?.toString()!,
          messageContent: message.text,
          fileName: parsed?.name,
          contentType: parsed?.contentType,
          imagePathS3: parsed?.id,
          fullImagePath: message.fullImagePath,
          isLocal: Boolean(parsed),
          localUri: message.imageS3Url,
        });

        checkUserMessage(rebuilt, 'instant');
        // Text-only resend
        if (!parsed) {
          sendMessageApi.mutate({
            apiPayload: {
              id: message.id,
              Message: rebuilt.text,
              TenantId: tenantDetail?.tenantDetails?.tenantId,
              UserName: userChatData.userFullName,
              phoneIdentifier: rebuilt.phoneIdentifier,
              ...(userChatData?.groupId
                ? { groupId: userChatData.groupId }
                : { UserId: userChatData.targetUserId }),
              signalRMsgData: rebuilt,
              previewVisible: isPreviewVisible,
            },
            signalRMsg: rebuilt,
          });
          return;
        }

        // Image or PDF resend
        const form = new FormData();
        form.append('files', {
          uri: message.imageS3Url,
          name: encodeURIComponent(parsed?.name),
          type: parsed?.type === 'image' ? 'image/jpeg' : 'application/pdf',
        });

        UploadFileListToS3Api.mutate({
          sendData: form,
          name: parsed?.name,
          type: parsed?.type === 'image' ? 'photo' : 'pdf',
          tempId,
          phoneIdentifier: rebuilt.phoneIdentifier,
          signalRData: rebuilt,
        });
        return;
      }

      // CASE 2 — TEXT ONLY
      if (hasText && !hasMedia) {
        const msg = buildSignalRMessage({
          tempId,
          messageContent: text.trim(),
        });

        checkUserMessage(msg, 'instant');

        sendMessageApi.mutate({
          apiPayload: {
            id: tempId,
            Message: msg.text,
            TenantId: tenantDetail?.tenantDetails?.tenantId,
            UserName: userChatData.userFullName,
            phoneIdentifier: msg.phoneIdentifier,
            ...(userChatData?.groupId
              ? { groupId: userChatData.groupId }
              : { UserId: userChatData.targetUserId }),
            signalRMsgData: msg,
            previewVisible: isPreviewVisible,
          },
          signalRMsg: msg,
        });
        return;
      }

      // CASE 3 — MEDIA ONLY
      if (!hasText && hasMedia) {
        const sendMedia = media ? media[0] : mediaList[0];

        const localMsg = buildSignalRMessage({
          tempId,
          fileName: sendMedia.fileName,
          contentType: sendMedia.type,
          isLocal: true,
          localUri: sendMedia.uri,
        });

        checkUserMessage(localMsg, 'instant');

        const form = new FormData();
        form.append('files', {
          uri: sendMedia.uri,
          name: encodeURIComponent(sendMedia.fileName!),
          type: sendMedia.type,
        });

        setMediaList([]);

        UploadFileListToS3Api.mutate({
          sendData: form,
          name: sendMedia.fileName,
          type: sendMedia.type === 'application/pdf' ? 'pdf' : 'photo',
          tempId,
          phoneIdentifier: localMsg.phoneIdentifier,
          signalRData: localMsg,
        });
        return;
      }

      // CASE 4 — TEXT + MEDIA
      if (hasText && hasMedia) {
        const sendMedia = media ? media[0] : mediaList[0];

        const localMsg = buildSignalRMessage({
          tempId,
          messageContent: text.trim(),
          fileName: sendMedia.fileName,
          contentType: sendMedia.type,
          isLocal: true,
          localUri: sendMedia.uri,
        });

        checkUserMessage(localMsg, 'instant');

        const form = new FormData();
        form.append('files', {
          uri: sendMedia.uri,
          name: encodeURIComponent(sendMedia.fileName!),
          type: sendMedia.type,
        });

        setMediaList([]);

        UploadFileListToS3Api.mutate({
          sendData: form,
          name: sendMedia.fileName,
          type: sendMedia.type === 'application/pdf' ? 'pdf' : 'photo',
          tempId,
          phoneIdentifier: localMsg.phoneIdentifier,
          signalRData: localMsg,
        });
      }
    }, 0);
  };

  /**
   * Added by @akshita 05-02-25 ---> extract pdf name from the
   * file name in the messagto display it on the view*/
  const extractPdfName = (value: string): string | undefined => {
    try {
      const match = value.match(/\[file\](\{.*\})/);
      if (match && match[1]) {
        const fileData = JSON.parse(match[1]);
        return decodeURIComponent(fileData.name) || undefined;
      }
    } catch (error) {}
    return undefined;
  };

  /** Added by @akshita 05-02-25 --->  format the date title */
  const getFormattedDateTitle = (inputDate: string) => {
    /** Added by @akshita 05-02-25 ---> Parse the formatted 'DD-MM-YYYY' date*/
    const [day, month, year] = inputDate.split('-').map(Number);
    const providedDate = new Date(year, month - 1, day); // Month is 0-based

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    /** Added by @akshita 05-02-25 --->Get the last 7 days range*/
    const sevenDaysAgo = new Date();
    /** Added by @akshita 05-02-25 --->Go back 6 days before today (making it a 7-day range)*/
    sevenDaysAgo.setDate(today.getDate() - 6);

    /** Added by @akshita 05-02-25 ---> Compare dates*/
    if (providedDate.toDateString() === today.toDateString()) {
      return t('Today');
    } else if (providedDate.toDateString() === yesterday.toDateString()) {
      return t('Yesterday');
    } else if (providedDate >= sevenDaysAgo) {
      return formatDate({ date: providedDate, returnFormat: 'dddd' });
    } else {
      return formatDate({ date: providedDate, returnFormat: 'DD MMMM YYYY' });
    }
  };

  /** Added by @akshita 05-02-25 ---> dynamic spacing for the messages from different senders*/

  const getMessageSpacing = (
    currentMessage: UserChatMessageItem,
    prevItem?: UserChatMessageItem | string,
  ): number => {
    if (!prevItem) return 10; // first message
    if (typeof prevItem === 'string') return 15; // after date header

    // Different sender → extra spacing
    if (prevItem.targetUserId !== currentMessage.targetUserId) {
      return 12;
    }

    return 5; // same sender
  };

  /** Added by @akshita 05-02-25 ---> control visibility of the action sheet pop up based on the user role (FYN-4314)*/
  const handleActionSheetItems = () => {
    setShowAdminActionSheetPopUp(true);
  };

  // Function to scroll to the bottom of the chat (offset: 0 for an inverted list).
  const scrollToBottom = () => {
    //flatListRef.current?.scrollToIndex({ index: 0 });
    flatListRef.current?.scrollToEnd({ animated: true });
    if (newMessageReceived) {
      setNewMessageReceived(false);
    }
  };

  const keyExtractor = (item: string | UserChatMessageItem, index: number) => {
    if (typeof item === 'string') {
      return `title-${item}-${index}`; // Unique key for section titles
    }
    return item.id?.toString() ?? `user-${index}`; // Ensure it returns a string; // Unique key for UserChatList items
  };

  const [scrolledPastThree, setScrolledPastThree] = useState(false);

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
      changed,
    }: {
      viewableItems: ViewToken[];
      changed: ViewToken[];
    }) => {
      const minIndexVisible = Math.min(
        ...viewableItems.map(item => item.index ?? Infinity),
      );
      setScrolledPastThree(minIndexVisible < allChatList.length - 20); // index 3 is 4th item
      const isFirstItemVisible = viewableItems.some(
        item => item.index === allChatList.length - 1 && item.isViewable,
      );
      if (isFirstItemVisible) {
        if (newMessageReceived) {
          setNewMessageReceived(false);
        }
      }
    },
    [allChatList, newMessageReceived],
  );

  const viewabilityConfigCallbackPairs: ViewabilityConfigCallbackPair<
    string | UserChatMessageItem
  >[] = useMemo(
    () => [
      {
        viewabilityConfig: { itemVisiblePercentThreshold: 50 },
        onViewableItemsChanged,
      },
    ],
    [onViewableItemsChanged],
  );

  const AnimatedChatMessage = ({
    children,
    left,
  }: {
    children: React.ReactNode;
    left?: boolean;
  }) => {
    return (
      <Animated.View
        entering={left ? SlideInLeft.springify() : SlideInRight.springify()}
      >
        {children}
      </Animated.View>
    );
  };

  const onStartReached = () => {
    if (moreFeedsAvailable && !apiLoading) {
      callGetUserChatMessagesApi(pageNumber + 1);
    }
  };

  const showImage = (item: UserChatMessageItem) => {
    if (item.imageS3Url)
      showImagePopup({
        imageList: [item.imageS3Url],
        defaultIndex: 0,
      });
  };

  const handleRetry = (item: UserChatMessageItem) => {
    if (item?.id && typeof item?.id === 'string' && !isRetrying) {
      setIsRetrying(true);
      removeMessageFromChatList(item?.id);
      handleSendMessage(undefined, item);
    }
  };

  const handlePdfClick = (item: UserChatMessageItem) => {
    if (item.imageS3Url) {
      showImagePopup({ pdfUrl: item.imageS3Url });
    } else if (!item.isImageLoading) {
      Getfilefroms3.mutate({
        apiPayload: {
          fileName: item?.imageOrFileId,
        },
        openPdf: true,
      });
    }
  };

  // or from 'react-native' Clipboard if you're on older RN

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n') // convert <br> to newline
      .replace(/<\/p>/gi, '\n') // end of paragraph as newline
      .replace(/<[^>]+>/g, '') // strip all remaining tags
      .trim();
  };

  const renderChatItem2 = (item: string | UserChatMessageItem) => {
    if (typeof item === 'string') {
      return (
        <View style={styles.dateHeader}>
          <CustomText
            color={theme.colors.onSurfaceVariant}
            variant={TextVariants.labelMedium}
          >
            {getFormattedDateTitle(item)}
          </CustomText>
        </View>
      );
    }
    const isImage = item.messageAttachment?.includes('[image]');
    const isFile = item.messageAttachment?.includes('[file]');
    const messageContent = (
      <View
        style={[
          item.side == 1
            ? styles.rightMessage
            : userChatData?.groupId && !item.showProfile
            ? styles.leftMessageWithouprofile
            : styles.leftMessage,
          { marginBottom: item.marginTop },
        ]}
      >
        <View style={styles.msgContainer}>
          {item.side == 2 && userChatData?.groupId && item.showProfile && (
            <View style={styles.profileLay}>
              <CustomAvatar
                source={
                  !isEmpty(item.profileImage) && {
                    uri: item.profileImage,
                  }
                }
                text={isEmpty(item.profileImage) ? item?.fullName : undefined}
                fillColor={item.colorCode}
                color={theme.colors.surface}
                initialVariant={TextVariants.titleSmall}
                viewStyle={styles.profileContainer}
                imageStyle={styles.profileImgContainer}
              />

              {item.status?.trim().toLowerCase() == 'out of office' ||
              item.status?.toLowerCase() == 'o' ? (
                <View
                  style={[
                    styles.statusIconLay,
                    {
                      backgroundColor: theme.dark
                        ? theme.colors.onSurface
                        : theme.colors.surface,
                    },
                  ]}
                >
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
                      backgroundColor: handleUserStatusColor(item.status),
                    },
                  ]}
                ></View>
              )}
            </View>
          )}
          <View
            style={
              item.side == 1 && isImage
                ? styles.rightImageContainer
                : item.side == 1 && !isImage
                ? styles.rightTextContainer
                : isImage
                ? styles.leftImageContainer
                : styles.leftTextContainer
            }
          >
            <View>
              {item.side == 2 && userChatData?.groupId && (
                <CustomText
                  style={styles.userNameOnMsgContainer}
                  color={item.colorCode}
                  variant={TextVariants.labelMedium}
                >
                  {`${item.fullName}`}
                </CustomText>
              )}
              {isImage && (
                <Tap
                  style={styles.imageContainer}
                  onPress={() => showImage(item)}
                >
                  <View key={item.imageS3Url}>
                    <CachedImage
                      source={{
                        uri: item.imageS3Url,
                      }}
                      loading={item.isImageLoading}
                      style={[
                        styles.messageImage,
                        item.aspectRatio && {
                          width: item.aspectRatio?.width,
                          height: item.aspectRatio?.height,
                        },
                      ]}
                    />
                    {isEmpty(item.text) && (
                      <LinearGradient
                        colors={['rgba(17, 17, 17, 0.4)', 'transparent']} // Transparent to black fade
                        end={{ x: 1, y: 1 }} // Ends at the bottom-right corner
                        useAngle
                        angle={250}
                        angleCenter={{ x: 0.5, y: 0.5 }}
                        style={styles.gradientOverlay}
                      >
                        {item.creationTime ? (
                          <CustomText
                            color={
                              theme.dark
                                ? theme.colors.onSurface
                                : theme.colors.surface
                            }
                            variant={TextVariants.labelSmall}
                            style={styles.timestamp}
                          >
                            {item.creationTimeDisplay}
                          </CustomText>
                        ) : !item.creationTime && !item.sendFailed ? (
                          <CustomImage
                            color={
                              theme.dark
                                ? theme.colors.onSurface
                                : theme.colors.surface
                            }
                            source={Images.clock}
                            type={ImageType.svg}
                            style={styles.timestampClock}
                          />
                        ) : (
                          <View style={styles.retryView}>
                            <ClickRotateIcon
                              onPress={() => handleRetry(item)}
                            />
                          </View>
                        )}
                      </LinearGradient>
                    )}
                  </View>
                </Tap>
              )}
              {isFile && (
                <View style={{ flex: 1 }}>
                  <Tap
                    style={styles.pdfContainer}
                    onPress={() => {
                      handlePdfClick(item);
                    }}
                  >
                    <View style={styles.wrapper}>
                      {item.isImageLoading ? (
                        <View style={styles.pdfLoader}>
                          <ActivityIndicator color={theme.colors.surface} />
                        </View>
                      ) : (
                        <CustomImage
                          source={Images.pdf}
                          type={ImageType.svg}
                          style={styles.pdfIcon}
                        />
                      )}

                      <CustomText
                        color={theme.colors.surface}
                        variant={TextVariants.bodyMedium}
                        maxLines={1}
                        ellipsis={TextEllipsis.tail}
                        style={styles.pdfName}
                      >
                        {item.fileTitle}
                      </CustomText>

                      {item.side == 2 && (
                        <CustomImage
                          source={Images.download}
                          type={ImageType.svg}
                          color={theme.colors.surface}
                          style={styles.downloadIcon}
                        />
                      )}
                    </View>
                  </Tap>
                  {isEmpty(item.text) && (
                    <View style={styles.gradientOverlay}>
                      {item.creationTime ? (
                        <CustomText
                          color={
                            theme.dark
                              ? theme.colors.onSurface
                              : theme.colors.surface
                          }
                          variant={TextVariants.labelSmall}
                          style={styles.timestamp}
                        >
                          {item.creationTimeDisplay}
                        </CustomText>
                      ) : !item.creationTime && !item.sendFailed ? (
                        <CustomImage
                          color={
                            theme.dark
                              ? theme.colors.onSurface
                              : theme.colors.surface
                          }
                          source={Images.clock}
                          type={ImageType.svg}
                          style={styles.timestampClock}
                        />
                      ) : (
                        <View style={styles.retryView}>
                          <ClickRotateIcon onPress={() => handleRetry(item)} />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
              {(!isEmpty(item.text) || item.linkPreviewHtml) && (
                <View
                  style={
                    item.text && item.text.length > 28
                      ? styles.longMessageContainer
                      : styles.shortMessageContainer
                  }
                >
                  <Tap
                    // iOS → let native selection handle everything
                    onLongPress={() => {
                      if (Platform.OS === 'android' && item.text) {
                        handleCopyMessage(item.text);
                      }
                    }}
                    style={styles.textTap}
                  >
                    <View>
                      {!isEmpty(item.text) && (
                        <HtmlRender
                          html={
                            item.collapsed
                              ? item.shorttext
                              : item.id?.toString().includes('temp_')
                              ? item.textHtmlPreview
                              : item.text
                          }
                          openLinks={url => {
                            if (url.startsWith('action://toggle-content')) {
                              toggleMessageCollapsed(item.id);
                              return;
                            }
                            openInAppBrowser(url);
                          }}
                          handleIframeClick={iframe => {
                            showImagePopup({ iframe: iframe });
                          }}
                          allowCopy
                          enableSelection={Platform.OS === 'ios'}
                        />
                      )}
                      {item.linkPreviewHtml && (
                        <HtmlRender
                          html={item.linkPreviewHtml}
                          openLinks={url => openInAppBrowser(url)}
                        />
                      )}
                    </View>
                  </Tap>
                  {item.creationTime ? (
                    <CustomText
                      variant={TextVariants.labelSmall}
                      style={
                        item.text && item.text.length > 28
                          ? styles.longMessageTimestamp
                          : styles.shortMessageTimestamp
                      }
                    >
                      {item.creationTimeDisplay}
                    </CustomText>
                  ) : !item.creationTime && !item.sendFailed ? (
                    <CustomImage
                      source={Images.clock}
                      type={ImageType.svg}
                      style={styles.clockIcon}
                    />
                  ) : (
                    <View
                      style={
                        item.text && item.text.length > 28
                          ? styles.longMessageTimestamp
                          : styles.shortMessageTimestamp
                      }
                    >
                      <ClickRotateIcon onPress={() => handleRetry(item)} />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
    return item.animate ? (
      <AnimatedChatMessage left={item.side == 2}>
        {messageContent}
      </AnimatedChatMessage>
    ) : (
      messageContent
    );
  };

  const renderOutOfOfficeMembers = (item: UserChatList) => {
    return (
      <View style={styles.outOfOfcContainer}>
        <View style={styles.outOfOfcWrapper}>
          <CustomText variant={TextVariants.titleMedium}>
            {item.userFullName}
          </CustomText>
          <View style={styles.endDateWrapper}>
            <CustomText>{t('ReturnsOn')}</CustomText>
            <CustomText color={theme.colors.outOfOfcLevel2}>
              {item.endDate}
            </CustomText>
          </View>
        </View>
        <Divider />
      </View>
    );
  };

  /** Added by @akshita 19-03-2025 -> Api for uploading picture and getting id (FYN-5821) */
  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: {
      sendData: Record<string, any>;
      name?: string;
      type?: string;
      tempId?: string;
      phoneIdentifier?: string;
      signalRData?: UserChatMessageItem;
      retry?: boolean;
    }) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=chat`,
        method: HttpMethodApi.Post,
        data: sendData.sendData,
      }); // API Call
    },
    onSettled(data, error, variables, onMutateResult, context) {
      setIsRetrying(false);
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result && data?.result?.at(0)?.fullImagePath) {
        const tempId = variables.tempId;
        Log('variables.type --- >' + variables.type);
        var aspectRatio: any;
        var messageContent: string;
        if (!isEmpty(variables.signalRData?.text)) {
          Log('CASE -  1 UploadFileListToS3Api');

          messageContent =
            variables.type === 'pdf'
              ? `[file]{ "id": "${
                  data?.result?.at(0)?.imagePathS3
                }", "name": "${
                  variables.name
                }", "contentType": "application/pdf" }${
                  variables.signalRData?.text
                }`
              : `[image]{ "id": "${
                  data?.result?.at(0)?.imagePathS3
                }", "name": "${variables.name}", "contentType": "photo" }${
                  variables.signalRData?.text
                }`;
        } else {
          Log('CASE -  22 UploadFileListToS3Api');

          messageContent =
            variables.type === 'pdf'
              ? `[file]{ "id": "${
                  data?.result?.at(0)?.imagePathS3
                }", "name": "${
                  variables.name
                }", "contentType": "application/pdf" }`
              : `[image]{ "id": "${
                  data?.result?.at(0)?.imagePathS3
                }", "name": "${variables.name}", "contentType": "photo" }`;
        }

        if (variables.type === 'photo') {
          Image.getSize(
            data?.result?.at(0)?.fullImagePath!,
            (width, height) => {
              aspectRatio = { width: width, height: height };
            },
          );
        }
        if (!isEmpty(variables.signalRData?.text)) {
          Log('CASE -  33 UploadFileListToS3Api');

          setAllChatList(prev =>
            prev.map(msg => {
              if (typeof msg !== 'string' && msg.id === tempId) {
                return {
                  ...msg,
                  fileName:
                    variables.type == 'pdf'
                      ? extractPdfName(messageContent)
                      : '',
                  text: variables.signalRData?.text,
                  messageAttachment: messageContent,
                  isImageLoading: false,
                  shorttext: variables.signalRData?.shorttext, // added by shivang
                  // imageS3Url: data?.result?.fullImagePath,
                  imageOrFileId: data?.result?.at(0)?.imagePathS3,
                  //aspectRatio: aspectRatio,
                };
              }
              return msg;
            }),
          );
        } else {
          Log('CASE -  44 UploadFileListToS3Api');

          setAllChatList(prev =>
            prev.map(msg => {
              if (typeof msg !== 'string' && msg.id === tempId) {
                return {
                  ...msg,
                  message:
                    variables.type == 'pdf'
                      ? extractPdfName(messageContent)
                      : messageContent,
                  isImageLoading: false,
                  // imageS3Url: data?.result?.fullImagePath,
                  imageOrFileId: data?.result?.at(0)?.imagePathS3,
                  //aspectRatio: aspectRatio,
                };
              }
              return msg;
            }),
          );
        }

        Log('messageContent before send : ' + messageContent);
        sendMessageApi.mutate({
          apiPayload: {
            Message: messageContent,
            TenantId: tenantDetail?.tenantDetails?.tenantId,
            UserName: userChatData.userFullName,
            phoneIdentifier: variables.phoneIdentifier,
            ...(userChatData?.groupId
              ? { groupId: userChatData.groupId }
              : { UserId: userChatData?.targetUserId }),
            // MessageType: variables.type === 'pdf' ? 'F' : 'I',
            id: tempId,
            signalRMsgData: {
              id: tempId,
              imageOrFileId: data?.result?.at(0)?.imagePathS3,
              fullImagePath: data?.result?.at(0)?.fullImagePath,
            },
            previewVisible: isPreviewVisible,
          },
          signalRMsg: {
            ...variables?.signalRData,
            message: messageContent,
            isImageLoading: false,
            imageOrFileId: data?.result?.at(0)?.imagePathS3,
          },
        });

        // handleSendMessage(data.result, variables.name, variables.type);
      } else {
        showSnackbar(data.error?.message ?? '', 'danger');
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');

      if (variables?.signalRData) {
        markMessageAsFailed(variables?.signalRData, variables.retry);
      }
    },
  });

  /**
   * Added by @akshita 05-02-25 ---> API call to reset the unread message count (FYN-4314)*/
  const markAllUnreadMessagesOfUserAsReadApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.MarkAllUnreadMessagesOfUserAsRead,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onSuccess(data, variables, onMutateResult, context) {
      removeMessageNotifications(userChatData);
    },
  });
  /** Added by @akshita 05-02-25 ---> API call to reset the unread message count (FYN-4314)*/

  /** Added by @akshita 05-02-25 ---> getFriendsForGroupV2Api call to fetch list of group members START (FYN-4314)*/
  const getFriendsForGroupV2Api = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserChatList[]>({
        endpoint: ApiConstants.GetFriendsForGroupV2,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables, context) {
      setLoading(true); //Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)
      setGroupMemberApiLoading(true); //Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)
    },
    onSettled(data, error, variables, onMutateResult, context) {
      Log(
        'useManagedPackage----' + tenantDetail.tenantDetails?.useManagedPackage,
      );
      Log(
        'SelectedContacts----' + selectedContacts.at(0)?.isSystemCreatedGroup,
      );
      setGroupMemberApiLoading(false);
    },
    onSuccess(data, variables, context) {
      //Added by @akshita 05-02-25 ---> Success Response(FYN-4314)

      if (data.result) {
        //  First map everything with isSelected: true
        const newData: UserChatList[] = data.result.map(element => ({
          ...element,
          isSelected: true,
        }));
        // this list is for displaying all group member list if group id on tap of header title or expert chat
        setSelectedContacts(newData);
        // 🔹 Check if any item has isSystemCreatedGroup = true
        const hasSystemCreatedGroup = data.result.some(
          item => item.isSystemCreatedGroup === true,
        );
        Log('hasSystemCreatedGroup ---' + hasSystemCreatedGroup);

        setIsSystemCreatedGroup(hasSystemCreatedGroup);

        const tempNewData: UserChatList[] = data.result
          .filter(
            element =>
              element.isOutOfOffice == true &&
              element.userId !== userDetails?.userID,
          )
          .map(element => ({
            ...element,
            endDate: formatDateUtcReturnLocalTime({
              date: element.endDate!,
              parseFormat: 'DD MMM YYYY hh:mm:ss A',
              returnFormat: 'MMM DD, YYYY hh:mm A',
            }),
          }));

        setOutOfOfficeMembers(tempNewData);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by @akshita 05-02-25 ---> getFriendsForGroupV2Api call to fetch list of group members END (FYN-4314)*/

  /** Added by @akshita 05-02-25 ---> getUserForChat2Api call  START (FYN-4314)*/
  const getProfilePictureApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetProfilePictureModel>({
        endpoint: ApiConstants.GetProfilePicture,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      //Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)
      //setLoading(true);
    },
    onSettled(data, error, variables, context) {
      // Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)
    },
    onSuccess(data, variables, context) {
      //Added by @akshita 05-02-25 ---> Success Response(FYN-4314)
      if (data.result) {
        setUserChatData({
          ...userChatData,
          targetProfilePicture: data.result.url,
        });
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by @akshita 05-02-25 ---> getUserForChat2Api call  START (FYN-4314)*/

  /**Added by @akshita 15-11-24---> getUserChatMessagesApi call for fetching all chat messages START (#15657)*/
  const getUserChatMessagesApi = useMutation({
    //Added by @akshita 15-11-24---> Function to make an API call to fetch chat messages (#15657)
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserChatMessagesModel>({
        endpoint: ApiConstants.GetUserChatMessages,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    //Added by @akshita 15-11-24---> Actions to perform before API call completes (#15657)
    onMutate(variables) {
      /**Added by @akshita 15-11-24---> Set API loading to prevent multiple calls (#15657)*/
      setApiLoading(true);

      if (variables.PageNo === 1) {
        if (!loading) {
          /**Added by @akshita 15-11-24---> Show skeleton loader for the first page (#15657)*/
          setLoading(true);
        }
      }
    },
    //Added by @akshita 15-11-24---> Cleanup actions after API call completes (#15657)
    onSettled(data, error, variables, context) {
      setApiLoading(false); //Added by @akshita 15-11-24---> Reset API loading state (#15657)

      setLoading(false); //Added by @akshita 15-11-24---> Hide skeleton loader for the first page (#15657)
    },
    //Added by @akshita 15-11-24---> Actions to perform on API success (#15657)
    onSuccess(data, variables, context) {
      if (
        variables.isChatRefreshed &&
        userChatData?.groupId &&
        userChatData.groupId != '00000000-0000-0000-0000-000000000000'
      ) {
        getFriendsForGroupV2Api.mutate({
          GroupId: userChatData?.groupId,
        });
      }
      // Get failed messages from the store
      let failedMessages: UserChatMessageItem[] = [];
      if (userChatData.targetUserId) {
        failedMessages =
          useFailedMessageStore
            .getState()
            .getFailedMessagesForUser(userChatData.targetUserId) ?? [];
      }

      if (data.result && data.result.status) {
        setUserAvailabilityStatus(data.result.status);
        setUserChatData(prevData => ({
          ...prevData,
          status: data.result?.status, // Update status based on SignalR message
        }));
      }
      handleStatusHeader();

      if (data.result && data.result.messages?.items) {
        if (data.result.messages?.items.length == 0) {
          //Added by @akshita 15-11-24---> Mark no more feeds available=false, if the response is empty (#15657)
          setMoreFeedsAvailable(false);

          if (variables.PageNo === 1 && failedMessages.length > 0) {
            const groupedMessages = mergeAndSortChatList(
              data.result.messages?.items,
              failedMessages,
            );

            setAllChatList(groupedMessages);
          }
          return;
        }
        setMoreFeedsAvailable(true);
        if (variables.PageNo === 1) {
          callMarkAllUnreadMessagesOfUserAsReadApi();
          callGetUserChatMessagesApi(variables.PageNo + 1);
        }

        const newData: UserChatMessageItem[] = data.result.messages?.items.map(
          element => {
            // Extract link preview HTML before truncation so it renders outside See more/less
            const { cleanHtml: cleanElementText, linkPreviewHtml } =
              extractLinkPreviewHtml(element.text ?? '');

            const htmlData = processHtmlContent({
              html: cleanElementText,
              linkColor: theme.colors.links,
              showMore: true,
            });

            const updatedMessage: UserChatMessageItem = {
              ...element,
              creationTimeDisplay: element.creationTime
                ? getUtcWithTimeOnly(element.creationTime)
                : '',
            };

            if (element.messageAttachment) {
              const isImage = element.messageAttachment.includes('[image]');
              const isFile = element.messageAttachment.includes('[file]');
              const jsonMessage = JSON.parse(
                element.messageAttachment.substring(
                  isImage ? '[image]'.length : '[file]'.length,
                ),
              );
              updatedMessage.imageOrFileId = jsonMessage.id;
              if (isFile) {
                updatedMessage.fileTitle = extractPdfName(
                  element.messageAttachment,
                );
              } else {
                updatedMessage.isImageLoading = true;
              }
            }

            if (htmlData) {
              const isFile = element.messageAttachment?.includes('[file]');

              return {
                ...updatedMessage, // Retains all other properties of the message object
                text: htmlData.Content ?? updatedMessage.text,
                fileTitle: isFile ? updatedMessage.fileTitle : '',
                shorttext: htmlData.shortContent ?? updatedMessage.shorttext, // added by shivang for see more and less
                iFrameList: htmlData.iFrameList, // Extracted iframe list
                linkPreviewHtml,
                collapsed: true,
              };
            } else {
              return {
                ...updatedMessage,
                text: cleanElementText,
                linkPreviewHtml,
              };
            }
          },
        );

        // -------------------- Pagination Handling --------------------
        let combinedList: (string | UserChatMessageItem)[] = [];
        if (variables.PageNo === 1) {
          combinedList = mergeAndSortChatList(newData, failedMessages);
        } else {
          // Append new page to existing chat list
          combinedList = mergeAndSortChatList([...allChatList, ...newData], []);
        }

        // -------------------- Check Images --------------------
        combinedList = combinedList.map(message => {
          if (
            typeof message !== 'string' &&
            message.messageType === 'I' &&
            !message.sendFailed
          ) {
            checkIsFileExist({
              fileName: message.imageOrFileId,
              onProcessComplete(filePath) {
                if (filePath) {
                  message.imageS3Url = filePath;
                  message.isImageLoading = false;
                } else {
                  Getfilefroms3.mutate({
                    apiPayload: { fileName: message.imageOrFileId },
                  });
                }
              },
            });
          }
          return message;
        });

        // -------------------- Update State --------------------
        setAllChatList(combinedList);
      }
    },
    //Added by @akshita 15-11-24---> Handle API errors (#15657)
    onError(error, variables, context) {
      setMoreFeedsAvailable(false); //Added by @akshita 15-11-24---> Mark no more feeds available (#15657)
      if (variables.PageNo === 1) {
        setAllChatList([]); //Added by @akshita 15-11-24---> Clear chat list if error occurs on the first page (#15657)
      }
    },
  });
  //Added by @akshita 15-11-24---> getAllChatApi call for fetching all chat messages END (#15657)

  /* get permissions Api call to display data START */
  const sendMessageApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      signalRMsg?: UserChatMessageItem;
      retry?: boolean;
    }) => {
      return makeRequest<UserChatMessageItem>({
        endpoint: ApiConstants.Sendmessage,
        method: HttpMethodApi.Post,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      /**  Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)*/
      setIsRetrying(false);
    },
    onSuccess(data, variables, context) {
      /**Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/
      if (data.success) {
        if (
          variables?.apiPayload.id &&
          typeof variables?.apiPayload.id === 'string' &&
          userChatData?.targetUserId
        ) {
          useFailedMessageStore
            .getState()
            .removeFailedMessage(
              userChatData.targetUserId,
              variables.apiPayload.id,
            );
        }

        setAllChatList(prevList =>
          prevList.map(msg => {
            if (
              typeof msg !== 'string' &&
              msg.id === variables.apiPayload.id &&
              !msg.creationTime // or use `msg.tempId === ...` if using temp IDs
            ) {
              let imageOrFileId;
              if (data.result?.messageAttachment) {
                imageOrFileId = JSON.parse(
                  data.result?.messageAttachment.substring(
                    data.result?.messageAttachment.includes('[image]')
                      ? '[image]'.length
                      : '[file]'.length,
                  ),
                );
              }

              return {
                ...msg,
                // fileTitle: data.result?.messageAttachment?.includes('[file]')
                //   ? extractPdfName(data.result.messageAttachment!)
                //   : '',
                creationTime: data.result?.creationTime,
                creationTimeDisplay: data.result?.creationTime
                  ? getUtcWithTimeOnly(data.result.creationTime)
                  : '',
                imageOrFileId: imageOrFileId?.id,
                textHtmlPreview: undefined,
                id: data.result?.id,
              };
            }
            return msg;
          }),
        );
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');

      markMessageAsFailed(variables.signalRMsg, variables.retry);
    },
  });
  /**Added by @akshita 15-11-24---> getUserChatMessagesApi call for fetching all chat messages END (#15657)*/

  /**Added by @akshita 15-11-24---> RemoveUserFromGroupApi callwhen user leave the group START (#15657)*/
  const RemoveUserFromGroupApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.RemoveUserFromGroup,
        method: HttpMethodApi.Delete,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /**Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/

      setDeletePopupLoading(true);
    },
    onSettled(data, error, variables, context) {
      /**  Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)*/
      setDeletePopupLoading(false);
      setShowDeletePopup(false);
    },
    onSuccess(data, variables, context) {
      /**Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/
      if (data.result) {
        if (updateMessagingListData(true)) {
          handleGoBack(navigation);
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  /**Added by @akshita 15-11-24---> RemoveUserFromGroupApi call when user leave the group END (#15657)*/

  /**Added by @akshita 15-11-24---> RemoveGroupApi call when admin/advisor deletes the group START (#15657)*/
  const RemoveGroupApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.RemoveGroup,
        method: HttpMethodApi.Delete,
        data: sendData,
      });
    },
    onMutate(variables) {
      /**Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/
      setDeletePopupLoading(true);
    },
    onSettled(data, error, variables, context) {
      /**  Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)*/
      setDeletePopupLoading(false);
      setShowDeletePopup(false);
    },
    onSuccess(data, variables, context) {
      /**Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/
      if (data.result) {
        if (updateMessagingListData()) {
          handleGoBack(navigation);
          showSnackbar(t('GroupRemovedMsg'), 'danger');
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  /**Added by @akshita 15-11-24---> RemoveGroupApi call when admin/advisor deletes the group END (#15657)*/

  /**
   * Added by @Ajay 22-05-25 ---> API call to get imagedata in chat (FYN-4314)*/
  const Getfilefroms3 = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      openPdf?: boolean;
    }) => {
      return makeRequest<null>({
        endpoint: ApiConstants.Getfilefroms3,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onMutate(variables) {
      /** Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/
      // setLoading(true);
      if (variables.openPdf) {
        setAllChatList(prev =>
          prev.map(item =>
            typeof item !== 'string' &&
            item.imageOrFileId === variables.apiPayload.fileName
              ? { ...item, isImageLoading: true }
              : item,
          ),
        );
      }
    },
    onSettled(data, error, variables, context) {
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      const fileExtension =
        variables.apiPayload.fileName.split('.').pop() || 'jpg';
      const cleanedFileName = variables.apiPayload.fileName
        .replace(/\//g, '')
        .replace(/\.[^/.]+$/, '');

      DownloadChatFile({
        fileUrl: data.result!,
        fileName: cleanedFileName,
        fileExtension,
        onDownloadComplete(fileUri) {
          if (fileUri) {
            setAllChatList(prev =>
              prev.map(item =>
                typeof item !== 'string' &&
                item.imageOrFileId === variables.apiPayload.fileName
                  ? { ...item, imageS3Url: fileUri, isImageLoading: false }
                  : item,
              ),
            );
            if (variables.openPdf) {
              showImagePopup({ pdfUrl: data.result! });
            }
          }
        },
      });
    },
    onError(error, variables, context) {
      /** Added by @akshita 05-02-25 ---> Error Response (FYN-4314)*/
      // showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomHeader
          showBack
          title={
            <CustomText
              ellipsis={TextEllipsis.tail}
              variant={TextVariants.titleMedium}
            >
              {userChatData?.userFullName}
            </CustomText>
          }
          subtitle={
            userChatData?.isInactive ||
            userChatData?.groupInactive ||
            !internetAvailable ||
            loading
              ? ''
              : userChatData?.groupId &&
                userChatData.groupId !=
                  '00000000-0000-0000-0000-000000000000' &&
                selectedContacts.length > 0
              ? `${selectedContacts.length} ${t('Members')}`
              : !isEmpty(userAvailabilityStatus) &&
                isEmpty(userChatData?.groupId)
              ? userAvailabilityStatus
              : ''
          }
          subtitleColor={
            userChatData?.groupId &&
            userChatData.groupId != '00000000-0000-0000-0000-000000000000' &&
            selectedContacts.length > 0
              ? ''
              : handleUserStatusColor(
                  !isEmpty(userAvailabilityStatus)
                    ? userAvailabilityStatus
                    : UserStatus.Available,
                )
          }
          onBackPress={() => updateMessagingListData()}
          onTitlePress={() =>
            !loading &&
            !groupMemberApiLoading &&
            handleOnClickChatHeader(ChatGroupMemberParent.fromGroupChat)
          }
          profileImage={
            userChatData?.targetProfilePicture
              ? userChatData?.targetProfilePicture
              : userChatData?.userFullName
          }
          showProfileStatusIcon={
            userChatData?.groupId &&
            userChatData.groupId != '00000000-0000-0000-0000-000000000000'
              ? false
              : true
          }
          statusIcon={{
            color: handleUserStatusColor(
              !isEmpty(userAvailabilityStatus) && !loading
                ? userAvailabilityStatus
                : undefined,
            ),
            status: userAvailabilityStatus,
          }}
          onProfilePress={() => {
            if (apiLoading && !groupMemberApiLoading) {
              handleOnClickChatHeader(ChatGroupMemberParent.fromGroupChat);
            }
          }}
          // profileViewStyle={styles.headerProfileImage}
          rightIcons={
            userChatData?.groupId
              ? [
                  ...(userDetails?.isAdvisor
                    ? [
                        {
                          name: t('options'),
                          source: Images.options,
                          type: ImageType.svg,
                          onPress: () => {
                            if (!loading) {
                              handleActionSheetItems();
                            }
                          },
                        },
                      ]
                    : []),
                ]
              : []
          }
        />

        {loading ? (
          <SkeletonList
            count={6}
            style={styles.flatlistContainer}
            children={
              <View style={styles.skeletonContainer}>
                <View style={styles.rightMessage}>
                  <View style={styles.skeletonSubText} />
                  <View style={styles.skeletonSubSubText} />
                </View>
                <View style={styles.leftMessage}>
                  <View style={styles.skeletonSubText} />
                  <View style={styles.skeletonSubSubText} />
                </View>
              </View>
            }
          />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.select({ ios: 50, android: 500 })}
            style={styles.flatlistContainer}
          >
            <View style={styles.flatlistContainer}>
              {allChatList.length == 0 ? (
                <ScrollView
                  contentContainerStyle={styles.errorContainer}
                  refreshControl={
                    <RefreshControl
                      refreshing={loading}
                      onRefresh={() => {
                        setMessage('');
                        callGetUserChatMessagesApi(1, true);
                      }}
                    />
                  }
                >
                  <View style={styles.errorContainer}>
                    <EmptyView
                      source={Images.email}
                      imageColor={theme.colors.onSurfaceVariant}
                      label={t('StartChat')}
                    />
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.flatlistContainer}>
                  <CustomFlatListNew
                    ref={flatListRef}
                    data={allChatList}
                    inverted={true}
                    initialScrollIndex={allChatList.length - 1}
                    keyExtractor={keyExtractor}
                    viewabilityConfigCallbackPairs={
                      viewabilityConfigCallbackPairs
                    }
                    onStartReachedThreshold={0.1}
                    onStartReached={onStartReached}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                      moreFeedsAvailable && allChatList.length > 10 ? (
                        <LoadMore />
                      ) : (
                        <></>
                      )
                    }
                    ListFooterComponent={
                      newMessageLoading ? (
                        <View
                          style={[
                            newMessageLoading.side == 1
                              ? styles.rightMessage
                              : styles.leftMessage,
                          ]}
                        >
                          <View style={styles.msgContainer}>
                            <View style={styles.rightTextContainer}>
                              <View style={{ flex: 1 }}>
                                <View style={styles.shortMessageContainer}>
                                  <CustomImage
                                    source={Images.typeLoading}
                                    style={styles.loader}
                                  />
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <></>
                      )
                    }
                    getItemType={item => {
                      return typeof item === 'string'
                        ? 'sectionHeader'
                        : 'chat';
                    }}
                    renderItem={({ item }) => renderChatItem2(item)}
                  />
                  {allChatList.length > 0 &&
                    scrolledPastThree &&
                    newMessageReceived && (
                      <Animated.View
                        entering={SlideInRight.springify()}
                        exiting={SlideOutRight.springify()}
                      >
                        <Tap
                          onPress={() => {
                            scrollToBottom();
                          }}
                          style={styles.scrollIconLayNewMsg}
                        >
                          <View style={styles.newMsgLay}>
                            <CustomImage
                              source={Images.scrollBottomArrow}
                              type={ImageType.svg}
                              color={theme.colors.surface}
                              style={styles.scrollArrow}
                            />
                            <CustomText
                              variant={TextVariants.labelLarge}
                              color={theme.colors.surface}
                            >
                              {t('NewMsgReceived')}
                            </CustomText>
                          </View>
                        </Tap>
                      </Animated.View>
                    )}
                </View>
              )}

              {userChatData?.groupInactive ? (
                <View style={styles.inactiveMsgContainer}>
                  <CustomText
                    style={styles.textCenter}
                    color={theme.colors.onErrorContainer}
                    variant={TextVariants.labelMedium}
                  >
                    {userChatData?.groupInactiveMessage}
                  </CustomText>
                </View>
              ) : userChatData?.isInactive ? (
                <View style={styles.inactiveMsgContainer}>
                  <CustomText
                    style={styles.textCenter}
                    color={theme.colors.onErrorContainer}
                    variant={TextVariants.labelMedium}
                  >
                    {userChatData?.inactiveMessage}
                  </CustomText>
                </View>
              ) : (
                <>
                  {showOutOfOfcMsgAboveTextBox &&
                    isEmpty(userChatData.groupId) &&
                    userChatData.groupId !=
                      '00000000-0000-0000-0000-000000000000' &&
                    userAvailabilityStatus == UserStatus.OutOfOffice && (
                      <View style={styles.outOfOfcTextBox}>
                        <CustomText
                          variant={TextVariants.labelMedium}
                          style={{ flex: 1 }}
                          color={theme.colors.outOfOfcLevel2}
                        >
                          {`${userChatData.userFullName} ${t(
                            'OutOfOfcMsgForOneAdvisor',
                          )}`}
                        </CustomText>

                        <View style={styles.viewDetailWrapper}>
                          <Tap
                            style={styles.tapStyle}
                            onPress={() => {
                              setShowOutOfOfcMsgAboveTextBox(false);
                            }}
                          >
                            <CustomImage
                              source={Images.closeCircle}
                              type={ImageType.svg}
                              color={theme.colors.outOfOfcLevel2}
                              style={styles.closeIcon}
                            />
                          </Tap>
                        </View>
                      </View>
                    )}
                  {outOfOfficeMembers?.length > 0 && (
                    <View style={styles.outOfOfcTextBox}>
                      {outOfOfficeMembers.length === 1 ||
                      showOutOfOfcMsgAboveTextBox ? (
                        <CustomText
                          variant={TextVariants.labelMedium}
                          style={{ flex: 1 }}
                          color={theme.colors.outOfOfcLevel2}
                        >
                          {`${outOfOfficeMembers[0].userFullName} ${t(
                            'OutOfOfcMsgForOneAdvisor',
                          )}`}
                        </CustomText>
                      ) : (
                        <View style={{ flex: 1 }}>
                          <CustomText
                            variant={TextVariants.labelMedium}
                            color={theme.colors.outOfOfcLevel2}
                          >
                            {t('OutOfOfcMsgForMultipleAdvisor')}
                          </CustomText>
                        </View>
                      )}
                      <View style={styles.viewDetailWrapper}>
                        {outOfOfficeMembers.length > 1 && (
                          <Tap onPress={() => setShowOutOfOfcPopUp(true)}>
                            <>
                              <View style={styles.viewDetailText}>
                                <CustomText
                                  variant={TextVariants.labelSmall}
                                  color={theme.colors.outOfOfcLevel1}
                                >
                                  {t('ViewDetails')}
                                </CustomText>
                              </View>
                            </>
                          </Tap>
                        )}
                        <Tap
                          style={styles.tapStyle}
                          onPress={() => setOutOfOfficeMembers([])}
                        >
                          <CustomImage
                            source={Images.closeCircle}
                            type={ImageType.svg}
                            color={theme.colors.outOfOfcLevel2}
                            style={styles.closeIcon}
                          />
                        </Tap>
                      </View>
                    </View>
                  )}
                  <View style={styles.inputContainer}>
                    <Tap
                      onPress={() => {
                        setShowImageSelectionPopup(true);
                      }}
                      style={styles.addIconLay}
                    >
                      <CustomImage
                        source={Images.addCircle}
                        type={ImageType.svg}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.camera}
                      />
                    </Tap>
                    <View style={styles.inputLay}>
                      <CustomTextInput
                        text={message}
                        onChangeText={(text: string) => {
                          setMessage(text);
                        }}
                        onLinkPreviewChange={data => {
                          setLinkPreviewResult(data);
                          setIsPreviewVisible(!!data);
                        }}
                        showLabel={false}
                        showError={false}
                        multiLine={true}
                        placeholder={t('Message')}
                        style={styles.messageInput}
                        contentStyle={{
                          marginTop: Platform.OS === 'ios' ? 8 : 0, // Apply marginTop only for iOS
                          paddingRight: 32,
                          textAlignVertical: 'center',
                          marginBottom: 2,
                        }}
                        height={50}
                        maxLines={5}
                        hidePreview={false}
                      />
                      <Tap
                        onPress={() => {
                          if (!isEmpty(message)) {
                            handleSendMessage(message);
                          }
                        }}
                        style={styles.sendIconTap}
                      >
                        <View style={styles.sendIconLay}>
                          <CustomImage
                            source={Images.send}
                            type={ImageType.svg}
                            color={theme.colors.surface}
                            style={styles.send}
                          />
                        </View>
                      </Tap>
                    </View>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        )}

        <CustomImagePicker
          showPopup={showImageSelectionPopup}
          setShowPopup={setShowImageSelectionPopup}
          mediaList={handleMediaList}
          crop={true}
          showFile
          IsManualCrop={true}
        />

        <CustomActionSheetPoup
          shown={showAdminActionSheetPopUp}
          setShown={setShowAdminActionSheetPopUp}
          centered={false}
          hideIcons={false}
          children={
            userChatData?.isGroupAdmin ||
            userDetails?.role?.toLowerCase() == 'admin'
              ? [
                  //  Only show EditGroup if group is active
                  ...(userChatData?.groupInactive || userChatData?.isInactive
                    ? []
                    : [
                        {
                          title: t('EditGroup'),
                          image: Images.editSquare,
                          imageType: ImageType.svg,
                          onPress: () => {
                            handleOnClickChatHeader(
                              ChatGroupMemberParent.fromActionSheetEdit,
                            );
                          },
                        },
                      ]),
                  ...(isSystemCreatedGroup &&
                  tenantDetail.tenantDetails?.useManagedPackage
                    ? []
                    : [
                        {
                          title: t('DeleteGroup'),
                          titleColor: theme.colors.error,
                          image: Images.delete,
                          imageColor: theme.colors.error,
                          imageType: ImageType.svg,
                          onPress: () => {
                            setShowDeletePopup(true);
                          },
                        },
                      ]),
                ]
              : [
                  ...(isSystemCreatedGroup &&
                  tenantDetail.tenantDetails?.useManagedPackage
                    ? []
                    : [
                        {
                          title: t('LeaveGroup'),
                          titleColor: theme.colors.error,
                          imageColor: theme.colors.error,
                          image: Images.logout,
                          imageType: ImageType.svg,
                          onPress: () => {
                            setShowDeletePopup(true);
                          },
                        },
                      ]),
                ]
          }
        />

        <CustomPopup
          shown={showDeletePopup}
          setShown={setShowDeletePopup}
          compact
          title={
            userChatData?.isGroupAdmin ||
            userDetails?.role?.toLowerCase() == 'admin'
              ? t('DeleteGroup')
              : t('LeaveGroup')
          }
          msg={
            userChatData?.isGroupAdmin ||
            userDetails?.role?.toLowerCase() == 'admin'
              ? t('DeleteGroupMsg')
              : t('LeaveGroupMsg')
          }
          loading={deletePopupLoading}
          onPositivePress={() => {
            if (
              userChatData?.isGroupAdmin ||
              userDetails?.role?.toLowerCase() == 'admin'
            ) {
              RemoveGroupApi.mutate({
                groupId: userChatData?.groupId,
              });
            } else {
              RemoveUserFromGroupApi.mutate({
                groupId: userChatData?.groupId,
              });
            }
          }}
          onNegativePress={() => {
            setShowDeletePopup(false);
            setDeletePopupLoading(false);
          }}
        />

        <CustomBottomPopup
          shown={showOutOfOfcPopUp}
          setShown={setShowOutOfOfcPopUp}
          title={t('OutOfOffice')}
          onClose={() => {
            setShowOutOfOfcPopUp(false);
          }}
        >
          <View>
            <CustomFlatList
              data={outOfOfficeMembers}
              extraData={outOfOfficeMembers}
              contentContainerStyle={
                outOfOfficeMembers.length == 0
                  ? styles.flatListContainerStyle
                  : undefined
              }
              keyExtractor={item => item.userId?.toString()!}
              ListEmptyComponent={<View></View>}
              getItemType={item => {
                return typeof item === 'string' ? 'chatListHeader' : 'contact';
              }}
              renderItem={({ item }) => renderOutOfOfficeMembers(item)}
            />
          </View>
        </CustomBottomPopup>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    flatlistContainer: {
      flex: 1,
    },
    flatListContainerStyle: { flexGrow: 1, justifyContent: 'center' },
    inputContainer: {
      flexDirection: 'row',
      marginHorizontal: 10,
      marginBottom: 20,
    },
    inactiveMsgContainer: {
      marginTop: 10,
      padding: 15,
      backgroundColor: theme.colors.errorContainer,
    },
    textCenter: { textAlign: 'center' },
    addIconLay: {
      paddingVertical: 6,
      justifyContent: 'flex-end',
    },
    inputLay: {
      flex: 1,
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    fileInputLay: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginHorizontal: 10,
    },
    imageInputLay: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginHorizontal: 10,
    },
    inputBoxContainer: {
      flex: 1,
      position: 'relative',
      flexDirection: 'column',
    },

    camera: {
      height: 35,
      width: 35,
      marginBottom: Platform.OS === 'ios' ? 2 : 0, // Apply marginTop only for iOS
    },
    send: {
      height: 22,
      width: 22,
    },
    sendIconTap: {
      position: 'absolute',
      backgroundColor: theme.colors.primary,
      borderRadius: 35,
      right: 5,
      bottom: 8, // Apply marginTop only for iOS
      alignSelf: 'flex-end',
      height: 35,
      width: 35,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    sendIconLay: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    leftMessageWithouprofile: {
      flex: 1,
      alignItems: 'flex-start',
      paddingLeft: 40,
    },
    leftMessage: {
      flex: 1,
      alignItems: 'flex-start',
      marginLeft: 10,
    },
    rightMessage: {
      flex: 1,
      alignItems: 'flex-end',
      marginRight: 10,
    },
    msgContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      // maxWidth: '75%', // Ensures long text wraps within this limit
    },
    loaderMsgRight: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      marginVertical: 5,
      marginRight: 10,
    },
    loaderMsgLeft: {
      flexDirection: 'row-reverse',
      alignSelf: 'flex-start',
      marginVertical: 5,
      marginLeft: 10,
    },
    dateHeader: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.elevation.level1,
      borderRadius: theme.roundness,
      height: 26,
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginBottom: 15,
    },
    profileContainer: {
      width: 25,
      height: 25,
      //borderRadius: 20,
      marginRight: 6,
      borderRadius: theme.roundness,
    },
    profileImgContainer: {
      width: 25,
      height: 25,
      //borderRadius: 20,
      // marginRight: 6,
      borderRadius: theme.roundness,
    },
    selectedImg: {
      height: 80,
      width: 80,
      borderRadius: theme.roundness,
    },
    selectedImgDeleteTap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.error,
      borderBottomLeftRadius: theme.roundness,
      borderBottomRightRadius: theme.roundness,
      alignItems: 'center',
    },
    selectedImgDelete: {
      height: 10,
      width: 10,
    },
    messageInput: {
      width: '100%',
    },
    outofOfficeIcon: {
      width: 9,
      height: 9,
    },
    loader: { width: 30, height: 17 },

    columnWrap: {
      flexDirection: 'column',
      marginTop: 22,
    },
    rightTextContainer: {
      paddingVertical: 5,
      paddingHorizontal: 5,
      backgroundColor: theme.colors.userMessage,
      borderRadius: theme.roundness,
      maxWidth: '75%',
      minWidth: 0, // Allows shrinking to fit short text
      alignSelf: 'flex-start', // Prevents unnecessary stretching
      flexShrink: 1, // Ensures it shrinks when text is short
    },
    leftTextContainer: {
      paddingVertical: 5,
      paddingHorizontal: 5,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      maxWidth: '78%',
      minWidth: 0, // Adapts to short text dynamically
      flexShrink: 1,
      alignSelf: 'flex-start', // Prevents unnecessary stretching
    },
    rightImageContainer: {
      flex: 1,
      paddingVertical: 5,
      paddingHorizontal: 5,
      backgroundColor: theme.colors.userMessage,
      borderRadius: theme.roundness,
      maxWidth: '75%',
      minWidth: 0, // Allows shrinking to fit short text
      alignSelf: 'flex-start', // Prevents unnecessary stretching
      flexShrink: 1, // Ensures it shrinks when text is short
    },
    leftImageContainer: {
      flex: 1,
      paddingVertical: 5,
      paddingHorizontal: 5,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      maxWidth: '75%',
      minWidth: 0, // Adapts to short text dynamically
      flexShrink: 1,
      alignSelf: 'flex-start', // Prevents unnecessary stretching
    },
    shortMessageContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      // paddingHorizontal: 3,
      justifyContent: 'space-between', // Pushes text left and timestamp right
      paddingHorizontal: 3,
      // paddingVertical: 5,
    },
    longMessageContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingHorizontal: 3,
    },
    shortMessageTimestamp: {
      marginLeft: 8,
      alignSelf: 'flex-end',
    },
    longMessageTimestamp: {
      marginTop: 2,
      alignSelf: 'flex-end',
    },
    imageContainer: {
      flex: 1,
      borderRadius: theme.roundness,
      flexShrink: 1,
      padding: 0,
    },
    messageImage: {
      borderRadius: theme.roundness, // Keeps it rounded
      // resizeMode: 'contain',
      width: screenWidth,
      height: screenHeight,
      resizeMode: 'cover', // Makes sure the image fully covers the frame
      maxWidth: '100%', // Prevents overflow
      maxHeight: '100%', // Ensures it doesn't exceed container height
      alignSelf: 'center', // Centers the image
    },
    pdfContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.roundness,
      paddingHorizontal: 1,
      paddingVertical: 8,
    },
    wrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    pdfIcon: {
      width: 30,
      height: 30,
      marginRight: 3,
    },
    clockIcon: {
      width: 12,
      height: 12,
      marginLeft: 5,
      alignSelf: 'flex-end',
    },
    pdfName: {
      flex: 1,
      justifyContent: 'center',
      //alignSelf: 'center',
    },
    downloadIcon: {
      width: 17,
      height: 17,
      marginBottom: 3,
      marginRight: 3,
      alignSelf: 'center',
    },
    timestamp: {
      position: 'absolute',
      bottom: 5,
      right: 8,
      marginTop: 3,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 5,
    },

    retryIconPdf: {
      position: 'absolute',
      bottom: 5,
      right: 3,
      marginTop: 3,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 5,
    },

    timestampClock: {
      position: 'absolute',
      height: 12,
      width: 12,
      bottom: 5,
      right: 8,
      marginTop: 3,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 5,
    },
    userNameOnMsgContainer: {
      paddingHorizontal: 3,
    },
    gradientOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      borderBottomRightRadius: theme.roundness,
      width: '100%', // Ensures it matches the image width
      height: 25,
      resizeMode: 'cover', // Makes sure the image fully covers the frame
      overflow: 'hidden',
    },
    headerProfileImage: {
      height: 30,
      width: 30,
    },

    skeletonContainer: {
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
      marginTop: 10,
    },

    skeletonSubText: {
      backgroundColor: theme.colors.surface,
      width: '60%',
      height: 14,
      borderRadius: 5,
      marginTop: 15,
      marginHorizontal: 15,
    },
    skeletonSubSubText: {
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 9,
      borderRadius: 5,
      marginTop: 15,
      marginHorizontal: 15,
    },

    selectedImageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedImgs: {
      height: 80,
      width: 80,
      borderRadius: theme.roundness,
    },
    scrollIconLay: {
      backgroundColor: theme.colors.surface,
      height: 35,
      minWidth: 35,
      borderRadius: 50,
      alignSelf: 'flex-end',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: 20,
      right: 20,
      shadowColor: theme.colors.onSurfaceVariant, // Use shadow color from the theme
      shadowOffset: { width: 0, height: 3 / 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    scrollIconLayNewMsg: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness,
      height: 35,
      minWidth: 35,
      alignSelf: 'flex-end',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: 20,
      right: 20,
      shadowColor: theme.colors.onSurfaceVariant, // Use shadow color from the theme
      shadowOffset: { width: 0, height: 3 / 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    newMsgLay: {
      flexDirection: 'row',
      alignContent: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    scrollArrow: {
      height: 17,
      width: 17,
    },
    errorContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    imageSendMain: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    imageSendImg: {
      width: '100%',
      height: '100%',
    },
    backBtnLay: {
      padding: 8,
      backgroundColor: theme.colors.backdrop,
      borderRadius: 50,
    },
    cropBtnLay: {
      position: 'absolute',
      alignSelf: 'flex-end',
      gap: 10,
      padding: 10,
      flexDirection: 'row',
    },

    backBtn: {
      height: 25,
      width: 25,
    },
    closeBtn: {
      height: 17,
      width: 17,
    },
    sendImageIcon: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 40,
      height: 40,
      marginHorizontal: 2,
      padding: 8,
      marginTop: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pdf: {
      //flex: 1,
      height: '80%',
      width: '100%',
    },
    pdfLoader: {
      width: 30,
      height: 30,
      marginRight: 3,
      marginTop: 3,
    },
    outOfOfcContainer: {
      paddingHorizontal: 20,
    },
    outOfOfcWrapper: {
      marginVertical: 15,
      gap: 6,
    },
    endDateWrapper: { gap: 5, flexDirection: 'row' },
    outOfOfcTextBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.outOfOfcLevel1, // soft pink
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginHorizontal: 10,
      borderColor: theme.colors.outOfOfcLevel2,
      borderWidth: 0.6,
      borderRadius: theme.roundness,
    },
    viewDetailText: {
      backgroundColor: theme.colors.outOfOfcLevel2,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: theme.roundness,
    },
    viewDetailWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    tapStyle: {
      padding: 0,
    },
    closeIcon: {
      height: 20,
      width: 20,
      marginLeft: 5,
    },
    retryWrapper: { marginEnd: 10, alignSelf: 'flex-end' },
    retryView: { marginEnd: 10, alignSelf: 'flex-end' },
    statusIconLay: {
      position: 'absolute',
      left: 19,
      top: 18,
      borderRadius: 20, // Circular shape
      width: 9, // Ensure size consistency
      height: 9,
    },
    profileLay: {
      position: 'relative',
    },
    textTap: { flexShrink: 1, padding: 0 },
    outOfOffcIconLay: {
      position: 'absolute',
      left: 20,
      top: 0,
      borderRadius: 20, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 20, // Ensure size consistency
      height: 20,
      backgroundColor: theme.dark
        ? theme.colors.onSurface
        : theme.colors.surface,

      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default Chat;
