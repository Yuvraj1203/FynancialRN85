import {
  CustomAvatar,
  CustomFlatList,
  CustomText,
  Shadow,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetLikeByUserList,
  GetUsersByGroupIdForTagModel,
} from '@/services/models';
import { templateStore, userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation, useAppRoute } from '@/utils/navigationUtils';
import { isEmpty, showSnackbar } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Added by @Akshita 05-02-25 -> Defines different parent types for Group Members screen (FYN-4314)
 *
 * This enum specifies the different screen types for the Group Members component, which helps determine
 * the context for API calls. The types include the "Group Members" screen and the "Likes" screen, where users
 * who liked a post are displayed.
 *
 * @enum {string} GroupMembersScreenParent
 * @param {string} groupMembers - Represents the 'Group Members' screen.
 * @param {string} like - Represents the 'Likes' screen, where users who liked a post are displayed.
 *
 * @returns {GroupMembersScreenParent} The type of screen for Group Members.
 */
export enum GroupMembersScreenParent {
  groupMembers = 'groupMembers',
  like = 'like',
}

/**
 * Added by @Akshita 05-02-2025 -> Defines props for the Group Members component (FYN-4314)
 *
 * A type that specifies the props for the Group Members component. It includes the screen type,
 * the post ID, and the group ID. These props help manage the content and functionality specific
 * to different group-related screens, such as displaying group members or post details.
 *
 * @param {Object} props - The props for the Group Members component.
 * @param {GroupMembersScreenParent} [props.type] - Specifies the screen type (My Group, Group Members, Likes).
 * @param {string} [props.postId] - The ID of the post associated with the group.
 * @param {string} [props.groupId] - The ID of the group.
 *
 * @returns {GroupMembersProps} The props type for the Group Members component.
 */
export type GroupMembersProps = {
  type?: GroupMembersScreenParent;
  postId?: string;
  groupId?: string;
};
//  @Akshita 05-02-25 ---> Main component for displaying group members (FYN-4314)
const GroupMembers = () => {
  /** @Akshita 05-02-25 ---> Hook to navigate between screens (FYN-4314) */
  const navigation = useAppNavigation();

  /** @Akshita 05-02-25 ---> Retrieves route parameters for GroupMember screen (FYN-4314) */
  const route = useAppRoute('GroupMembers');

  /** @Akshita 05-02-25 ---> Translation hook for multi-language support (FYN-4314) */
  const { t } = useTranslation();

  /** @Akshita 05-02-25 ---> Gets the current theme for styling (FYN-4314) */
  const theme = useTheme();

  /** @Akshita 05-02-25 ---> Generates styles dynamically based on the theme (FYN-4314) */
  const styles = makeStyles(theme);

  /** @Akshita 05-02-25 ---> State to track loading status to show skeleton (FYN-4314) */
  const [loading, setLoading] = useState(false);

  /** @Akshita 05-02-25 ---> Stores the search query for filtering group members (FYN-4314) */
  const [search, setSearch] = useState<string>();

  /** @Akshita 05-02-25 ---> Retrieves logged-in user details from store (FYN-4314) */
  const userDetails = userStore(state => state.userDetails);

  /** @Akshita 05-02-25 ---> Stores the filtered list of group members (FYN-4314) */
  const [groupMembersList, setGroupMembersList] = useState<
    GetUsersByGroupIdForTagModel[]
  >([]);

  /** @Akshita 05-02-25 ---> Stores the full list of group members (FYN-4314) */
  const [groupMembersAllList, setGroupMembersAllList] = useState<
    GetUsersByGroupIdForTagModel[]
  >([]);

  const selectedTemplateData = templateStore(state => state.selectedTemplate);

  /** @Akshita 05-02-25 ---> Calls API when component mounts (FYN-4314) */
  useEffect(() => {
    if (userDetails) {
      callApi();
    }
  }, []);

  /** @Akshita 05-02-25 ---> Function to call API based on route parameters (FYN-4314) */
  const callApi = () => {
    if (route.params?.type == GroupMembersScreenParent.groupMembers) {
      /** @Akshita 05-02-25 ---> Calls API to get group members if the screen type is 'groupMembers'(FYN-4314) */
      getUsersByGroupIdForTagApi.mutate({
        GroupID: selectedTemplateData?.groupID,
      });
    } else {
      /** @Akshita 05-02-25 ---> Calls API to get users who liked a post(FYN-4314) */
      getLikeByUserListApi.mutate({
        Id: route.params?.postId,
      });
    }
  };

  /** @Akshita 05-02-25 ---> Handles user click event on a group member (FYN-4314) */
  const handleOnClick = async (data: GetUsersByGroupIdForTagModel) => {
    /**
     * @Akshita 05-02-25 ---> If the clicked user is the logged-in user,
     * than redirect the user to their profile screen(FYN-4314)
     */
    if (data.id == userDetails?.userID) {
      //navigation.navigate('Profile');
      return;
    }
    //
    /** @Akshita 05-02-25 --->  Show error if user ID is invalid(FYN-4314) */
    else if (data.id == 0 || data.id == null) {
      showSnackbar(t('NoUserFound'), 'danger');
    }

    /** @Akshita 05-02-25 --->Navigate to the member's profile page (FYN-4314) */
    navigation.navigate('MemberProfile', {
      userId: data.id,
    });
  };

  /** @Akshita 05-02-25 ---> Function to filter group members based on search query (FYN-4314) */
  const searchGroupMembers = (query?: string) => {
    const trimmedQuery = query?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
    setSearch(trimmedQuery);

    if (isEmpty(trimmedQuery)) {
      /** @Akshita 05-02-25 ---> If no query is provided, reset the list(FYN-4314) */

      const newData: GetUsersByGroupIdForTagModel[] = [...groupMembersAllList];
      setGroupMembersList(newData);
    } else {
      /** @Akshita 05-02-25 ---> If search query exists, filter the group members list(FYN-4314) */

      if (trimmedQuery) {
        /** @Akshita 05-02-25 ---> Update the displayed list with filtered results (FYN-4314) */

        setGroupMembersList(
          groupMembersAllList.filter(item => {
            /** @Akshita 05-02-25 ---> Convert name to lowercase for case-insensitive search(FYN-4314) */

            const userName = item.userName?.toLocaleLowerCase() || '';
            const surname = item.surname?.toLocaleLowerCase() || '';
            return (
              userName.includes(trimmedQuery.toLocaleLowerCase()) ||
              surname.includes(trimmedQuery.toLocaleLowerCase())
            );
          }),
        );
      }
    }
  };

  /** Added by @Tarun 24-03-2025 -> handle refresh api call (FYN-5971) */
  const handleRefresh = () => {
    if (route.params?.type == GroupMembersScreenParent.groupMembers) {
      /** @Akshita 05-02-25 ---> Calls API to get group members if the screen type is 'groupMembers'(FYN-4314) */
      getUsersByGroupIdForTagApi.mutate({
        GroupID: selectedTemplateData?.groupID,
      });
    } else {
      /** @Akshita 05-02-25 ---> Calls API to get users who liked a post(FYN-4314) */
      getLikeByUserListApi.mutate({
        Id: route.params?.postId,
      });
    }
  };

  /** Added by @Tarun 24-03-2025 -> Render reminder item using flash list (FYN-5971) */
  const renderGroupMemberItem = (item: GetUsersByGroupIdForTagModel) => {
    return (
      <Tap onPress={() => handleOnClick(item)}>
        <Shadow style={styles.heading}>
          <CustomAvatar
            source={
              !isEmpty(item.userProfileImage) && {
                uri: item.userProfileImage,
              }
            }
            text={isEmpty(item.userProfileImage) ? item.fullName : undefined}
          />
          <CustomText variant={TextVariants.bodyLarge} style={styles.name}>
            {`${item.fullName}${
              route.params?.type == GroupMembersScreenParent.groupMembers &&
              item.role == 'advisor'
                ? `(${item.role})`
                : ''
            }`}
          </CustomText>
        </Shadow>
      </Tap>
    );
  };

  /** @Akshita 05-02-25 ---> getUsersByGroupIdForTagApi call to get users by group ID (FYN-4314) */
  const getUsersByGroupIdForTagApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetUsersByGroupIdForTagModel[]>({
        endpoint: ApiConstants.GetUsersByGroupIdForTag,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      /** @Akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** @Akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314) */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        const newData: GetUsersByGroupIdForTagModel[] = [...data.result];

        /** @Akshita 05-02-25 ---> Store all members list and update UI (FYN-4314) */
        setGroupMembersAllList(newData);
        setGroupMembersList(newData);
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  /**
   * @Akshita 05-02-25 ---> getLikeByUserListApi call to get users by POST ID
   * who liked the post START (FYN-4314)
   */
  const getLikeByUserListApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetLikeByUserList[]>({
        endpoint: ApiConstants.GetLikeByUserList,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /** @Akshita 05-02-25 ---> Set loading state true before API call starts(FYN-4314) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** @Akshita 05-02-25 --->Reset loading state before API call gets settled(FYN-4314) */
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.result) {
        const newData: GetUsersByGroupIdForTagModel[] = data.result.map(
          element => ({
            //@Akshita 05-02-25 --->Store user details in the existing list
            // to display group member list conditionally (FYN-4314)
            userProfileImage: element.profileImage,
            fullName: element.userName,
            id: element.id,
          }),
        );

        /** @Akshita 05-02-25 ---> Store all members list and update UI (FYN-4314) */
        setGroupMembersAllList(newData);
        setGroupMembersList(newData);
      }
    },
    onError(error, variables, context) {
      /** @Akshita 05-02-25 --->  Error Response show error toast (FYN-4314) */
      showSnackbar(error.message, 'danger');
    },
  });

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          showBack
          showSearchIcon={
            route.params?.type == GroupMembersScreenParent.groupMembers
          }
          searchText={search}
          setSearchText={query => searchGroupMembers(query)}
          onSearchSubmit={query => searchGroupMembers(query)}
          title={
            route.params?.type == GroupMembersScreenParent.groupMembers
              ? t('GroupMembers')
              : t('Likes')
          }
        />
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
          <CustomFlatList
            data={groupMembersList}
            contentContainerStyle={
              groupMembersList.length == 0
                ? styles.flatListContainerStyle
                : undefined
            }
            refreshing={loading}
            keyExtractor={item => item.id!.toString()}
            onRefresh={handleRefresh}
            ListEmptyComponent={<EmptyView label={t('NoUserFound')} />}
            renderItem={({ item }) => renderGroupMemberItem(item)}
          />
        )}
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1 },
    flatListContainerStyle: { flexGrow: 1, justifyContent: 'center' },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    name: {
      flex: 1,
      marginLeft: 10,
    },
    skeletonProfile: {
      borderRadius: 50,
      height: 50,
      width: 50,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginVertical: 7,
    },
    skeletonHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
    },
    skeletonName: {
      height: 30,
      width: '65%',
      borderRadius: 5,
      backgroundColor: theme.colors.surface,
    },
  });

export default GroupMembers;
