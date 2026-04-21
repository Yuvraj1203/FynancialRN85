import {
  CustomAvatar,
  CustomImage,
  CustomText,
  HtmlRender,
  Skeleton,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomCarousel } from '@/components/molecules';
import { RootStackParamList } from '@/navigators/types';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { GetAllCommentsModel } from '@/services/models';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  extractEmbeddedIframes,
  extractLinkPreviewHtml,
  isEmpty,
  processHtmlContent,
  showSnackbar,
  stripPreviewUrlFromHtml,
} from '@/utils/utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

export enum CommentType {
  comment = 'comment',
  ncomment = 'ncomment',
  ncommentHeader = 'ncommentHeader',
}

type Props = {
  item: GetAllCommentsModel;
  type: CommentType;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onLongPress?: (from?: string) => void;
  onLongPressReply?: (reply?: GetAllCommentsModel, from?: string) => void;
  openLinks?: (url: string) => void;
  likeClick?: () => void;
  likeListClick?: (postId?: string) => void;
  optionsClick?: () => void;
  handleImageClick?: ({
    images,
    index,
    iframe,
  }: {
    images?: string[];
    index?: number;
    iframe?: string;
  }) => void;
  handleProfileClick?: (userId?: number) => void;
  handleReplyClick?: (reply?: GetAllCommentsModel) => void;
  loading?: boolean;
  replyLoading?: boolean;
  selectedItem?: string;
  setSelectedComment?: (value: string | undefined) => void;
  setShown: (value: boolean) => void;
};

function CommentItem({ item, ...props }: Props) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  const [hasMoreData, setHasMoreData] = useState(true);

  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedItemBg, setSelectedItemBg] = useState<string | undefined>(
    theme.colors.surfaceVariant,
  );
  const bgCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [showAllReplies, setShowAllReplies] = useState(
    item.showAllReplies ?? false,
  );

  const [showMore, setShowMore] = useState(item.showMore ?? false);

  useEffect(() => {
    if (item.showAllReplies) {
      setShowAllReplies(true);
    }
  }, [item.showAllReplies]);

  useEffect(() => {
    if (
      props.selectedItem?.toLowerCase() == item.postDetailID?.toLowerCase() &&
      bgCountRef.current < 3
    ) {
      intervalRef.current = setInterval(() => {
        setSelectedItemBg(prev => {
          return prev === undefined ? theme.colors.surfaceVariant : undefined;
        });

        bgCountRef.current++;

        // Stop the interval after 3 executions
        if (bgCountRef.current > 5) {
          setSelectedItemBg(undefined);
          clearInterval(intervalRef.current as NodeJS.Timeout); // Clear the interval
          props.setSelectedComment?.(undefined);
        }
      }, 500);
    }

    // Cleanup function to clear the interval when the effect is cleaned up
    return () => {
      if (intervalRef.current) {
        setSelectedItemBg(undefined);
        clearInterval(intervalRef.current); // Ensure to clear the interval if the component unmounts
      }
    };
  }, []);

  const renderCarouselItem = (item: string[]) => (
    <View>
      <CustomCarousel
        data={item}
        aspectRatio={1}
        height={200}
        children={(mediaItem, index) => (
          <View style={styles.imgLay}>
            <Tap
              onPress={() => {
                props.handleImageClick?.({ images: item, index: index });
              }}
              style={styles.imgContainer}
            >
              <CustomImage
                source={{ uri: mediaItem }}
                resizeMode={ResizeModeType.cover}
                style={styles.img}
              />
            </Tap>
          </View>
        )}
      />
    </View>
  );

  const setHtmlContent = (
    data: GetAllCommentsModel[],
    allData?: GetAllCommentsModel[],
  ): GetAllCommentsModel[] => {
    let newData: GetAllCommentsModel[] = allData ? [...allData] : [];

    for (let i = 0; i < data.length; i++) {
      const commentData = data[i];

      const {
        cleanHtml: cleanCommentHtml,
        linkPreviewHtml: commentLinkPreviewHtml,
      } = extractLinkPreviewHtml(commentData.detailHTML ?? '');
      const {
        cleanHtml: cleanCommentHtmlNoIframes,
        embeddedIframeHtml: commentEmbeddedIframeHtml,
      } = extractEmbeddedIframes(cleanCommentHtml);
      const updatedHtml = processHtmlContent({
        html: cleanCommentHtmlNoIframes,
        maxWords: 50,
        linkColor: theme.colors.links,
        showMore: true,
      });
      if (
        !newData.some(item => item.postDetailID === commentData.postDetailID)
      ) {
        newData.push({
          ...commentData,
          detailHTML: stripPreviewUrlFromHtml(
            updatedHtml?.Content,
            commentLinkPreviewHtml,
          ),
          shortContent: stripPreviewUrlFromHtml(
            updatedHtml?.shortContent,
            commentLinkPreviewHtml,
          ),
          iFrameList: updatedHtml?.iFrameList,
          linkPreviewHtml: commentLinkPreviewHtml,
          embeddedIframeHtml: commentEmbeddedIframeHtml,
        });
      }
    }

    return newData;
  };

  const updateReply = ({
    commentItem,
    like,
    callApi,
  }: {
    commentItem?: GetAllCommentsModel;
    like?: boolean;
    commentCount?: number;
    callApi?: boolean;
  }) => {
    item.allCommentsReplies = item.allCommentsReplies?.map(reply => {
      if (reply.postDetailID !== commentItem?.postDetailID) return reply;

      const likeCount = like
        ? reply.likedByUser
          ? Math.max((reply.likeCount || 0) - 1, 0)
          : (reply.likeCount || 0) + 1
        : reply.likeCount;

      return {
        ...reply,
        likedByUser: like ? !reply.likedByUser : reply.likedByUser,
        likeCount,
      };
    });

    if (callApi) {
      likeApi.mutate({
        PostID: commentItem?.postDetailID,
        IsLikeClick: like,
        commentItem: commentItem,
      });
    }
  };

  const callRepliesApi = (pageNumber: number) => {
    setPage(pageNumber);

    getAllCommentsApi.mutate({
      PostId: item.postDetailID,
      PageNumber: pageNumber,
    });
  };

  const getAllCommentsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetAllCommentsModel[]>({
        endpoint: ApiConstants.GetAllComments,
        method: HttpMethodApi.Get,
        data: sendData,
      });
    },
    onMutate(variables) {
      setApiLoading(true);
      if (variables.PageNumber === 1) {
        setLoading(true);
      }
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false);
      if (variables.PageNumber === 1) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (data?.result && data?.result.length > 0) {
        const replyListLatest: GetAllCommentsModel[] = data.result.map(
          reply => ({
            ...reply,
            pageNo: variables.PageNumber,
            mainCommentId: item.postDetailID,
            viewType: CommentType.ncomment,
          }),
        );

        item.allCommentsReplies = setHtmlContent(
          replyListLatest,
          variables.PageNumber > 1 ? item.allCommentsReplies : [],
        );

        if (data.result.at(data.result.length - 1)?.hasNextFlag) {
          setHasMoreData(true);
        } else {
          setHasMoreData(false);
        }
      } else {
        setHasMoreData(false);
      }
    },
    onError(error, variables, context) {
      setHasMoreData(false);
    },
  });

  const likeApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.LikeComment,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      updateReply({
        commentItem: variables.commentItem,
        like: true,
      });
    },
  });

  const handleViewReplies = () => {
    if (showAllReplies) {
      if (!apiLoading && hasMoreData) {
        callRepliesApi(page + 1);
      } else {
        setShowAllReplies(false);
        item.allCommentsReplies = [item.allCommentsReplies?.at(0)!];
      }
    } else {
      setShowAllReplies(true);
      if (
        item.allCommentsReplies == undefined ||
        item.allCommentsReplies.length == 1
      ) {
        callRepliesApi(1);
      }
    }
  };

  return (
    <View
      style={
        props.selectedItem?.toLowerCase() == item.postDetailID?.toLowerCase()
          ? { backgroundColor: selectedItemBg }
          : {}
      }
    >
      <Tap
        onLongPress={() => {
          if (!props.loading) {
            // props.onLongPress?.();
          }
        }}
        style={styles.noPadding}
      >
        <View
          style={[
            styles.main,
            props.type == CommentType.ncomment && {
              marginLeft: 5,
              marginRight: 0,
            },
          ]}
        >
          <Tap
            style={styles.profilePic}
            onPress={() => props.handleProfileClick?.(item.userID)}
          >
            <CustomAvatar
              source={
                !isEmpty(item.userProfileLocation) && {
                  uri: item.userProfileLocation,
                }
              }
              text={
                isEmpty(item.userProfileLocation) ? item.userName : undefined
              }
              initialVariant={TextVariants.labelMedium}
              viewStyle={
                props.type == CommentType.ncomment
                  ? styles.nCommentProfilePic
                  : styles.commentProfilePic
              }
              imageStyle={
                props.type == CommentType.ncomment
                  ? styles.nCommentProfilePic
                  : styles.commentProfilePic
              }
            />
          </Tap>
          <View style={styles.content}>
            <View style={styles.userNameLay}>
              <View style={styles.userName}>
                <Tap
                  style={styles.noPadding}
                  onPress={() => props.handleProfileClick?.(item.userID)}
                >
                  <CustomText
                    variant={
                      props.type == CommentType.comment
                        ? TextVariants.bodyMedium
                        : TextVariants.labelLarge
                    }
                  >
                    {item.userName}
                  </CustomText>
                </Tap>
              </View>
              <Tap
                onPress={() => {
                  props.likeClick?.();
                }}
                style={[styles.noPadding]}
              >
                <CustomImage
                  source={item.likedByUser ? Images.likeFilled : Images.like}
                  style={
                    props.type == CommentType.ncomment
                      ? styles.replyLikeIcon
                      : styles.commentLikeIcon
                  }
                  type={ImageType.svg}
                  color={
                    item.likedByUser
                      ? theme.colors.error
                      : theme.colors.onSurfaceVariant
                  }
                  fillColor={item.likedByUser ? theme.colors.error : undefined}
                />
              </Tap>
              <Tap
                onPress={() => {
                  props.likeListClick?.(item.postDetailID);
                }}
                style={[styles.noPadding]}
              >
                <CustomText
                  variant={TextVariants.labelMedium}
                  style={styles.likeCount}
                >{`${
                  !!item.likeCount && item.likeCount > 0 ? item.likeCount : ''
                }`}</CustomText>
              </Tap>
            </View>

            <HtmlRender
              html={
                showMore
                  ? item.detailHTML
                  : item.shortContent ?? item.detailHTML
              }
              iFrameList={item.iFrameList}
              fontSize={
                props.type == CommentType.comment
                  ? theme.fonts.bodyMedium.fontSize
                  : theme.fonts.labelMedium.fontSize
              }
              style={styles.desc}
              openLinks={url => {
                if (url.startsWith('action://toggle-content')) {
                  setShowMore(prev => !prev);
                  return;
                }
                props.setShown(false);
                setTimeout(() => {
                  if (url.startsWith('id://')) {
                    const id = url.replace('id://', '').replace('/', '');

                    props.handleProfileClick?.(parseInt(id));
                  } else if (props.openLinks) {
                    // Handle normal URL clicks
                    props.openLinks(url);
                  }
                }, 100);
              }}
              handleIframeClick={iframeString => {
                props.handleImageClick?.({ iframe: iframeString });
              }}
              isMetaData={item.metaDataJson?.length! > 0}
            />
            {item.linkPreviewHtml && (
              <HtmlRender
                html={item.linkPreviewHtml}
                openLinks={url => props.openLinks?.(url)}
              />
            )}
            {item.embeddedIframeHtml && (
              <HtmlRender
                html={item.embeddedIframeHtml}
                iFrameList={item.iFrameList}
                handleIframeClick={iframeString => {
                  props.handleImageClick?.({ iframe: iframeString });
                }}
              />
            )}

            <View style={styles.directionRowAndSpace}>
              <Tap
                onPress={() => {
                  props.handleReplyClick?.(item);
                }}
                style={styles.replyTap}
              >
                <CustomText
                  variant={TextVariants.labelMedium}
                  color={theme.colors.primary}
                  style={{ fontWeight: theme.fonts.labelLarge.fontWeight }}
                >
                  {t('Reply')}
                </CustomText>
              </Tap>

              {item.isOwner && (
                <View style={styles.editDeleteContainer}>
                  <Tap
                    onPress={() => {
                      if (!props.loading) {
                        props.onLongPress?.('edit');
                      }
                    }}
                  >
                    <View style={styles.directionRow}>
                      <CustomImage
                        source={Images.edit}
                        type={ImageType.svg}
                        color={theme.colors.primary}
                        style={styles.editDeleteIcon}
                      />
                      <CustomText
                        variant={TextVariants.labelMedium}
                        color={theme.colors.outline}
                        style={{
                          fontWeight: theme.fonts.labelLarge.fontWeight,
                        }}
                      >
                        {t('Edit')}
                      </CustomText>
                    </View>
                  </Tap>

                  <Tap
                    onPress={() => {
                      if (!props.loading) {
                        props.onLongPress?.('delete');
                      }
                    }}
                  >
                    <View style={styles.directionRow}>
                      <CustomImage
                        source={Images.delete}
                        type={ImageType.svg}
                        color={theme.colors.error}
                        style={styles.editDeleteIcon}
                      />
                      <CustomText
                        variant={TextVariants.labelMedium}
                        color={theme.colors.outline}
                        style={{
                          fontWeight: theme.fonts.labelLarge.fontWeight,
                        }}
                      >
                        {t('Delete')}
                      </CustomText>
                    </View>
                  </Tap>
                </View>
              )}
            </View>

            {item.postImageLocation &&
              item.postImageLocation?.length > 0 &&
              renderCarouselItem(item.postImageLocation)}

            {item.allCommentsReplies && item.allCommentsReplies.length > 0 && (
              <View style={styles.replyLay}>
                {showAllReplies
                  ? loading
                    ? [...Array(3).keys()].map((_, index) => (
                        <Skeleton>
                          <View style={styles.skeletonReplyMain}>
                            <View style={styles.skeletonReplyProfile} />
                            <View style={styles.skeletonReplyName} />
                          </View>
                        </Skeleton>
                      ))
                    : item.allCommentsReplies?.map((replyItem, index) => (
                        <CommentItem
                          key={`reply ${replyItem.postDetailID}`}
                          item={replyItem}
                          type={CommentType.ncomment}
                          navigation={props.navigation}
                          likeClick={() => {
                            updateReply({
                              commentItem: replyItem,
                              like: true,
                              callApi: true,
                            });
                          }}
                          likeListClick={props.likeListClick}
                          handleImageClick={props.handleImageClick}
                          handleReplyClick={() => {
                            props.handleReplyClick?.({
                              ...replyItem,
                              postDetailID: item.postDetailID,
                              primaryFeedId: item.primaryFeedId,
                            });
                          }}
                          openLinks={props.openLinks}
                          handleProfileClick={props.handleProfileClick}
                          onLongPress={from => {
                            props.onLongPressReply?.(replyItem, from);
                          }}
                          loading={props.replyLoading}
                          setShown={props.setShown}
                        />
                      ))
                  : item.allCommentsReplies?.at(0) && (
                      <CommentItem
                        key={`reply first ${
                          item.allCommentsReplies?.at(0)!.postDetailID
                        }`}
                        item={item.allCommentsReplies?.at(0)!}
                        type={CommentType.ncomment}
                        navigation={props.navigation}
                        likeClick={() => {
                          updateReply({
                            commentItem: item.allCommentsReplies?.at(0)!,
                            like: true,
                            callApi: true,
                          });
                        }}
                        likeListClick={props.likeListClick}
                        handleImageClick={props.handleImageClick}
                        handleReplyClick={() => {
                          props.handleReplyClick?.({
                            ...item.allCommentsReplies?.at(0)!,
                            postDetailID: item.postDetailID,
                            primaryFeedId: item.primaryFeedId,
                          });
                        }}
                        openLinks={props.openLinks}
                        handleProfileClick={props.handleProfileClick}
                        onLongPress={from => {
                          props.onLongPressReply?.(
                            item.allCommentsReplies?.at(0)!,
                            from,
                          );
                        }}
                        loading={props.replyLoading}
                        setShown={props.setShown}
                      />
                    )}
                {!!item.commentCount && item.commentCount > 1 && (
                  <Tap onPress={handleViewReplies} style={styles.viewReplies}>
                    <View style={styles.viewRepliesLay}>
                      <CustomText variant={TextVariants.labelLarge}>
                        {showAllReplies
                          ? hasMoreData
                            ? t('ViewAllReplies')
                            : t('ViewLess')
                          : t('ViewAllReplies')}
                      </CustomText>
                      {apiLoading && <ActivityIndicator size={15} />}
                    </View>
                  </Tap>
                )}
              </View>
            )}
          </View>
        </View>
      </Tap>
      {props.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
      flexDirection: 'row',
      gap: 10,
      marginHorizontal: 10,
      marginTop: 20,
    },
    content: {
      flex: 1,
    },
    noPadding: { padding: 0 },
    userNameLay: { flexDirection: 'row', gap: 5, alignContent: 'center' },
    userName: {
      flex: 1,
    },
    commentLikeIcon: {
      height: 20,
      width: 20,
    },
    imgLay: {
      justifyContent: 'center',
    },
    imgContainer: {
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      width: 200,
      height: 200,
      padding: 10,
    },
    img: {
      height: 180,
      width: 180,
      borderRadius: theme.roundness,
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.gradientColorLevel2,
    },
    commentProfilePic: {
      height: 35,
      width: 35,
      borderRadius: theme.roundness,
      //  borderRadius: 35
    },
    nCommentProfilePic: {
      height: 25,
      width: 25,
      borderRadius: theme.roundness,
      //borderRadius: 25
    },
    replyLikeIcon: {
      height: 15,
      width: 15,
    },
    skeletonReplyMain: {
      width: '100%',
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
      paddingHorizontal: 20,
    },
    skeletonReplyProfile: {
      height: 20,
      width: 20,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    skeletonReplyName: {
      width: '70%',
      height: 20,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    likeCount: { paddingHorizontal: 5 },
    desc: {
      // marginLeft: 5
    },
    replyLay: {
      borderLeftWidth: 0.5,
      borderColor: theme.colors.border,
      marginTop: 10,
    },
    viewReplies: { paddingLeft: 30 },
    profilePic: {
      alignSelf: 'flex-start',
    },
    replyTap: {
      alignSelf: 'flex-start',
    },
    directionRowAndSpace: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 30,
      marginRight: 10,
    },
    directionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    editDeleteContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editDeleteIcon: {
      marginTop: 1,
      height: 10,
      width: 10,
    },
    viewRepliesLay: {
      flexDirection: 'row',
      gap: 5,
    },
  });

export default memo(CommentItem);
