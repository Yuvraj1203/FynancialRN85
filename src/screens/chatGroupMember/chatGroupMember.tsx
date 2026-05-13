import {
  CustomAvatar,
  CustomButton,
  CustomCheckBox,
  CustomFlatList,
  CustomImage,
  CustomText,
  Shadow,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
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
  FormTextInput,
} from '@/components/molecules';
import {
  InputModes,
  InputReturnKeyType,
} from '@/components/molecules/customTextInput/formTextInput';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { showImagePopup } from '@/components/template/imagePopup/imagePopup';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  SignalRMessageModel,
  UploadFileListToS3Model,
  UserChatList,
} from '@/services/models';
import { tenantDetailStore, userStore } from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import {
  handleGoBack,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { removeMessageNotifications } from '@/utils/notificationUtils';
import { isEmpty, showSnackbar, useBackPressHandler } from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { Divider } from 'react-native-paper';
import { z } from 'zod';
import { ChatReturnProp } from '../chat/chat';
import { MessageReturnProp } from '../message/message';

/** Added by @Akshita 05-02-25 ---> Enum representing different parent screens for group members (FYN-4314)*/
export enum ChatGroupMemberParent {
  fromAddGroupFab = 'fromAddGroupFab',
  fromGroupChat = 'fromGroupChat',
  fromActionSheetEdit = 'fromActionSheetEdit',
}
/**
 * Added by @Akshita 05-02-25 ---> screen prop types for navigating to chat group member screen
 * from different parent screen (FYN-4314)*/
export type ChatGroupMemberProps = {
  memberList: UserChatList[];
  groupName?: string;
  groupId?: string;
  isAdmin?: boolean;
  groupImage?: string;
  groupImageId?: string;
  screenType?: ChatGroupMemberParent;
  teamHeaderId?: string;
  isGroupCreatedBySystem?: boolean;
};

const ChatGroupMember = () => {
  /** Added by @Akshita 05-02-25 ---> Hook for navigation within the app (FYN-4314)*/
  const navigation = useAppNavigation();
  /** Added by @Akshita 05-02-25 ---> Hook to get route parameters for the ChatGroupMember screen (FYN-4314)*/
  const route = useAppRoute('ChatGroupMember');
  /** Added by @Akshita 05-02-25 ---> Hook for localization support (FYN-4314)*/
  const { t } = useTranslation();
  /** Added by @Akshita 05-02-25 ---> Fetches the current theme (FYN-4314)*/
  const theme = useTheme();
  /** Added by @Akshita 05-02-25 ---> Creates styles using the theme (FYN-4314)*/
  const styles = makeStyles(theme);

  /** Added by @Akshita 05-02-25 ---> Fetches user details from the global store (FYN-4314)*/
  const userDetails = userStore(state => state.userDetails);

  /** Added by @Akshita 05-02-25 ---> State to control the visibility of the add member popup (FYN-4314)*/
  const [showAddMemberPopUp, setShowAddMemberPopUp] = useState(false);

  /** Added by @Akshita 05-02-25 ---> State to control the visibility of the image selection popup (FYN-4314)*/
  const [showImageSelectionPopup, setShowImageSelectionPopup] = useState(false);

  /** Added by @Akshita 05-02-25 ---> Stores the selected profile picture URL (FYN-4314)*/
  const [profilePic, setProfilePic] = useState(route.params?.groupImage);

  /** Added by @Akshita 05-02-25 ---> Indicates if the profile picture has been removed (FYN-4314)*/
  const [isProfileRemoved, setIsProfileRemoved] = useState(false);

  /** Added by @Akshita 05-02-25 ---> Loading state for general UI (FYN-4314)*/
  const [loading, setLoading] = useState(false);

  /** Added by @Akshita 05-02-25 ---> Loading state when updating group details (FYN-4314)*/
  const [loadingUpdateGroup, setLoadingUpdateGroup] = useState(false);

  /** Added by @Akshita 05-02-25 ---> Stores the list of members in the chat group (FYN-4314)*/
  const [memberDataList, setMemberDataList] = useState<UserChatList[]>(
    route.params?.memberList ?? [],
  );

  /** Added by @Akshita 05-02-25 ---> Stores the contact list (FYN-4314)*/
  const [contactDataList, setContactDataList] = useState<UserChatList[]>([]);

  /** Added by @Akshita 05-02-25 ---> Stores the filtered contact list based on search (FYN-4314)*/
  const [filteredContactDataList, setFilteredContactDataList] = useState<
    UserChatList[]
  >([]);

  /** Added by @Akshita 05-02-25 ---> Stores the search query input (FYN-4314)*/
  const [search, setSearch] = useState('');

  /** Added by @Akshita 05-02-25 ---> State to control the visibility of the admin action sheet popup (FYN-4314)*/
  const [showAdminActionSheetPopUp, setShowAdminActionSheetPopUp] =
    useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deletePopupLoading, setDeletePopupLoading] = useState(false);

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editPopupLoading, setEditPopupLoading] = useState(false);

  /** Added by @Akshita 05-02-2025 -> tenant details store  */
  const tenantDetail = tenantDetailStore();

  /** Added by @Akshita 05-02-25 ---> State to track if the message list data has changed (FYN-4314)*/
  const [isMsgListDataChanged, setIsMsgListDataChanged] = useState(false);

  /** Added by @Akshita 05-02-25 ---> State to track if the group was deleted or the user left (FYN-4314)*/
  const [isGroupDeletedOrUserLeft, setIsGroupDeletedOrUserLeft] =
    useState(false);

  /** Added by @Akshita 05-02-25 ---> Hook to return data back to the previous screen (FYN-4314)*/
  const { sendDataBack } = useReturnDataContext();

  /** Added by @Akshita 07-08-25---> Retrieves signal R details from store(FYN-9294 */

  const signalRStore = useSignalRStore();

  /** Added by @Akshita 05-02-25 ---> Zod schema for group name validation (FYN-4314)*/
  const schema = z.object({
    groupName: z
      .string()
      .min(1, { message: t('PleaseEnterGroupName') })
      .max(30, { message: t('GroupNameMustBeAtMost30Chars') }),
  });

  const [mediaList, setMediaList] = useState<Asset[]>([]);

  /** Added by @Akshita 05-02-25 ---> Infers type from Zod schema for form control (FYN-4314)*/
  type Schema = z.infer<typeof schema>;

  /** Added by @Akshita 05-02-25 ---> Importing required functions from useForm hook (FYN-4314)*/
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Schema>({
    defaultValues: {
      /** Added by @Akshita 05-02-25 ---> Setting default value for group name based on screen type (FYN-4314)*/
      groupName:
        route.params?.screenType == ChatGroupMemberParent.fromActionSheetEdit
          ? route.params.groupName!
          : '',
    },
    /** Added by @Akshita 05-02-25 ---> Using Zod schema resolver for form validation (FYN-4314)*/
    resolver: zodResolver(schema),
  });

  /** Added by @Akshita 05-02-25 ---> useEffect to log and call moveUserToTop on component mount (FYN-4314)*/
  useEffect(() => {
    moveUserToTop();
  }, []);

  useEffect(() => {
    if (userDetails) {
      /**
           *Added by @Akshita 23-07-25 ---> Function to handle the status update and update the 
           outOfOfficeMembers status in the list */

      const handleStatusUpdate = (data: SignalRMessageModel) => {
        Log('Status update received=>' + JSON.stringify(data));
        setMemberDataList(prev =>
          prev.map(item => {
            // only update UserChatList entries, not header strings
            if (item.userId === data.userId) {
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
          if (
            route.params?.groupId?.toLowerCase() == data.groupId.toLowerCase()
          ) {
            if (
              route.params?.screenType !== ChatGroupMemberParent.fromAddGroupFab
            ) {
              navigation.popToTop(); // or navigation.navigate('Message') if that’s your target route
            } else {
              handleGoBack(navigation);
            }

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

  /** Added by @Akshita 05-02-25 ---> Handling hardware back press to update message list data (FYN-4314)*/
  useBackPressHandler(() => updateMessagingListData());

  /** Added by @Akshita 05-02-25 ---> Function to update message list before navigating back (FYN-4314)*/
  const updateMessagingListData = (updated?: boolean) => {
    /** Added by @Akshita 05-02-25 ---> Check if message list data has changed or group is deleted (FYN-4314)*/
    if (updated || isMsgListDataChanged || isGroupDeletedOrUserLeft) {
      const currentUserIdStr = userDetails?.userID;
      const userStillInGroup = memberDataList.find(
        m => (m.userId ?? '') == currentUserIdStr,
      );

      // If NOT coming from add-group flow and user has removed themself -> go to Message
      if (
        route.params?.screenType !== ChatGroupMemberParent.fromAddGroupFab &&
        !userStillInGroup
      ) {
        sendDataBack('Message', {
          isMessageListModified: true,
        } as MessageReturnProp);
        // hard-redirect to the message list
        navigation.popToTop(); // or navigation.navigate('Message') if that’s your target route
        return true;
      }
      /** Added by @Akshita 05-02-25 ---> If editing a group, update group detai ls (FYN-4314)*/
      if (route.params?.screenType == ChatGroupMemberParent.fromActionSheetEdit)
        // If editing an existing group and user is still a member -> update Chat screen
        sendDataBack('Chat', {
          memberList: memberDataList,
          groupName: getValues('groupName'),
          groupImage: profilePic,
          leftGroup: isGroupDeletedOrUserLeft,
        } as ChatReturnProp);
      else {
        // If NOT coming from add-group flow and user has removed themself -> go to Message
        sendDataBack('Message', {
          isMessageListModified: true,
        } as MessageReturnProp);
      }
    }
    return true;
  };

  /** Added by @Akshita 05-02-25 ---> Function to get the header title based on screen type (FYN-4314)*/
  const getHeaderTitle = (): string => {
    switch (route.params?.screenType) {
      case ChatGroupMemberParent.fromAddGroupFab:
        return t('CreateNewGroup');
      case ChatGroupMemberParent.fromActionSheetEdit:
        return t('EditGroup');
      case ChatGroupMemberParent.fromGroupChat:
        return '';
      default:
        return '';
    }
  };

  /**
   *  Added by @Akshita 05-02-25 ---> Function to move logged-in user
   * to the top of the member list and display the name as 'YOU' (FYN-4314)*/
  const moveUserToTop = () => {
    /**Added by @Akshita 05-02-25 --->  Filter the member list to get the current user's entry  (FYN-4314)*/
    const userInstance = memberDataList.filter(
      contact => contact.userId === userDetails?.userID,
    );

    /**Added by @Akshita 05-02-25 --->  Extract isGroupAdmin value from the found instance  (FYN-4314)*/

    /** Added by @Akshita 05-02-25 --->  Create a new object for the matched user  (FYN-4314)*/
    const updatedUser: UserChatList = {
      userFullName: 'You',
      emailAddress: userDetails?.email,
      friendProfilePicture: userDetails?.profileImageUrl,
      userId: userDetails?.userID,
      isGroupAdmin: userInstance.at(0)?.isGroupAdmin ?? false,
      status: userInstance.at(0)?.status,
    };

    /** Added by @Akshita 05-02-25 --->  Filter out the existing entry of this user  (FYN-4314)*/
    const filteredContacts = memberDataList.filter(
      contact => contact.userId !== userDetails?.userID,
    );

    const groupAdmins: UserChatList[] = filteredContacts.filter(
      user => user.isGroupAdmin,
    );
    const nonAdmins: UserChatList[] = filteredContacts.filter(
      user => !user.isGroupAdmin,
    );
    /**
     *  Added by @Akshita 05-02-25 --->  Move the logged-in user to the top, followed by group
     *  admins, then the remaining users(FYN-4314)*/
    const updatedContacts = [updatedUser, ...groupAdmins, ...nonAdmins];

    setMemberDataList(updatedContacts);
  };

  /** Added by @Akshita 05-02-25 --->  function to set the color of the status value (FYN-4314)*/
  const handleUserStatusColor = (value?: string) => {
    if (value?.trim().toLowerCase() == 'available') {
      return theme.colors.statusAvailableColor;
    } else if (value?.trim().toLowerCase() == 'busy') {
      return theme.colors.statusBusyColor;
    } else if (value?.trim().toLowerCase() == 'out of office') {
      return theme.colors.error;
    }
  };

  /** Added by @Akshita 05-02-25 ---> function to handle updates in group member listing on the screen(FYN-4314)*/
  const saveMemberSelection = () => {
    setShowAddMemberPopUp(false);

    /** Added by @Akshita 05-02-25 --->   Filter the member list to get the current user's entry(FYN-4314)*/
    const userInstance = memberDataList.filter(
      contact => contact.userId === userDetails?.userID,
    );

    /** Added by @Akshita 05-02-25 --->  Extract isGroupAdmin value from the found instance (FYN-4314)*/
    const isAdmin =
      userInstance.length > 0 ? userInstance[0].isGroupAdmin : false;
    const updatedUser: UserChatList = {
      userFullName: 'You',
      emailAddress: userDetails?.email,
      friendProfilePicture: userDetails?.profileImageUrl,
      userId: userDetails?.userID,
      isGroupAdmin: isAdmin,
    };

    const updatedMemberList = [
      updatedUser,
      ...contactDataList.filter(item => item.isSelected),
    ];

    setMemberDataList(updatedMemberList);
  };

  /**
   * Added by @Akshita 05-02-25 ---> function to update the member listing is admin
   * removes any user from the group(FYN-4314)*/
  const removeMember = (index: number) => {
    showAlertPopup({
      title: t('RemoveMember'),
      msg: t('RemoveMemberMsg'),
      PositiveText: t('Remove'),
      NegativeText: t('Cancel'),
      onPositivePress: () => {
        setMemberDataList(prevList => {
          /** Added by @Akshita 05-02-25 ---> Create a new array to maintain immutability (FYN-4314)*/
          const updatedList = [...prevList];

          /** Added by @Akshita 05-02-25 ---> Remove the contact at the given index (FYN-4314)*/
          updatedList.splice(index, 1);
          return updatedList;
        });
      },
      onNegativePress() {},
    });
  };

  /** Added by @Akshita 05-02-25 ---> Handler for profile picture selection (FYN-4314)*/

  /** Added by @Yuvraj 19-03-2025 -> on selecting new picture from local device (FYN-5821) */
  const handleProfilePic = (mediaList: Asset[]) => {
    setMediaList(mediaList);
    setProfilePic(mediaList.at(0)?.uri);
  };

  /** Added by @Akshita 05-02-25 ---> handles the search results of the add member list (FYN-4314)*/
  const handleSearch = (query: string) => {
    setSearch(query);

    if (query.trim().replace(/\s+/g, ' ').length === 0) {
      setFilteredContactDataList([...contactDataList]); // Reset to full list
    } else {
      const newList = contactDataList.filter(item =>
        item.userFullName?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredContactDataList(newList);
    }
  };

  /** Added by @Akshita 05-02-25 ---> Handles the selection of a member in the add member list (FYN-4314)*/
  const handleMemberSelection = (member: UserChatList) => {
    /**
     * Added by @Akshita 05-02-25 ---> Toggles selection status of a member in the
     * main contact list (FYN-4314)*/
    setContactDataList([
      ...contactDataList.map(item => {
        if (item.userId == member.userId) {
          return {
            ...item,
            isSelected: !member.isSelected,
          };
        } else {
          return item;
        }
      }),
    ]);

    /**
     * Added by @Akshita 05-02-25 ---> Toggles selection status of a member in the
     * filtered contact list (FYN-4314)*/
    setFilteredContactDataList([
      ...filteredContactDataList.map(item => {
        if (item.userId == member.userId) {
          return {
            ...item,
            isSelected: !member.isSelected,
          };
        } else {
          return item;
        }
      }),
    ]);
  };

  /** Added by @Akshita 05-02-25 ---> Handles group creation and editing by making an API call (FYN-4314)*/
  const handleGroupCreateAndEdit = (data?: Schema) => {
    Log('handle group creation function call ');
    if (memberDataList.length == 1) {
      showSnackbar(t('AddGroupMembers'), 'danger');
    } else {
      const formData = new FormData();

      if (mediaList.length > 0) {
        const fileType = {
          uri: mediaList[0].uri,
          name: mediaList[0].fileName,
          type: mediaList[0].type,
        };

        formData.append('files', fileType); // Correctly append file object
        UploadFileListToS3Api.mutate(formData);
      } else {
        CreateGroupAndAddMembersApi.mutate({
          groupId: route.params?.groupId ? route.params?.groupId : '',
          GroupName: data?.groupName,
          MemberUserIds:
            memberDataList.map(member => member.userId).join(',') || '',
          profilePictureId: '',
          isProfilePictureRemove: isProfileRemoved,
        });
      }
    }
  };

  /** Added by @Akshita 05-02-25 ---> Displays an action sheet based on user role (FYN-4314)*/
  const handleActionSheetItems = () => {
    setShowAdminActionSheetPopUp(true);
  };

  /** Added by @Yuvraj 19-03-2025 -> Api for uploading picture and getting id (FYN-5821) */
  const UploadFileListToS3Api = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UploadFileListToS3Model[]>({
        endpoint: `${ApiConstants.UploadFileListToS3}?fromURL=feed`,
        method: HttpMethodApi.Post,
        data: sendData,
        byPassRefresh: true,
      }); // API Call
    },
    onMutate(variables) {
      setLoadingUpdateGroup(true);
      setEditPopupLoading(true);
    },
    onSettled(data, error, variables, context) {
      if (error) {
        setLoadingUpdateGroup(false);
        setEditPopupLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      // Success Response
      if (data.result != null) {
        CreateGroupAndAddMembersApi.mutate({
          groupId: route.params?.groupId ? route.params?.groupId : '',
          GroupName: getValues('groupName'),
          MemberUserIds:
            memberDataList.map(member => member.userId).join(',') || '',
          profilePictureId: data.result.at(0)?.contentID,
          isProfilePictureRemove: false,
        });
      } else {
        showSnackbar(
          data.error?.message ? data.error?.message : t('SomeErrorOccured'),
          'danger',
        );
        setLoadingUpdateGroup(false);
        setEditPopupLoading(false);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * Added by @Akshita 05-02-25 --->getFriendsForGroupV2Api call that
   *  Fetches the friend list for group creation START (FYN-4314)*/
  const getFriendsForGroupV2Api = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<UserChatList[]>({
        endpoint: ApiConstants.GetFriendsForGroupV2,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /** Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)*/
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      /** Added by @akshita 05-02-25 ---> Success Response(FYN-4314)*/

      if (data.result) {
        /** 
          * Added by @akshita 05-02-25 ---> Filter out the user whose userId matches userDetails.userID
         because ADMIN can not remove himself from group*/
        const filteredData = data.result.filter(
          contact => contact.userId !== userDetails?.userID,
        );

        const newData: UserChatList[] = filteredData.map(element => {
          let isSelected = false;

          if (memberDataList && memberDataList.length > 0) {
            const findUser = memberDataList.find(
              item => item.userId == element.userId,
            );
            if (findUser) {
              isSelected = true;
            }
          }
          return {
            ...element,
            isSelected,
          };
        });
        setContactDataList(newData);
        /**
         * Added by @akshita 05-02-25 ---> this list is for displaying all group member
         * list if group id on tap of header title or expert chat*/
        setFilteredContactDataList(newData);
      }
    },
    onError(error, variables, context) {
      /**
       * Added by @akshita 05-02-25 ---> show error snackbar*/
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Akshita 05-02-25 ---> API call to create and edit a group and add members START(FYN-4314)*/
  const CreateGroupAndAddMembersApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: `${
          ApiConstants.CreateGroupAndAddMembers
        }${'?'}${new URLSearchParams(sendData).toString()}`,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onMutate(variables) {
      /** added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/
      if (!loadingUpdateGroup) {
        setLoadingUpdateGroup(true);
        setEditPopupLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      /** Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)*/
      setLoadingUpdateGroup(false);
      setEditPopupLoading(false);
      setShowEditPopup(false);
    },
    onSuccess(data, variables, context) {
      /** Added by @Akshita 05-02-25 ---> Check if the API response contains a valid result (FYN-4314)*/
      if (data.result) {
        /** Added by @Akshita 05-02-25 ---> Set flag to indicate that the message list data has changed (FYN-4314)*/
        setIsMsgListDataChanged(true);

        /** Added by @Akshita 05-02-25 ---> Show success message based on screen type (FYN-4314)*/
        if (route.params?.screenType == ChatGroupMemberParent.fromAddGroupFab) {
          showSnackbar(t('GroupAddeddMsg'), 'success');
          /**
           * Added by @Akshita 05-02-25 ---> If the screen type is from adding a group,
           * call updateMessagingListData function and navigate back (FYN-4314)*/
          if (updateMessagingListData(true)) {
            handleGoBack(navigation); // Navigate back
          }
        } else {
          if (updateMessagingListData(true)) {
            handleGoBack(navigation); // Navigate back
          }
          showSnackbar(t('GroupUpdatedMsg'), 'success');
        }
      }
    },
    onError(error, variables, context) {
      /**Added by @akshita 05-02-25 ---> show error snackbar*/
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by @Akshita 05-02-25 ---> API call to create and edit a group and add members END(FYN-4314)*/

  const RemoveUserFromGroupApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.RemoveUserFromGroup,
        method: HttpMethodApi.Delete,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      //Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)
      setDeletePopupLoading(true);
      setIsGroupDeletedOrUserLeft(true);
    },
    onSettled(data, error, variables, context) {
      setDeletePopupLoading(false);
      setShowDeletePopup(false);
      // Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)
      if (error) {
        setIsGroupDeletedOrUserLeft(false);
      }
    },
    onSuccess(data, variables, context) {
      //Added by @akshita 05-02-25 ---> Success Response(FYN-4314)
      if (data.result) {
        if (updateMessagingListData()) {
          // handleGoBack(navigation);
          navigation.popToTop();
        }
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by @Akshita 05-02-25 ---> RemoveGroupApi call to delete the group START(FYN-4314)*/

  const RemoveGroupApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.RemoveGroup,
        method: HttpMethodApi.Delete,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /**Added by @akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314)*/
      setDeletePopupLoading(true);
      setIsGroupDeletedOrUserLeft(true);
    },
    onSettled(data, error, variables, context) {
      setDeletePopupLoading(false);
      setShowDeletePopup(false);
      /**  Added by @akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314)*/
      if (error) {
        setIsGroupDeletedOrUserLeft(false);
      }
    },
    onSuccess(data, variables, context) {
      /** Added by @Akshita 05-02-25 ---> on Success Response redirect the user to the message screen(FYN-4314)*/
      if (data.result) {
        // if (updateMessagingListData()) {
        // handleGoBack(navigation);
        navigation.popToTop();

        showSnackbar(t('GroupRemovedMsg'), 'danger');

        // }
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by @Akshita 05-02-25 ---> RemoveGroupApi call to delete the group END(FYN-4314)*/

  /**
   * Added by @Akshita 05-02-25 ---> renderMemberDataList function to render UI
   * of group member listing START(FYN-4314)*/

  const renderMemberDataList = (item: UserChatList, index: number) => {
    return (
      <Tap
        onPress={() => {
          navigation.navigate('MemberProfile', {
            userId: item.userId,
            AvailabilityStatus: item.status,
          });
        }}
      >
        <View style={styles.memberCard}>
          <View style={styles.memberInfo}>
            <View style={{ position: 'relative' }}>
              <CustomAvatar
                viewStyle={styles.profileAvatarLay}
                imageStyle={styles.profileAvatar}
                source={
                  !isEmpty(item.targetProfilePicture)
                    ? { uri: item.targetProfilePicture }
                    : undefined
                } // Image URI
                text={
                  isEmpty(item.targetProfilePicture)
                    ? item.userFullName
                    : undefined
                } // Show initials
                type={ImageType.png}
              />

              {item.status?.trim().toLowerCase() == 'out of office' ||
              item.status?.toLowerCase() == 'o' ? (
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
                ></View>
              )}
            </View>

            <View style={styles.memberName}>
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
                variant={TextVariants.bodySmall}
              >
                {item.emailAddress}
              </CustomText>

              <CustomText
                color={handleUserStatusColor(item.status)}
                variant={TextVariants.bodySmall}
              >
                {item.status}
              </CustomText>
            </View>
          </View>

          {item.isGroupAdmin ? (
            <CustomText
              variant={TextVariants.bodySmall}
              style={styles.adminLabel}
            >
              {t('Admin')}
            </CustomText>
          ) : !item.isGroupAdmin &&
            route.params?.screenType != ChatGroupMemberParent.fromGroupChat ? (
            <View>
              <Tap
                style={styles.deleteLay}
                onPress={() => {
                  if (!loadingUpdateGroup) {
                    if (route.params?.teamHeaderId) {
                      showSnackbar(t('CantEditGroup'), 'warning', 5000);
                    } else {
                      removeMember(index);
                    }
                  }
                }}
              >
                <CustomImage
                  source={Images.delete}
                  type={ImageType.svg}
                  color={
                    route.params?.teamHeaderId
                      ? theme.colors.surfaceDisabled
                      : theme.colors.onSurfaceVariant
                  }
                  style={styles.deleteIcon}
                />
              </Tap>
            </View>
          ) : (
            <></>
          )}
        </View>
      </Tap>
    );
  };
  /**
   * Added by @Akshita 05-02-25 ---> renderMemberDataList function to render UI of group
   * member listing END(FYN-4314)*/

  /**
   * Added by @Akshita 05-02-25 ---> renderAddMemberDataList function to render
   *  UI of member listing in the bottom pop up START(FYN-4314)*/

  const renderAddMemberDataList = (item: UserChatList) => {
    return (
      <Tap
        onPress={() => {
          handleMemberSelection(item);
        }}
      >
        <View style={styles.memberCard}>
          <View style={styles.memberInfo}>
            <CustomAvatar
              source={
                !isEmpty(item.targetProfilePicture)
                  ? { uri: item.targetProfilePicture }
                  : undefined
              } // Image URI
              text={
                isEmpty(item.targetProfilePicture)
                  ? item.userFullName
                  : undefined
              } // Show initials
              type={ImageType.png}
            />

            <View style={styles.memberName}>
              <CustomText
                ellipsis={TextEllipsis.tail}
                variant={TextVariants.titleMedium}
              >
                {item.userFullName}
              </CustomText>
              <CustomText
                ellipsis={TextEllipsis.tail}
                variant={TextVariants.bodySmall}
              >
                {item.emailAddress}
              </CustomText>
            </View>
          </View>
          <CustomCheckBox
            value={item.isSelected ? true : false}
            onClick={() => handleMemberSelection(item)}
          />
          <Divider />
        </View>
      </Tap>
    );
  };

  /**
   * Added by @Akshita 05-02-25 ---> renderAddMemberDataList function to render
   *  UI of member listing in the bottom pop up END(FYN-4314)*/
  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          showBack
          title={getHeaderTitle()}
          onBackPress={updateMessagingListData}
          rightIcons={
            route.params?.screenType != ChatGroupMemberParent.fromAddGroupFab
              ? [
                  ...(tenantDetail.tenantDetails?.useManagedPackage &&
                  route.params?.isGroupCreatedBySystem
                    ? []
                    : [
                        {
                          name: t('options'),
                          source: Images.options,
                          type: ImageType.svg,
                          onPress: () => {
                            if (!loadingUpdateGroup) {
                              handleActionSheetItems();
                            }
                          },
                        },
                      ]),
                ]
              : []
          }
        />

        <View style={styles.main}>
          <ScrollView>
            <View style={styles.centeredView}>
              <Shadow style={styles.shadow}>
                <Tap
                  onPress={() => {
                    if (!loadingUpdateGroup) {
                      if (profilePic) {
                        const imageList = [profilePic];
                        showImagePopup({
                          imageList: imageList,
                          defaultIndex: 0,
                        });
                      }
                    }
                  }}
                >
                  <View>
                    {!isEmpty(profilePic) ? (
                      <CustomImage
                        style={styles.profileImage}
                        source={{ uri: profilePic }}
                      />
                    ) : route.params?.screenType !=
                        ChatGroupMemberParent.fromAddGroupFab &&
                      isEmpty(profilePic) ? (
                      <CustomAvatar
                        text={route.params?.groupName!}
                        initialVariant={TextVariants.headlineLarge}
                        viewStyle={styles.profileImage}
                      />
                    ) : (
                      <CustomImage
                        source={Images.defaultProfile}
                        style={[styles.profileImage]}
                        // resizeMode={ResizeModeType.contain}
                      />
                    )}
                  </View>
                </Tap>

                {route.params?.screenType !=
                  ChatGroupMemberParent.fromGroupChat && (
                  <>
                    <Tap
                      style={styles.cameraIcon}
                      onPress={() =>
                        !loadingUpdateGroup && setShowImageSelectionPopup(true)
                      }
                    >
                      <CustomImage
                        source={Images.camera}
                        type={ImageType.svg}
                        color={theme.colors.surface}
                        style={styles.Icon}
                      />
                    </Tap>

                    {!isEmpty(profilePic) && (
                      <Tap
                        style={styles.closeIcon}
                        onPress={() => {
                          setProfilePic('');
                          setIsProfileRemoved(true);
                        }}
                      >
                        <CustomImage
                          source={Images.close}
                          type={ImageType.svg}
                          color={theme.colors.surface}
                          style={styles.cancelProfileIcon}
                        />
                      </Tap>
                    )}
                  </>
                )}
              </Shadow>

              {route.params?.screenType ==
                ChatGroupMemberParent.fromGroupChat && (
                <View style={styles.groupDetailWrapper}>
                  <CustomText
                    variant={TextVariants.titleLarge}
                    style={styles.groupName}
                  >
                    {route.params.groupName!}
                  </CustomText>
                </View>
              )}
            </View>

            {route.params?.screenType !=
              ChatGroupMemberParent.fromGroupChat && (
              <View style={styles.addMemberContainer}>
                <FormTextInput
                  label={t('GroupName')}
                  name={'groupName'}
                  inputMode={InputModes.default}
                  control={control}
                />
              </View>
            )}
            <View style={styles.memberListContainer}>
              <Shadow>
                <View style={styles.memberlistHeader}>
                  <CustomText variant={TextVariants.bodyLarge}>{`${t(
                    'Members',
                  )} (${
                    memberDataList.length > 0 ? memberDataList.length : '0'
                  })`}</CustomText>

                  {route.params?.screenType !=
                    ChatGroupMemberParent.fromGroupChat && (
                    <Tap
                      onPress={() => {
                        if (!loadingUpdateGroup) {
                          if (route.params?.teamHeaderId) {
                            showSnackbar(t('CantEditGroup'), 'warning', 5000);
                          } else {
                            setShowAddMemberPopUp(true);
                            getFriendsForGroupV2Api.mutate({});
                          }
                        }
                      }}
                    >
                      <CustomImage
                        source={Images.addCircle}
                        type={ImageType.svg}
                        color={
                          route.params?.teamHeaderId
                            ? theme.colors.surfaceDisabled
                            : theme.colors.onSurfaceVariant
                        }
                        style={styles.Icon}
                      />
                    </Tap>
                  )}
                </View>

                <View style={styles.flatlist}>
                  <CustomFlatList
                    scrollEnabled={false}
                    data={memberDataList}
                    ListEmptyComponent={
                      <EmptyView label={t('NoMemberAvailable')} />
                    }
                    ItemSeparatorComponent={() => <Divider />}
                    renderItem={({ item, index }) =>
                      renderMemberDataList(item, index)
                    }
                  />
                </View>
              </Shadow>
            </View>
          </ScrollView>

          {route.params?.screenType != ChatGroupMemberParent.fromGroupChat && (
            <View style={styles.wrapper}>
              {isMsgListDataChanged == false && (
                <CustomButton
                  mode={ButtonVariants.outlined}
                  style={styles.saveCancelButton}
                  onPress={() => {
                    if (!loadingUpdateGroup) {
                      handleGoBack(navigation);
                    }
                  }}
                >
                  {t('Cancel')}
                </CustomButton>
              )}

              <CustomButton
                style={styles.saveCancelButton}
                loading={loadingUpdateGroup}
                onPress={handleSubmit(handleGroupCreateAndEdit)}
              >
                {route.params?.screenType ==
                ChatGroupMemberParent.fromAddGroupFab
                  ? t('CreateGroup')
                  : t('Save')}
              </CustomButton>
            </View>
          )}
        </View>

        <CustomImagePicker
          showPopup={showImageSelectionPopup}
          setShowPopup={setShowImageSelectionPopup}
          mediaList={handleProfilePic}
          crop={true}
          cropHeight={300}
          cropWidth={300}
        />

        <CustomBottomPopup
          shown={showAddMemberPopUp}
          setShown={setShowAddMemberPopUp}
          title={t('AddMember')}
          keyboardHandle
        >
          <View style={styles.addMemberPopUp}>
            <View style={styles.addMemberList}>
              <View style={styles.searchLay}>
                <CustomTextInput
                  text={search}
                  onChangeText={handleSearch}
                  // style={styles.searchInput}
                  placeholder={t('Search')}
                  showLabel={false}
                  returnKeyType={InputReturnKeyType.search}
                  prefixIcon={{ source: Images.search, type: ImageType.svg }}
                  suffixIcon={{
                    source: Images.closeCircle,
                    type: ImageType.svg,
                    tap() {
                      setSearch('');
                      setFilteredContactDataList([...contactDataList]);
                    },
                  }}
                  onSubmitEditing={e => {
                    if (!isEmpty(e.nativeEvent.text)) {
                      handleSearch(e.nativeEvent.text);
                    }
                  }}
                />
              </View>

              {loading ? (
                <SkeletonList
                  count={8}
                  style={styles.flatlist}
                  children={
                    <View style={styles.memberCardSkeleton}>
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonCheckBox} />
                    </View>
                  }
                />
              ) : (
                <CustomFlatList
                  data={filteredContactDataList}
                  ItemSeparatorComponent={() => <Divider />}
                  keyExtractor={item => {
                    if (!item.userId) {
                      console.warn('Missing userId for item:', item);
                      return Math.random().toString();
                    }
                    return item.userId.toString();
                  }}
                  ListEmptyComponent={
                    <EmptyView label={t('NoMemberAvailable')} />
                  }
                  renderItem={({ item }) => renderAddMemberDataList(item)}
                />
              )}
              <CustomButton
                style={styles.addMemberButton}
                // loading={loading}
                onPress={() => {
                  saveMemberSelection();
                }}
              >
                {t('AddMember')}
              </CustomButton>
            </View>
          </View>
        </CustomBottomPopup>

        <CustomActionSheetPoup
          shown={showAdminActionSheetPopUp}
          setShown={setShowAdminActionSheetPopUp}
          centered={false}
          hideIcons={false}
          children={[
            {
              title:
                route.params?.isAdmin ||
                userDetails?.role?.toLocaleLowerCase() == 'admin'
                  ? t('DeleteGroup')
                  : t('LeaveGroup'),
              titleColor: theme.colors.error,
              imageColor: theme.colors.error,
              image:
                route.params?.isAdmin ||
                userDetails?.role?.toLocaleLowerCase() == 'admin'
                  ? Images.delete
                  : Images.logout,
              imageType: ImageType.svg,
              onPress: () => {
                setShowDeletePopup(true);
              },
            },
          ]}
        />

        <CustomPopup
          shown={showDeletePopup}
          setShown={setShowDeletePopup}
          compact
          title={
            route.params?.isAdmin ||
            userDetails?.role?.toLocaleLowerCase() == 'admin'
              ? t('DeleteGroup')
              : t('LeaveGroup')
          }
          msg={
            route.params?.isAdmin ||
            userDetails?.role?.toLocaleLowerCase() == 'admin'
              ? t('DeleteGroupMsg')
              : t('LeaveGroupMsg')
          }
          loading={deletePopupLoading}
          onPositivePress={() => {
            if (
              route.params?.isAdmin ||
              userDetails?.role?.toLocaleLowerCase() == 'admin'
            ) {
              RemoveGroupApi.mutate({
                groupId: route.params?.groupId,
              });
            } else {
              RemoveUserFromGroupApi.mutate({
                groupId: route.params?.groupId,
              });
            }
          }}
          onNegativePress={() => {
            setShowDeletePopup(false);
            setDeletePopupLoading(false);
          }}
        />

        <CustomPopup
          shown={showEditPopup}
          setShown={setShowEditPopup}
          compact
          title={t('EditGroup')}
          msg={t('EditGroupMsg')}
          loading={editPopupLoading}
          onPositivePress={() => {
            handleSubmit(handleGroupCreateAndEdit);
          }}
          onNegativePress={() => {
            setShowEditPopup(false);
            setLoadingUpdateGroup(false);
            setEditPopupLoading(false);
          }}
        />
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    centeredView: {
      alignItems: 'center',
      marginVertical: 20,
    },
    shadow: {
      height: 140,
      width: 140,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileImage: {
      width: 140,
      height: 140,
      borderRadius: theme.roundness,
      resizeMode: 'cover', // Ensures full coverage of the container
      overflow: 'hidden',
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.gradientColorLevel2,
    },
    Icon: {
      width: 22,
      height: 22,
    },
    cancelProfileIcon: {
      width: 13,
      height: 13,
    },
    deleteLay: {
      paddingLeft: 10,
    },
    deleteIcon: {
      width: 17,
      height: 17,
    },
    cameraIcon: {
      borderWidth: 1,
      position: 'absolute',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.extraRoundness,
      padding: 8,
      top: 110,
      left: 115,
    },
    closeIcon: {
      borderWidth: 1,
      position: 'absolute',
      left: 125,
      backgroundColor: theme.colors.error,
      bottom: 125,
      borderRadius: theme.extraRoundness,
      padding: 4,
    },
    groupDetailWrapper: {
      alignItems: 'center',
    },
    groupName: {
      marginTop: 15,
      marginHorizontal: 15,
    },
    memberListContainer: {
      padding: 10,
    },
    memberlistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    flatlist: {
      flex: 1,
    },
    addMemberList: {
      height: 400,
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: 8,
      paddingLeft: 3,
      // marginVertical: 3,
    },
    memberCardSkeleton: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'center',
      marginTop: 13,
    },
    memberInfoLay: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'space-between',
    },
    memberInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    memberName: {
      marginLeft: 10,
      flex: 1,
      gap: 5,
    },
    avatar: {
      height: 40,
      width: 40,
      //borderRadius: 50,
    },
    adminLabel: {
      // height: 18,
      // width: 63,
      alignSelf: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.userMessage,
      paddingHorizontal: 10,
      paddingVertical: 2,
      marginTop: 5,
    },
    saveCancelButton: {
      borderRadius: theme.roundness,
      flex: 1,
    },

    addMemberButton: {
      paddingHorizontal: 20,
      borderRadius: theme.roundness,
      marginVertical: 15,
      marginHorizontal: 25,
    },
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      marginVertical: 15,
      marginHorizontal: 15,
    },
    addMemberWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statusIconLay: {
      position: 'absolute',
      right: 5,
      bottom: 2,
      borderRadius: theme.extraRoundness, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 12, // Ensure size consistency
      height: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addMemberContainer: {
      padding: 10,
    },
    addMemberPopUp: {
      flex: 1,
      padding: 5,
    },
    searchInput: {
      flex: 1,
    },
    searchLay: {
      justifyContent: 'center',
      paddingHorizontal: 9,
    },
    skeletonTitle: {
      backgroundColor: theme.colors.surface,
      width: '80%',
      height: 35,
      borderRadius: theme.roundness,
      marginTop: 8,
    },
    skeletonCheckBox: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '5%',
      height: 25,
      marginTop: 11,
      marginRight: 10,
    },
    outofOfficeIcon: {
      width: 14,
      height: 14,
    },
    outOfOffcIconLay: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      borderRadius: theme.extraRoundness, // Circular shape
      padding: 4, // Adjust padding for proper sizing
      width: 15, // Ensure size consistency
      height: 15,
      backgroundColor: theme.dark
        ? theme.colors.onSurface
        : theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileAvatarLay: {
      height: 55,
      width: 55,
      borderRadius: theme.extraRoundness,
      borderColor: theme.colors.outline,
      borderWidth: 1,
    },
    profileAvatar: {
      height: 53,
      width: 53,
      borderRadius: theme.extraRoundness,
    },
  });

export default ChatGroupMember;
