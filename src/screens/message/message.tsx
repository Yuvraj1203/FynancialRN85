import {
  CustomAvatar,
  CustomFlatList,
  CustomImage,
  CustomText,
  Skeleton,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomHeader,
  CustomTextInput,
  EmptyView,
} from '@/components/molecules';
import {
  InputReturnKeyType,
  InputVariants,
} from '@/components/molecules/customTextInput/formTextInput';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetUserForChatModel,
  SignalRMessageModel,
  SignalRMessageReadModel,
  UserChatList,
} from '@/services/models';
import signalRService from '@/services/signalRService';
import { badgesStore, userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import {
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
  useTabPress,
} from '@/utils/navigationUtils';
import { removeMessageNotifications } from '@/utils/notificationUtils';
import { isEmpty, showSnackbar } from '@/utils/utils';
import { FlashListRef } from '@shopify/flash-list';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { ChatScreenParent } from '../chat/chat';
import { ChatGroupMemberParent } from '../chatGroupMember/chatGroupMember';

export type MessageReturnProp = {
  isMessageListModified?: boolean;
  showRefreshLoader?: boolean;
  userChatData?: UserChatList;
};

/** Added by @Akshita 25-03-25 --->Main component for displaying group members (FYN-4314) */
const Message = () => {
  /** Added by @Akshita 25-03-25 ---> Hook to handle navigation within the app (FYN-4314) */
  const route = useAppRoute('Message'); // route

  /** Added by @Akshita 25-03-25 --->Hook to navigate between screens (FYN-4314) */
  const navigation = useAppNavigation();

  /** Added by @Akshita 25-03-25 --->Translation hook for multi-language support (FYN-4314) */
  const { t } = useTranslation();

  /** Added by @Akshita 25-03-25 ---> Gets the current theme for styling (FYN-4314) */
  const theme = useTheme();

  /** Added by @Akshita 25-03-25 --->Generates styles dynamically based on the theme (FYN-4314) */
  const styles = makeStyles(theme);

  /** Added by @Akshita 25-03-25 ---> State to track loading status to show skeleton  (FYN-4314) */
  const [loading, setLoading] = useState(false);

  const [newGroupLoading, setNewGroupLoading] = useState(false);

  /** Added by @Akshita 25-03-25 ---> State to track loading status to show loader on search bar  (FYN-4314) */
  const [loadingSearchList, setLoadingSearchList] = useState(false);

  /** Added by @Akshita 25-03-25 --->Stores the search query for filtering group members (FYN-4314) */
  const [search, setSearch] = useState<string>('');

  /** Added by @Akshita 25-03-25 ---> Retrieves logged-in user details from store(FYN-4314) */
  const userDetails = userStore(state => state.userDetails);

  /** Added by @Akshita 25-03-25 --->Stores diffrent lists of group members (FYN-4314) */
  const [messagingList, setMessagingList] = useState<(string | UserChatList)[]>(
    [],
  );
  const [messagingAllList, setMessagingAllList] = useState<UserChatList[]>([]);

  /** Added by @Akshita 25-03-25 ---> Retrieves signal R details from store(FYN-4314) */
  const signalRStore = useSignalRStore();

  /** Added by @Akshita 25-03-25 ---> state to display error message on the screen (FYN-4314) */
  const [errorMessage, setErrorMessage] = useState<string>();

  /** Added by @Akshita 25-03-25 ---> holds the reference for input string typing in the search bar(FYN-4314) */
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** Added by @Akshita 25-03-25 --->Updates the messaging list when user */
  /** performs Delete/create/edit operation in chat or group (FYN-4314) */
  const { receiveDataBack } = useReturnDataContext();

  const lastMessage = useRef<SignalRMessageModel>(undefined);

  const flatListRef = useRef<FlashListRef<string | UserChatList>>(null);

  const setBadges = badgesStore(state => state.setBadges);

  /** Added by @Akshita 25-03-25 --->Calls API when component mounts (FYN-4314) */
  useEffect(() => {
    if (userDetails) {
      initializePage();
    }
  }, []);

  useTabPress(() => {
    if (userDetails) {
      initializePage();
    }
  });
  useEffect(() => {
    // Whenever search is cleared or the full list changes, show the full list.
    if (isEmpty(search)) {
      setMessagingList([...messagingAllList]);
      setLoadingSearchList(false);
    }
  }, [search, messagingAllList]);
  /**
   *  Added by @Akshita 25-03-25 ---> subsbcriber to handle the resetting the search state whenever
   * user navigates to different screen from message screen (FYN-4314) */
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setSearch('');
    });

    return unsubscribe;
  }, [navigation]);

  /**
   *  Added by @Akshita 25-03-25 ---> useEffect to handle incoming SignalR
   *  messages and update chat list dynamically (FYN-4314) */
  useEffect(() => {
    /**
     * Added by @Akshita 25-03-25 ---> Function to process received message and
     * update the chat list accordingly (FYN-4314) */
    const handleMessageReceived = (message: SignalRMessageModel) => {
      Log('new message received : =>' + JSON.stringify(message));

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
      setMessagingList(prevList => {
        // Clone the previous list to maintain immutability
        const updatedList = [...prevList];

        /**
         *  Added by @Akshita 25-03-25 ---> Find the index of the chat that needs to be updated
         * based on userId or groupId (FYN-4314) */
        const index = updatedList.findIndex(
          item =>
            typeof item !== 'string' &&
            ((item.targetUserId === message.targetUserId && !message.groupId) ||
              (!isEmpty(message.groupId) &&
                item.groupId?.toLowerCase() == message.groupId?.toLowerCase())),
        );

        if (index !== -1) {
          /**
           * Added by @Akshita 25-03-25 ---> Increase unread count only if the
           *  user is not on the chat screen and message is received (FYN-4314) */
          if (message.side == 2) {
            const updatedItem: UserChatList = updatedList[
              index
            ] as UserChatList;

            updatedList[index] = {
              ...updatedItem,
              unreadMessageCount: (updatedItem.unreadMessageCount || 0) + 1,
              lastMessageType: message.messageType,
              lastSendMsg: message.message,
              lastSendMsgDT: message.creationTimeStr,
            };
          }

          /**
           * Added by @Akshita 25-03-25 ---> Move the updated chat to the top of the list
           * for better visibility (FYN-4314) */
          const [updatedChat] = updatedList.splice(index, 1);
          updatedList.unshift(updatedChat);
          flatListRef.current?.scrollToTop({ animated: true });

          return updatedList;
        }
        // 🔥 New message from a new user or group: create and add new item
        if (
          (userDetails?.isAdvisor && message.side == 1) ||
          message.side == 2
        ) {
          if (isEmpty(message.groupId)) {
            const newChatItem: UserChatList = {
              targetUserId: message.targetUserId,
              userId: message.userId,
              unreadMessageCount: 1,
              lastSendMsg: message.message,
              lastSendMsgDT: message.creationTimeStr,
              lastMessageType: message.messageType,
              initials: message.initials ?? '',
              isOnline: true,
              userFullName: message.fullName ?? '',
              targetProfilePicture: message.profileImage ?? '',
              groupId: message.groupId ?? '',
              groupName: message.groupId ? message.fullName ?? '' : undefined,
              groupProfilePicture: message.profileImage ?? '',
              emailAddress: message.emailAddress,
              status: message.status,
            };

            updatedList.unshift(newChatItem);
          } else {
            getUserForChat2Api.mutate({ apipayload: {}, refresh: true });
          }
          return updatedList;
        }
        /** Added by @Akshita 25-03-25 --->  Return unchanged list if no updates were made(FYN-4314) */
        return prevList;
      });
      // signalRStore.setMessageList(undefined);
    };

    /**
     * Added by @Akshita 25-03-25 ---> Call handleMessageReceived only when
     * signalRMessageReceived is available (FYN-4314) */
    if (signalRStore.messageList) {
      handleMessageReceived(signalRStore.messageList);
    }
  }, [signalRStore.messageList]); // ✅ Added dependencies

  useEffect(() => {
    if (userDetails) {
      /**
         *Added by @Akshita 23-07-25 ---> Function to handle the status update and update the 
         outOfOfficeMembers status in the list */

      const handleStatusUpdate = (data: SignalRMessageModel) => {
        Log('Status update received=>' + JSON.stringify(data));
        setMessagingList(prev =>
          prev.map(item => {
            // only update UserChatList entries, not header strings
            if (typeof item !== 'string' && item.targetUserId === data.userId) {
              return {
                ...item,
                status: data.status,
              };
            }
            return item;
          }),
        );
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
         *Added by @Akshita 23-07-25 ---> Function to handle the status update and update the 
         outOfOfficeMembers status in the list */

      const handleRemoveGroup = (data: SignalRMessageModel) => {
        Log('group deletion update received=>' + JSON.stringify(data));

        removeMessageNotifications({
          groupId: data.groupId,
          targetUserId: data.userId,
        });

        // update message count & badge count
        getUnseenThreadCountApi.mutate({});
        sendSlientNotificationOnLoginApi.mutate({});

        // 1️⃣ Remove from the UI list (messagingList)
        setMessagingList(prev =>
          prev.filter(item => {
            // keep headers like 'Chat', 'Start a conversation', 'skeleton'
            if (typeof item === 'string') {
              return true;
            }
            // Remove only the matching groupId (case insensitive)
            return item.groupId?.toLowerCase() !== data.groupId?.toLowerCase();
          }),
        );

        // 2️⃣ Also remove from the master list (messagingAllList)
        setMessagingAllList(prev =>
          prev.filter(item => {
            return item.groupId?.toLowerCase() !== data.groupId?.toLowerCase();
          }),
        );
        signalRStore.setDeletedGroup(undefined);
      };

      /**
       * Assign the handler to the status change event
       */
      if (signalRStore.deletedGroup) {
        handleRemoveGroup(signalRStore.deletedGroup);
      }
    }
  }, [signalRStore.deletedGroup]);
  /**
   *  Added by @Akshita 25-03-25 ---> useEffect to handle incoming SignalR
   *  messages and update chat list dynamically (FYN-4314) */
  useEffect(() => {
    /**
     * Added by @Akshita 25-03-25 ---> Function to process received message and
     * update the chat list accordingly (FYN-4314) */
    const handleMessageReadCount = (message: SignalRMessageReadModel) => {
      Log('MessageRead=>' + JSON.stringify(message));
      setMessagingList(prevList => {
        // Clone the previous list to maintain immutability
        const updatedList = [...prevList];

        /**
         *  Added by @Akshita 25-03-25 ---> Find the index of the chat that needs to be updated
         * based on userId or groupId (FYN-4314) */
        const index = updatedList.findIndex(
          item =>
            typeof item !== 'string' &&
            ((item.targetUserId === message.userId &&
              message.groupId == null) ||
              (!isEmpty(message.groupId) &&
                item.groupId?.toLowerCase() == message.groupId?.toLowerCase())),
        );

        if (index !== -1) {
          /**
           * Added by @Akshita 25-03-25 ---> Increase unread count only if the
           *  user is not on the chat screen and message is received (FYN-4314) */

          const updatedItem: UserChatList = updatedList[index] as UserChatList;

          updatedList[index] = {
            ...updatedItem,
            unreadMessageCount: 0,
          };

          return updatedList;
        }

        /** Added by @Akshita 25-03-25 --->  Return unchanged list if no updates were made(FYN-4314) */
        return prevList;
      });
      signalRStore.setMessageList(undefined);
    };

    /**
     * Added by @Akshita 25-03-25 ---> Call handleMessageReceived only when
     * signalRMessageReceived is available (FYN-4314) */
    if (signalRStore.messageRead) {
      handleMessageReadCount(signalRStore.messageRead);
    }
  }, [signalRStore.messageRead]);

  /** 
     * Added by @Akshita 25-03-25 ---> updates Messaging list on message screen
  if user updates it on chat screen or group info screen(FYN-4314) */
  receiveDataBack('Message', (data: MessageReturnProp) => {
    Log(
      'user chat data received on message screen : : ' + JSON.stringify(data),
    );
    if (data.isMessageListModified) {
      // Added by @akshita 29-11-24 ---> Updates state with daily dashboard data
      getUserForChat2Api.mutate({
        apipayload: {},
        refresh: data.showRefreshLoader,
      });
    } else {
      setMessagingList(prevList => {
        // Clone the previous list to maintain immutability
        const updatedList = [...prevList];

        /**
         *  Added by @Akshita 25-03-25 ---> Find the index of the chat that needs to be updated
         * based on userId or groupId (FYN-4314) */
        const index = updatedList.findIndex(
          item =>
            typeof item !== 'string' &&
            ((item.targetUserId == data.userChatData?.targetUserId &&
              !data.userChatData?.groupId) ||
              (!isEmpty(data.userChatData?.groupId) &&
                item.groupId?.toLowerCase() ==
                  data.userChatData?.groupId?.toLowerCase())),
        );
        /**
         * Added by @Akshita 25-03-25 ---> Get the current active route to determine
         * whether the user is on the chat screen (FYN-4314) */
        if (index !== -1) {
          /**
           * Added by @Akshita 25-03-25 ---> Increase unread count only if the
           *  user is not on the chat screen and message is received (FYN-4314) */

          const updatedItem: UserChatList = updatedList[index] as UserChatList;

          updatedList[index] = {
            ...updatedItem,
            userFullName:
              updatedItem.userFullName !== data.userChatData?.userFullName
                ? data.userChatData?.userFullName
                : updatedItem.userFullName,
            targetProfilePicture:
              updatedItem.targetProfilePicture !==
              data.userChatData?.targetProfilePicture
                ? data.userChatData?.targetProfilePicture
                : updatedItem.targetProfilePicture,
            unreadMessageCount: 0,
            emailAddress: data.userChatData?.emailAddress,
            status: data.userChatData?.status,
            groupMemberCount: data.userChatData?.groupMemberCount,
          };

          return updatedList;
        }
        /** Added by @Akshita 25-03-25 --->  Return unchanged list if no updates were made(FYN-4314) */
        return prevList;
      });
    }
  });

  /** Added by @Akshita 25-03-25 ---> Function to filter group members based on search query (FYN-4314) */
  const handleSearch = (query?: string) => {
    /** Added by @Akshita 25-03-25 ---> Sanitize input */
    const searchQuery = query ?? '';
    setSearch(searchQuery);

    if (isEmpty(searchQuery)) {
      /** Added by @Akshita 25-03-25 ---> If no query is provided, reset the list (FYN-4314) */
      setMessagingList([...messagingAllList]);
      if (loadingSearchList) {
        setLoadingSearchList(false);
      }
    } else {
      /** Added by @Akshita 25-03-25 ---> If search query exists, filter the lists (FYN-4314) */

      /** Filter existing messages list */
      const filteredMessages: UserChatList[] = messagingAllList.filter(item => {
        if (typeof item === 'string') {
          return;
        }
        const userName =
          (item as UserChatList).userFullName?.trim().toLowerCase() || '';
        return userName.includes(searchQuery?.trim().toLowerCase());
      });

      if (filteredMessages.length > 0) {
        if (userDetails?.isAdvisor) {
          setMessagingList(['Chat', ...filteredMessages]);
        } else {
          setMessagingList([...filteredMessages]);
        }
      } else {
        setMessagingList([]);
      }
      // latestQueryRef.current = searchQuery; // Store latest query for reference (FYN-4314)
      if (userDetails?.isAdvisor) {
        debouncedSearch(searchQuery?.trim().toLowerCase(), filteredMessages); // Call API for contacts
      }
    }
  };

  /** Added by @Akshita 25-03-25 --->  Debounced API Call (FYN-4314)*/
  const debouncedSearch = useCallback(
    (query: string, filteredMessages: UserChatList[]) => {
      /** Added by @Akshita 25-03-25 ---> Clear the previous timeout if exists (FYN-4314)*/
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      /** Added by @Akshita 25-03-25 ---> Set a new timeout for API call(FYN-4314)*/
      typingTimeoutRef.current = setTimeout(() => {
        if (query.length > 0) {
          /** Added by @Akshita 25-03-25 --->Call API only if the query is still the latest one(FYN-4314)*/
          // if (query === latestQueryRef.current) {
          if (filteredMessages.length > 0) {
            setMessagingList([
              'Chat',
              ...filteredMessages,
              'Start a conversation',
              'skeleton',
            ]);
          } else {
            setMessagingList(['Start a conversation', 'skeleton']);
          }
          getFilterUserForChatApi.mutate({
            filterName: query,
            filteredMessages: filteredMessages,
          });
          // }
        } else {
          setMessagingList([...messagingAllList]);
        }
      }, 200); // 600ms debounce delay(FYN-4314)
    },
    [],
  );

  const initializePage = () => {
    //initializeSignalR();
    signalRService.start();
    signalRStore.setMessageList(undefined);
    getUserForChat2Api.mutate({ apipayload: {} });
    setErrorMessage(undefined);
    setSearch('');
  };

  /** Added by @Akshita 25-03-25 ---> Handles user click event on a group member (FYN-4314)*/

  const handleOnClick = async (data: UserChatList) => {
    /** Added by @Akshita 25-03-25 ---> Navigate to the member's chat screen (FYN-4314)*/
    navigation.navigate('Chat', {
      screenType: ChatScreenParent.fromMessages,
      userChatData: data,
    });
  };

  const handleOnClickCreateGroup = () => {
    /** Added by @Akshita 25-03-25 ---> Create an updated user object for the logged-in user (FYN-4314) */
    const updatedUser: UserChatList = {
      userFullName: 'You',
      emailAddress: userDetails?.emailAddressForDisplay,
      targetProfilePicture: userDetails?.profileImageUrl,
      userId: userDetails?.userID,
      isGroupAdmin: true, // Flag to identify the group admin
    };

    /** Added by @Akshita 25-03-25 ---> Navigate to ChatGroupMember screen with required parameters (FYN-4314) */
    navigation.navigate('ChatGroupMember', {
      memberList: [updatedUser],
      groupName: '',
      groupId: '',
      isAdmin: userDetails?.role == 'Admin' ? true : false,
      groupImage: '',
      groupImageId: '',
      screenType: ChatGroupMemberParent.fromAddGroupFab,
    });
  };

  /** Added by @Akshita 07-08-25 --->  function to set the color of the status value (FYN-9294)*/

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
      return theme.colors.blue;
    }
  };

  /**
   * Added by @Akshita 25-03-25 --->getUserForChat2Api API call to fetch the
   *  message contact list starts(FYN-4314)*/
  const getUserForChat2Api = useMutation({
    mutationFn: (sendData: {
      apipayload: Record<string, any>;
      refresh?: boolean;
    }) => {
      return makeRequest<GetUserForChatModel>({
        endpoint: ApiConstants.GetUserForChat2,
        method: HttpMethodApi.Get,
        data: sendData.apipayload,
      });
    },
    onMutate(variables) {
      if (!loading && !variables.refresh) {
        setLoading(true);
      }

      if (variables.refresh) {
        setNewGroupLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      if (!variables.refresh) {
        setLoading(false);
      }

      if (variables.refresh) {
        setNewGroupLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data.result && data.result.userChatList) {
        if (data.result.userChatList.length == 0) {
          setErrorMessage(t('NoUserFound'));
        }
        const newData: UserChatList[] = data.result.userChatList.map(
          element => ({
            ...element,
            contactKey: `${element.groupId}-${
              element.targetUserId
            }-${Math.random().toString(36).substr(2, 9)}`,
          }),
        );

        setMessagingAllList(newData);
        if (variables.refresh) {
          /** Filter existing messages list */
          const filteredMessages: UserChatList[] = newData.filter(item => {
            if (typeof item === 'string') {
              return;
            }
            const userName =
              (item as UserChatList).userFullName?.trim().toLowerCase() || '';
            return userName.includes(search?.trim().toLowerCase());
          });

          if (filteredMessages.length > 0) {
            if (userDetails?.isAdvisor) {
              setMessagingList(['Chat', ...filteredMessages]);
            } else {
              setMessagingList([...filteredMessages]);
            }
          } else {
            setMessagingList([]);
          }
        } else {
          setMessagingList(newData);
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  /**
   *  Added by @Akshita 25-03-25 --->getUserForChat2Api API call to fetch the message
   * contact list starts(FYN-4314)*/

  /**
   *  Added by @Akshita 25-03-25 --->getFilterUserForChatApi API call to fetch the
   * search result related contact list starts(FYN-4314)*/
  const getFilterUserForChatApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUserForChatModel>({
        endpoint: ApiConstants.GetFilterUserForChat,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setLoadingSearchList(true);
    },
    onSettled(data, error, variables, context) {
      setLoadingSearchList(false);
    },
    onSuccess(data, variables, context) {
      if (isEmpty(search)) {
        setMessagingList([...messagingAllList]);
      } else {
        if (data.result && data.result.userChatList) {
          if (data.result.userChatList.length == 0) {
            if (variables.filteredMessages.length > 0) {
              setMessagingList(['Chat', ...variables.filteredMessages]);
            } else {
              setMessagingList([]);
            }
            return;
          } else if (data.result.userChatList.length > 0) {
            /**
             *  Added by @Akshita 25-03-25 ---> Added contactKey for unique identification of each contact
             * in the list*/
            const newData: UserChatList[] = data.result.userChatList.map(
              element => ({
                ...element,
                contactKey: `${element.groupId}-${
                  element.targetUserId
                }-${Math.random().toString(36).substr(2, 9)}`,
              }),
            );
            if (variables.filteredMessages.length > 0) {
              setMessagingList([
                'Chat',
                ...variables.filteredMessages,
                'Start a conversation',
                ...newData,
              ]);
            } else {
              setMessagingList(['Start a conversation', ...newData]);
            }
          }
        }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  /**
   *  Added by @Akshita 25-03-25 --->getFilterUserForChatApi API call to fetch the
   * search result related contact list starts(FYN-4314)*/

  /**
   * Added by @Tarun 05-08-2025 -> API to get unseen message thread count (FYN-8554)
   */
  const getUnseenThreadCountApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.GetUnseenThreadCount,
        method: HttpMethodApi.Get,
        data: sendData,
        byPassRefresh: true,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      setBadges(prev => ({
        ...prev,
        messageCount: data.result,
      }));
    },
  });

  /** Added by  @Tarun 06-11-2025 -> sendSlientNotificationOnLoginApi api call needed for badge count update on login START (FYN-11041) */
  const sendSlientNotificationOnLoginApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.SendSlientNotificationOnLogin,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
  });
  /** Added by  @Tarun 06-11-2025 -> sendSlientNotificationOnLoginApi api call needed for badge count update on login END (FYN-11041) */

  const renderContacts = (item: string | UserChatList) => {
    if (typeof item === 'string') {
      return item === 'skeleton' ? (
        <Skeleton>
          <View style={{ width: '100%' }}>
            {[...Array(5).keys()].map((_, index) => (
              <View style={styles.heading}>
                <View style={styles.skeletonProfile} />
                <View style={styles.skeletonName} />
              </View>
            ))}
          </View>
        </Skeleton>
      ) : (
        <CustomText
          variant={TextVariants.titleMedium}
          style={styles.flatlistHeader}
        >
          {item}
        </CustomText>
      );
    }
    return (
      <View>
        <Tap style={styles.heading} onPress={() => handleOnClick(item)}>
          <View style={styles.heading}>
            <View style={styles.profileLay}>
              <CustomAvatar
                viewStyle={styles.profileAvatar}
                source={
                  !isEmpty(item.targetProfilePicture)
                    ? { uri: item.targetProfilePicture }
                    : undefined
                }
                text={
                  isEmpty(item.targetProfilePicture)
                    ? item.userFullName
                    : undefined
                }
              />

              {item.groupId && (
                <View style={styles.groupIconLay}>
                  <CustomImage
                    source={Images.refer}
                    type={ImageType.svg}
                    color={theme.colors.surface}
                    style={styles.groupIcon}
                  />
                </View>
              )}
              {!item.groupId &&
                !isEmpty(item.status) &&
                (item?.status?.trim().toLowerCase() == 'out of office' ||
                item?.status?.trim().toLowerCase() == 'o' ? (
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
                      { backgroundColor: handleUserStatusColor(item.status) },
                      styles.statusIconLay,
                    ]}
                  />
                ))}
            </View>

            <View style={styles.name}>
              <CustomText
                ellipsis={TextEllipsis.tail}
                maxLines={1}
                variant={TextVariants.titleMedium}
              >
                {item.userFullName}
              </CustomText>
              <CustomText
                ellipsis={TextEllipsis.tail}
                maxLines={1}
                variant={TextVariants.titleSmall}
              >
                {item.groupId ? `${item.groupMemberCount}` : item.emailAddress}
              </CustomText>
            </View>

            {item.unreadMessageCount && item.unreadMessageCount > 0 ? (
              <View style={styles.unreadBadgeStyle}>
                <CustomText
                  variant={TextVariants.labelMedium}
                  color={theme.colors.surface}
                >
                  {`${item.unreadMessageCount}`}
                </CustomText>
              </View>
            ) : (
              <></>
            )}
          </View>
        </Tap>
        <Divider />
      </View>
    );
  };

  // Unique Key Extractor Function
  const keyExtractor = (item: string | UserChatList, index: number) => {
    if (typeof item === 'string') {
      return `title-${item}-${index}`; // Unique key for section titles
    }
    return item.contactKey?.toString() ?? `user-${index}`; // Ensure it returns a string; // Unique key for UserChatList items
  };

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        <CustomHeader
          showHamburger
          title={t('Message')}
          actionButton={
            !loading &&
            userDetails?.isAdvisor && (
              <Tap
                onPress={() => handleOnClickCreateGroup()}
                style={styles.addGroupHeaderBtn}
              >
                <CustomText
                  style={styles.addGroupHeaderText}
                  variant={TextVariants.bodyLarge}
                >
                  {t('NewGroup')}
                </CustomText>
              </Tap>
            )
          }
        />
        {userDetails?.isAdvisor && (
          <CustomTextInput
            style={styles.searchInput}
            mode={InputVariants.outlined}
            label={t('Search')}
            placeholder={t('Search')}
            showLabel={false}
            showError={false}
            text={search}
            loading={loadingSearchList}
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
        )}

        {loading ? (
          <SkeletonList
            count={10}
            style={styles.main}
            children={
              <View style={styles.heading}>
                <View style={styles.skeletonProfile} />
                <View style={styles.skeletonName} />
              </View>
            }
          />
        ) : (
          <View style={styles.main}>
            <CustomFlatList
              ref={flatListRef}
              data={messagingList}
              extraData={[loadingSearchList, messagingAllList]}
              keyExtractor={keyExtractor}
              contentContainerStyle={
                messagingList.length == 0
                  ? styles.flatListContainerStyle
                  : undefined
              }
              refreshing={loading}
              // keyExtractor={keyExtractor}
              onRefresh={initializePage}
              ListHeaderComponent={
                newGroupLoading ? (
                  <Skeleton>
                    <View style={styles.heading}>
                      <View style={styles.skeletonNewGroupProfile} />
                      <View style={styles.skeletonNewGroupName} />
                    </View>
                  </Skeleton>
                ) : (
                  <></>
                )
              }
              ListEmptyComponent={
                errorMessage ? (
                  <View style={styles.errorContainer}>
                    <EmptyView source={Images.email} label={errorMessage} />
                  </View>
                ) : !loadingSearchList ? (
                  <View style={styles.errorContainer}>
                    <EmptyView label={t('NoResultsFound')} />
                  </View>
                ) : (
                  <></>
                )
              }
              getItemType={item => {
                return typeof item === 'string' ? 'chatListHeader' : 'contact';
              }}
              renderItem={({ item }) => renderContacts(item)}
            />

            {/* {!loading && userDetails?.isAdvisor && (
              <Tap
                onPress={() => handleOnClickCreateGroup()}
                style={styles.fabContainer}>
                <View style={styles.fabView}>
                  <CustomImage
                    source={Images.refer}
                    type={ImageType.svg}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.fabIcon}
                  />
                </View>
              </Tap>
            )} */}
          </View>
        )}
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    flatListContainerStyle: { flex: 1, justifyContent: 'center' },
    flatlistHeader: {
      padding: 10,
      paddingBottom: 0,
    },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 0,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    groupIcon: {
      width: 10,
      height: 10,
    },
    outofOfficeIcon: {
      width: 17,
      height: 17,
    },
    fabIcon: {
      width: 21,
      height: 21,
      alignSelf: 'center',
    },
    fabContainer: {
      alignItems: 'center',
      position: 'absolute',
      bottom: 20,
      right: 20,
      height: 60,
      width: 60,
      borderRadius: 60,
      backgroundColor: theme.colors.primaryContainer,
    },
    groupIconLay: {
      position: 'absolute',
      left: 32,
      top: 30,
      backgroundColor: theme.colors.primary,
      borderRadius: 20, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 20, // Ensure size consistency
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    outOfOffcIconLay: {
      position: 'absolute',
      left: 32,
      top: 30,
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
    statusIconLay: {
      position: 'absolute',
      left: 35,
      top: 35,
      borderRadius: 20, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 12, // Ensure size consistency
      height: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadBadgeStyle: {
      backgroundColor: theme.colors.tertiary,
      borderRadius: 20, // Circular shape
      width: 21, // Ensure size consistency
      height: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      flex: 1,
      marginLeft: 10,
    },
    skeletonProfile: {
      borderRadius: theme.roundness,
      height: 50,
      width: 50,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginVertical: 7,
    },

    skeletonName: {
      height: 30,
      width: '65%',
      borderRadius: 5,
      backgroundColor: theme.colors.surface,
    },

    skeletonNewGroupProfile: {
      borderRadius: theme.roundness,
      height: 50,
      width: 50,
      backgroundColor: theme.colors.surface,
      marginRight: 15,
      marginLeft: 7,
      marginVertical: 7,
    },

    skeletonNewGroupName: {
      height: 30,
      width: '65%',
      borderRadius: 5,
      backgroundColor: theme.colors.surface,
    },
    searchInput: {
      marginHorizontal: 15,
    },

    profileLay: {
      position: 'relative',
      marginRight: 13,
    },

    profileAvatar: {
      height: 45,
      width: 45,
    },

    unreadBadge: {
      backgroundColor: 'darkblue',
      borderRadius: 10,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    errorContainer: { alignSelf: 'center' },
    fabView: {
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
    },
    profilePic: {
      height: 40,
      width: 40,
      borderRadius: theme.roundness,
    },
    addGroupHeaderBtn: {
      height: 30,
      minWidth: 110, //by Yuvraj for new group  ui issue ios
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 5,
      borderWidth: 0.8,
      borderColor: theme.colors.outline,
      marginRight: 20,
      borderRadius: theme.roundness,
      padding: 0,
      paddingHorizontal: 15, //by Yuvraj for new group  ui issue ios
    },
    addGroupHeaderText: {
      marginTop: -4,
    },
  });

export default Message;
