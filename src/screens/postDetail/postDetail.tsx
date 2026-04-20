// import {CustomImage, CustomText, SkeletonContent} from '@/components/atoms';
// import {ImageType} from '@/components/atoms/customImage/customImage';
// import {TextVariants} from '@/components/atoms/customText/customText';
// import {CustomActionSheetPoup, CustomHeader} from '@/components/molecules';
// import {PostItem, ReportPopup, SafeScreen} from '@/components/template';
// import {showAlertPopup} from '@/components/template/alertPopup/alertPopup';
// import {PostType} from '@/components/template/postItem/postItem';
// import {ApiConstants} from '@/services/apiConstants';
// import {HttpMethodApi, makeRequest} from '@/services/apiInstance';
// import {
//   GetAllPostModel,
//   PostListModel,
// } from '@/services/models/getAllPostModel/getAllPostModel';
// import {appUserLoginStore, getUserGroupsDetailsStore} from '@/store';
// import {Images} from '@/theme/assets/images';
// import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
// import Log from '@/utils/logger';
// import {
//   parseRouteToDynamicReset,
//   useAppNavigation,
//   useAppRoute,
//   useReturnDataContext,
// } from '@/utils/navigationUtils';
// import {
//   CustomInAppBrowser,
//   processHtmlContent,
//   showSnackbar,
//   useBackPressHandler,
// } from '@/utils/utils';
// import {useMutation} from '@tanstack/react-query';
// import React, {useEffect, useState} from 'react';
// import {useTranslation} from 'react-i18next';
// import {ScrollView, StyleSheet, View} from 'react-native';
// import {CommentScreenParent} from '../comments/comments';
// import {GroupMembersScreenParent} from '../groupMembers/groupMembers';
// import {MyGroupReturnProp} from '../myGroup/myGroup';

// export type PostDetailProps = {
//   type: PostType;
//   groupId?: string;
//   forumId?: string;
//   data?: PostListModel;
//   fromNotification?: boolean;
// };

// export type PostDetailReturnProp = {
//   updated?: boolean;
// };

// function PostDetail() {
//   const navigation = useAppNavigation(); // navigation

//   const route = useAppRoute('PostDetail'); // route

//   const theme = useTheme(); // theme

//   const styles = makeStyles(theme); // access StylesSheet with theme implemented

//   const {t} = useTranslation(); //translation

//   // user store to access user information.
//   const userDetails = appUserLoginStore(state => state.userDetails);

//   // user selected group
//   const userGroup = getUserGroupsDetailsStore(state => state.selectedUserGroup);

//   const [loading, setLoading] = useState<boolean>(false); // loading for skeleton

//   // loading for update Post
//   const [updateLoading, setUpdateLoading] = useState(false);

//   const [postData, setPostData] = useState<PostListModel>();

//   const [pageNo, setPageNo] = useState<number>();

//   const [showPopup, setShowPopup] = useState(false); // show report popup

//   const [postLiked, setPostLiked] = useState<boolean>();

//   const [commentUpdated, setCommentUpdated] = useState<boolean>();

//   const openInAppBrowser = CustomInAppBrowser();

//   // get data back from next screen
//   // send data back to previous screen
//   const {receiveDataBack, sendDataBack} = useReturnDataContext();

//   useEffect(() => {
//     Log('PostDetail Params=>' + JSON.stringify(route.params));
//     if (route.params?.data) {
//       setLoading(true);
//       setPostData(route.params?.data!);
//       setPageNo(route.params.data.pageNo);
//       setLoading(false);
//     } else if (route.params?.forumId) {
//       getAllPostApi.mutate({
//         UserID: userDetails?.UserID,
//         PAGE_NO: 1,
//         GroupID: route.params?.groupId,
//         FmThreadID: route.params?.forumId,
//       });
//     }
//   }, []);

//   receiveDataBack('PostDetail', (data: PostDetailReturnProp) => {
//     if (data.updated != undefined) {
//       setUpdateLoading(true);
//       setCommentUpdated(true);

//       getAllPostApi.mutate({
//         UserID: userDetails?.UserID,
//         PAGE_NO: 1,
//         GroupID: route.params?.groupId,
//         FmThreadID: postData?.MainPostID,
//       });
//     }
//   });

//   useBackPressHandler(() => sendBackPostData());

//   const sendBackPostData = () => {
//     if (route.params?.fromNotification) {
//       navigation.reset(
//         parseRouteToDynamicReset({
//           screen: 'DrawerRoutes',
//           params: {
//             screen: 'BottomBarRoutes',
//             params: {
//               screen:
//                 route.params?.type == PostType.myGroup
//                   ? 'MyGroupRoutes'
//                   : 'Community',
//             },
//           },
//         }),
//       );
//       return true;
//     }

//     if (commentUpdated || postLiked) {
//       sendDataBack(
//         route.params?.type == PostType.myGroup ? 'MyGroup' : 'Community',
//         {
//           postId: postData?.MainPostID,
//           like: postLiked,
//           pageNo: pageNo, // sending original pageNo
//           comment: commentUpdated ? postData?.Comments : undefined,
//         } as MyGroupReturnProp,
//       );
//     }

//     return true;
//   };

//   // function to update list when user likes post or dislike post
//   // function also triggered when user likes a post in post detail page
//   const updatePost = ({
//     likePost,
//     comment,
//   }: {
//     likePost?: boolean;
//     comment?: number;
//   }) => {
//     var like = postData?.Likes ? postData?.Likes : 0;
//     var likeStatus = postData?.LIKE_STATUS;
//     var comments = postData?.Comments ? postData?.Comments : 0;

//     if (likePost) {
//       if (postData?.LIKE_STATUS == 'Y') {
//         if (like > 0) {
//           like = like - 1;
//         }
//       } else {
//         like = like + 1;
//       }
//       likeStatus = postData?.LIKE_STATUS === 'Y' ? 'N' : 'Y';

//       setPostLiked(true);
//     }

//     if (comment) {
//       comments = comment;

//       setCommentUpdated(true);
//     }

//     const updatedItem: PostListModel = {
//       ...postData,
//       LIKE_STATUS: likeStatus,
//       Likes: like,
//       Comments: comments,
//     };

//     setPostData(updatedItem);

//     if (likePost) {
//       likeApi.mutate({
//         UserID: userDetails?.UserID,
//         PostID: postData?.MainPostID,
//         PostType: 'T',
//       });
//     }
//   };

//   /* get all post Api call to get groups related posts START */
//   const getAllPostApi = useMutation({
//     mutationFn: (sendData: Record<string, any>) => {
//       return makeRequest<GetAllPostModel>({
//         endpoint:
//           route.params?.type == PostType.myGroup
//             ? ApiConstants.GetAllPost
//             : ApiConstants.GetAllPostCommunity,
//         method: HttpMethodApi.Post,
//         data: sendData,
//       }); // API Call
//     },
//     onMutate(variables) {
//       // if this api gets called from add or edit comment api
//       // then don't show any skeleton or load more
//       if (updateLoading) {
//         return;
//       }

//       setLoading(true); // to show skeleton loader
//     },
//     onSettled(data, error, variables, context) {
//       // if this api gets called from add or edit comment api
//       // then don't show any skeleton or load more
//       if (updateLoading) {
//         setUpdateLoading(false);
//         return;
//       }
//       setLoading(false);
//     },
//     onSuccess(data, variables, context) {
//       // Success Response
//       if (data.ReturnValue?.MainPostList) {
//         if (data.ReturnValue.MainPostList[0]) {
//           setPostData(
//             processHtmlContent(data.ReturnValue.MainPostList[0], {
//               maxWords: 50,
//               linkColor: theme.colors.links,
//             }),
//           );
//         }
//       }
//     },
//     onError(error, variables, context) {
//       // Error Response
//       setPostData(undefined);
//       showSnackbar(error.message, 'danger');
//     },
//   });
//   /* get all post Api call to get groups related posts END */

//   /* like api call to like a post START */
//   const likeApi = useMutation({
//     mutationFn: (sendData: Record<string, any>) => {
//       return makeRequest<number>({
//         endpoint:
//           route.params?.type == PostType.myGroup
//             ? ApiConstants.Like
//             : ApiConstants.LikeCommunity,
//         method: HttpMethodApi.Post,
//         data: sendData,
//       }); // API Call
//     },
//     onSuccess(data, variables, context) {
//       // Success Response
//     },
//     onError(error, variables, context) {
//       // Error Response

//       showSnackbar(error.message, 'danger');
//     },
//   });
//   /* like post api call to like a post END */

//   /* delete post post Api call to delete selected post START */
//   const deletePostApi = useMutation({
//     mutationFn: (sendData: Record<string, any>) => {
//       return makeRequest<number>({
//         endpoint: ApiConstants.DeleteThread,
//         method: HttpMethodApi.Post,
//         data: sendData,
//       }); // API Call
//     },
//     onMutate(variables) {
//       setUpdateLoading(true);
//     },
//     onSuccess(data, variables, context) {
//       // Success Response
//       if (data.ReturnValue) {
//         showSnackbar(t('PostDeleted'), 'success');

//         sendBackPostData();
//       }
//     },
//     onError(error, variables, context) {
//       // Error Response

//       showSnackbar(error.message, 'danger');
//     },
//   });
//   /* delete post post Api call to delete selected post END */

//   return (
//     <SafeScreen>
//       <View style={{flex: 1}}>
//         <CustomHeader
//           showBack
//           title={
//             //  capitalizeFirstLetter(postData?.PostBy)
//             route.params?.type == PostType.myGroup
//               ? t('MyGroups')
//               : t('Community')
//           }
//           onBackPress={() => sendBackPostData()}
//         />
//         {loading ? (
//           <SkeletonContent />
//         ) : postData ? (
//           <ScrollView>
//             <View style={[styles.flatListLay]}>
//               <PostItem
//                 item={postData}
//                 type={route.params?.type ?? PostType.myGroup}
//                 shortContent={false}
//                 openLinks={openInAppBrowser}
//                 likeClick={() => {
//                   updatePost({likePost: true});
//                 }}
//                 likeListClick={() => {
//                   navigation.navigate('GroupMembers', {
//                     postId: postData.MainPostID,
//                     type:
//                       route.params?.type == PostType.myGroup
//                         ? GroupMembersScreenParent.myGroup
//                         : GroupMembersScreenParent.community,
//                     likeType: 'T',
//                   });
//                 }}
//                 commentClick={() => {
//                   navigation.navigate('Comments', {
//                     type: CommentScreenParent.postDetail,
//                     parentType:
//                       route.params?.type == PostType.myGroup
//                         ? CommentScreenParent.myGroup
//                         : CommentScreenParent.community,
//                     postData: postData,
//                     pageNo: postData.pageNo,
//                     groupId: userGroup?.GroupID,
//                   });
//                 }}
//                 optionsClick={() => setShowPopup(true)}
//                 loading={updateLoading}
//               />
//             </View>
//           </ScrollView>
//         ) : (
//           <View style={styles.emptyLay}>
//             <CustomImage
//               source={Images.search}
//               type={ImageType.svg}
//               color={theme.colors.primary}
//               style={styles.emptyIcon}
//             />
//             <CustomText
//               variant={TextVariants.bodyLarge}
//               style={styles.emptyLabel}>
//               {t('NoPostsAvailable')}
//             </CustomText>
//           </View>
//         )}
//         {postData?.Owner == 'Y' ? (
//           <CustomActionSheetPoup
//             shown={showPopup}
//             setShown={setShowPopup}
//             hideIcons={true}
//             centered={false}
//             children={[
//               {
//                 title: t('Delete'),
//                 image: Images.delete,
//                 imageType: ImageType.svg,
//                 onPress: () => {
//                   showAlertPopup({
//                     title: t('DeletePost'),
//                     msg: t('DeletePostMsg'),
//                     PositiveText: t('Delete'),
//                     NegativeText: t('Cancel'),
//                     onPositivePress: () => {
//                       deletePostApi.mutate({
//                         UserID: userDetails?.UserID,
//                         Thread_id: postData?.MainPostID,
//                       });
//                     },
//                   });
//                 },
//               },
//               {
//                 title: t('Edit'),
//                 image: Images.editSquare,
//                 imageType: ImageType.svg,
//                 onPress: () => {},
//               },
//             ]}
//           />
//         ) : (
//           <ReportPopup
//             id={postData?.MainPostID}
//             reportType={route.params?.type == PostType.myGroup ? 'F' : 'GF'}
//             shown={showPopup}
//             setShown={setShowPopup}
//           />
//         )}
//       </View>
//     </SafeScreen>
//   );
// }

// const makeStyles = (theme: CustomTheme) =>
//   StyleSheet.create({
//     main: {padding: 10},
//     flatListLay: {
//       flex: 1,
//     },
//     emptyLay: {
//       flex: 1,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     emptyIcon: {height: 50, width: 50},
//     emptyLabel: {marginTop: 10},
//   });

// export default PostDetail;
