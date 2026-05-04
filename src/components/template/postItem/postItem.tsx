import {
  CustomAvatar,
  CustomImage,
  CustomText,
  HtmlRender,
  Shadow,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import {
  CustomActionSheetPoup,
  CustomCarousel,
  FeatureButton,
} from '@/components/molecules';
import PdfPreview from '@/components/molecules/pdfPreview/pdfPreview';
import { GetAllCommentsModel, GetFeedPostModel } from '@/services/models';
import {
  CommunityModel,
  postDocumentsForFeed,
} from '@/services/models/communityModel/communityModel';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  DownloadDocumentFile,
  OpenDocumentFile,
  ShareDocumentFile,
} from '@/utils/fileDownloadUtils';
import { useAppNavigation } from '@/utils/navigationUtils';
import {
  getFileExtension,
  handleDocumentItemClick,
  handleShare,
  isEmpty,
  showSnackbar,
  useCustomInAppBrowser,
} from '@/utils/utils';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { showImagePopup } from '../imagePopup/imagePopup';

export enum PostType {
  feed = 'feed',
  community = 'community',
}

type Props = {
  item: GetFeedPostModel | CommunityModel;
  type: PostType;
  onClick?: () => void;
  openLinks?: (url: string) => void;
  likeClick?: () => void;
  likeListClick?: () => void;
  commentLikeClick?: () => void;
  commentClick?: () => void;
  optionsClick?: () => void;
  handleCommentOption?: (comment?: GetAllCommentsModel) => void;
  shortContent?: boolean;
  loading?: boolean;
  showMoreClick?: () => void;
};

function PostItem({ item, ...props }: Props) {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  const [SelectedFeaturedItem, setSelectedFeaturedItem] =
    useState<postDocumentsForFeed>();
  const [isDownloading, setIsDownloading] = useState(false); // show report popup
  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser
  const [showActionPopup, setShowActionPopup] = useState(false); // show report popup
  const [showMoreComment, setShowMoreComment] = useState(false);

  const handleProfileClick = (item: GetFeedPostModel | CommunityModel) => {
    navigation.navigate('MemberProfile', {
      userId: item?.userID,
    });
  };
  // top of PostItem
  const [docList, setDocList] = useState<postDocumentsForFeed[]>(
    item.postDocumentsForFeed ?? [],
  );

  useEffect(() => {
    // keep in sync if parent refetches/updates the post
    setDocList(item.postDocumentsForFeed ?? []);
  }, [item.postDocumentsForFeed]);
  // small helpers

  const setDocProgress = (documentId?: string, progress?: number | string) => {
    if (!documentId) return;
    setDocList(prev =>
      prev.map(doc =>
        doc.documentId === documentId
          ? {
              ...doc,
              progress: progress === undefined ? undefined : String(progress),
            }
          : doc,
      ),
    );
  };

  const handleImageClick = (index: number) => {
    const imageList = item.postImageLocation
      ?.filter(item => !item.toLowerCase().endsWith('.pdf'))
      .map(item => item);
    showImagePopup({
      imageList: imageList,
      defaultIndex: index,
    });
  };

  const handleSelectedActionItem = (
    ActionParam: string,
    itemData?: postDocumentsForFeed,
  ) => {
    const doc = itemData ? itemData : SelectedFeaturedItem;
    if (!doc) return;

    const ext = getFileExtension(doc.location!);

    const finish = (fileUri?: string) => {
      setIsDownloading(false);
      setDocList(prev =>
        prev?.map(item => {
          if (doc && item.contentDataId == doc?.contentDataId) {
            return { ...item, progress: undefined };
          } else {
            return item;
          }
        }),
      );
      if (!fileUri) {
        showSnackbar(t('SomeErrorOccured'), 'danger');
      }
    };

    const setDocumentLoading = () => {
      setIsDownloading(true);
      setDocList(prev =>
        prev?.map(item => {
          if (doc && item.contentDataId == doc?.contentDataId) {
            return { ...item, progress: '1' };
          } else {
            return item;
          }
        }),
      );
    };

    if (ActionParam === 'Download') {
      setShowActionPopup(false);
      setDocumentLoading();
      DownloadDocumentFile({
        fileUrl: doc.contentURL!,
        fileExtension: ext,
        fileName: doc.documentName!,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });
    } else if (ActionParam === 'Open') {
      setShowActionPopup(false);
      if (
        doc.contentType == 'H' ||
        doc.contentType == 'E' ||
        doc.contentType == 'L'
      ) {
        handleDocumentItemClick(doc, navigation, openInAppBrowser, theme);
        return;
      }

      setDocumentLoading();
      OpenDocumentFile({
        fileUrl: doc.contentURL!,
        fileExtension: ext,
        fileName: doc.documentName!,
        onDownloadComplete(fileUri) {
          finish(fileUri);
        },
      });
    } else if (ActionParam === 'Share') {
      setShowActionPopup(false);
      setDocumentLoading();
      if (doc.contentType !== 'L') {
        ShareDocumentFile({
          fileUrl: doc.contentURL!,
          fileExtension: ext,
          fileName: doc.documentName!,

          onDownloadComplete(fileUri, mime) {
            finish(fileUri);
          },
        });
      } else {
        handleShare({ message: doc.contentURL });
        setIsDownloading(false);
        setShowActionPopup(false);
      }
    } else if (ActionParam === 'Cancel') {
      setShowActionPopup(false);
      setSelectedFeaturedItem(undefined);
    }
  };

  /**
   * Added by @Shivang 13-03-2025 -> Handle Long Press Action (FYN-5333)
   * This function is triggered when the user long-presses on a list item.
   * If the item is a PDF file, it sets the selected item and opens the action popup.
   */
  const handleLongPress = (itemData: postDocumentsForFeed) => {
    setSelectedFeaturedItem(itemData); // ✅ Store the selected item
    if (itemData.contentType != 'H') {
      if (itemData.contentType != 'E') {
        setShowActionPopup(true); // ✅ Show action sheet with available options
      }
    }
  };

  const renderSubCategoryItem = (item: postDocumentsForFeed) => {
    const {
      documentName,
      displayName,
      description,
      documentTypeName,
      contentURL,
      coverImageURL,
    } = item;

    const label = documentTypeName ? documentTypeName : t('Attachment');

    return (
      <Shadow
        style={styles.newsCard}
        onPress={() => {
          if (!isDownloading) {
            handleSelectedActionItem('Open', item);
          }
        }}
        onLongPress={() => !isDownloading && handleLongPress(item)}
      >
        <View style={styles.newsContent}>
          <CustomText
            variant={TextVariants.bodyLarge}
            maxLines={1}
            ellipsis={TextEllipsis.tail}
          >
            {displayName ?? documentName}
          </CustomText>

          {description && (
            <CustomText maxLines={3} variant={TextVariants.labelMedium}>
              {description}
            </CustomText>
          )}

          <View style={styles.rowBetween}>
            <View style={styles.tagAndLoader}>
              <View style={styles.newsTag}>
                <CustomText variant={TextVariants.labelSmall}>
                  {label}
                </CustomText>
              </View>

              {item.progress && (
                <ActivityIndicator size={16} style={styles.loaderAfterTag} />
              )}
            </View>

            {item.contentType != 'H' && item.contentType != 'E' && (
              <Tap
                style={styles.iconBgMore}
                onPress={() => {
                  !isDownloading && handleLongPress(item);
                }}
              >
                <CustomImage
                  source={Images.more}
                  type={ImageType.svg}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.moreIcon}
                />
              </Tap>
            )}
          </View>
        </View>

        {coverImageURL && (
          <CustomImage
            source={{ uri: coverImageURL }}
            style={styles.thumbnailImg}
          />
        )}
      </Shadow>
    );
  };
  // Usage in your parent component
  const renderCarouselItem = (item: GetFeedPostModel | CommunityModel) => {
    if (!item.postImageLocation && !item.postDocumentsForFeed) {
      // Handle the case when there's no postImageLocation. For example:
      return null; // or render a fallback UI
    }

    if (docList && docList.length > 0) {
      return (
        <CustomCarousel
          style={{ right: 0 }}
          data={docList} // ⬅️ use local list
          aspectRatio={0.4}
          children={(doc, index) => (
            <View style={styles.cardWrapper}>{renderSubCategoryItem(doc)}</View>
          )}
        />
      );
    } else if (item.postImageLocation && item.postImageLocation?.length > 0) {
      const isSinglePdf =
        item.postImageLocation &&
        item.postImageLocation.length === 1 &&
        item.postImageLocation[0].toLowerCase().endsWith('.pdf');

      if (isSinglePdf) {
        // Render PDF viewer outside the carousel
        return (
          <PdfPreview
            pdfUrl={item.postImageLocation[0]}
            openLinks={props.openLinks}
          />
        );
      } else {
        // Otherwise, render the normal carousel for images (and PDFs as items)
        return (
          <CustomCarousel
            data={item.postImageLocation!}
            aspectRatio={1}
            height={300}
            children={(mediaItem: string, index: number) => {
              return (
                <View style={styles.imgLay}>
                  {mediaItem.toLowerCase().endsWith('.pdf') ? (
                    <Tap
                      onPress={() => {
                        showImagePopup({
                          pdfUrl: mediaItem,
                        });
                      }}
                    >
                      <PdfPreview
                        pdfUrl={mediaItem}
                        openLinks={props.openLinks}
                        style={styles.img}
                      />
                    </Tap>
                  ) : (
                    <Tap
                      onPress={() => {
                        handleImageClick(index);
                      }}
                    >
                      <CustomImage
                        source={{ uri: mediaItem }}
                        resizeMode={ResizeModeType.contain}
                        style={styles.img}
                      />
                    </Tap>
                  )}
                </View>
              );
            }}
          />
        );
      }
    }
  };

  return (
    <View>
      <Tap disableRipple onPress={props.onClick}>
        <View style={styles.container}>
          <View style={styles.heading}>
            <Tap
              style={styles.profilePic}
              onPress={() => handleProfileClick(item)}
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
              />
            </Tap>

            <View style={styles.titleLayout}>
              <View style={styles.title}>
                <CustomText variant={TextVariants.titleMedium} maxLines={1}>
                  {item.userName}
                </CustomText>
              </View>
              <CustomText variant={TextVariants.labelSmall} style={styles.time}>
                {item.displayAgo}
              </CustomText>
            </View>
            <Tap
              disableRipple
              onPress={props.optionsClick}
              style={styles.moreLay}
            >
              <CustomImage
                source={Images.more}
                type={ImageType.svg}
                color={theme.colors.onSurfaceVariant}
                style={styles.more}
              />
            </Tap>
          </View>

          <HtmlRender
            compact
            style={styles.description}
            html={item.showMore ? item.detailHTML : item.shortContent}
            iFrameList={item.iFrameList}
            openLinks={url => {
              if (url.startsWith('action://toggle-content')) {
                props.showMoreClick?.();
                return;
              }

              if (url.startsWith('id://')) {
                const id = url.replace('id://', '').replace('/', '');

                navigation.navigate('MemberProfile', {
                  userId: id,
                });
              } else if (props.openLinks) {
                // Handle normal URL clicks
                props.openLinks(url);
              }
            }}
            handleIframeClick={iframeString => {
              showImagePopup({ iframe: iframeString });
            }}
            allowCopy
          />
          {item.linkPreviewHtml && (
            <HtmlRender
              compact
              html={item.linkPreviewHtml}
              openLinks={url => props.openLinks?.(url)}
            />
          )}
          {item.embeddedIframeHtml && (
            <HtmlRender
              html={item.embeddedIframeHtml}
              iFrameList={item.iFrameList}
              handleIframeClick={iframe => {
                showImagePopup({ iframe });
              }}
            />
          )}

          {((item.postDocumentsForFeed &&
            item.postDocumentsForFeed?.length > 0) ||
            (item.postImageLocation && item.postImageLocation?.length > 0)) &&
            renderCarouselItem(item)}

          <View style={styles.likeLayout}>
            <FeatureButton
              source={item.likedByUser ? Images.likeFilled : Images.like}
              label={`${item?.likeCount?.toString()} ${
                item.likeCount && item.likeCount > 1 ? t('Likes') : t('Like')
              }`}
              color={item.likedByUser ? theme.colors.error : undefined}
              fillColor={item.likedByUser ? theme.colors.error : undefined}
              imageStyle={styles.likeIcon}
              onPress={props.likeListClick}
              onIconPress={props.likeClick}
            />
            <FeatureButton
              source={Images.comment}
              label={`${item?.commentCount?.toString()} ${
                item?.commentCount && item?.commentCount > 1
                  ? t('Comments')
                  : t('Comment')
              }`}
              imageStyle={styles.likeIcon}
              onPress={props.commentClick}
            />
          </View>
          {item.commentsReplies && item.commentsReplies.length > 0 && (
            <Tap
              onLongPress={() => {
                props.handleCommentOption?.();
              }}
              style={styles.noPadding}
            >
              <View style={styles.topCommentContainer}>
                <Tap
                  style={styles.profilePic}
                  onPress={() => handleProfileClick(item)}
                >
                  <CustomAvatar
                    source={
                      !isEmpty(
                        item.commentsReplies.at(0)?.userProfileLocation,
                      ) && {
                        uri: item.commentsReplies.at(0)?.userProfileLocation,
                      }
                    }
                    text={
                      isEmpty(item.commentsReplies.at(0)?.userProfileLocation)
                        ? item.commentsReplies.at(0)?.userName
                        : undefined
                    }
                    initialVariant={TextVariants.labelSmall}
                  />
                </Tap>
                <View style={styles.topCommentHeader}>
                  <View style={styles.nameLay}>
                    <CustomText variant={TextVariants.labelMedium}>
                      {item.commentsReplies.at(0)?.userName}
                    </CustomText>
                    <Tap
                      onPress={() => {
                        props.commentLikeClick?.();
                      }}
                    >
                      <CustomImage
                        source={
                          item.commentsReplies.at(0)?.likedByUser
                            ? Images.likeFilled
                            : Images.like
                        }
                        style={styles.commentLikeIcon}
                        type={ImageType.svg}
                        color={
                          item.commentsReplies.at(0)?.likedByUser
                            ? theme.colors.error
                            : theme.colors.onSurfaceVariant
                        }
                        fillColor={
                          item.commentsReplies.at(0)?.likedByUser
                            ? theme.colors.error
                            : undefined
                        }
                      />
                    </Tap>
                  </View>
                  <HtmlRender
                    compact
                    html={
                      showMoreComment
                        ? item.commentsReplies.at(0)?.commentDetailHTML
                        : item.commentsReplies.at(0)?.shortContent ??
                          item.commentsReplies.at(0)?.commentDetailHTML
                    }
                    fontSize={theme.fonts.labelMedium.fontSize}
                    iFrameList={item.commentsReplies.at(0)?.iFrameList}
                    handleIframeClick={iframe => {
                      showImagePopup({ iframe });
                    }}
                    openLinks={url => {
                      if (url.startsWith('action://toggle-content')) {
                        setShowMoreComment(prev => !prev);
                        return;
                      }
                      props.openLinks?.(url);
                    }}
                    isMetaData={
                      item.commentsReplies.at(0)?.commentMetaDataJson?.length! >
                      0
                    }
                  />
                  {item.commentsReplies.at(0)?.linkPreviewHtml && (
                    <HtmlRender
                      compact
                      html={item.commentsReplies.at(0)?.linkPreviewHtml}
                      openLinks={props.openLinks}
                    />
                  )}
                  {item.commentsReplies.at(0)?.embeddedIframeHtml && (
                    <HtmlRender
                      html={item.commentsReplies.at(0)?.embeddedIframeHtml}
                      iFrameList={item.commentsReplies.at(0)?.iFrameList}
                      handleIframeClick={iframe => {
                        showImagePopup({ iframe });
                      }}
                    />
                  )}
                  <Tap
                    style={{ paddingVertical: 10 }}
                    onPress={() => {
                      props.commentClick?.();
                    }}
                  >
                    <CustomText variant={TextVariants.labelLarge}>
                      {t('ViewAllComments')}
                    </CustomText>
                  </Tap>
                </View>
              </View>
            </Tap>
          )}
        </View>
      </Tap>
      {props.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}

      <CustomActionSheetPoup
        shown={showActionPopup}
        setShown={setShowActionPopup}
        hideIcons={false}
        centered={false}
        onCancelClick={() => handleSelectedActionItem('Cancel')}
        children={[
          {
            title: 'Open',
            image: Images.link, // Replace with your icon
            imageType: ImageType.svg,
            onPress: () => {
              // SelectedFeaturedItem?.documentTypeName?.includes('Excel')
              //   ? handleSelectedActionItem('Download')
              //   :
              handleSelectedActionItem('Open');
            },
          },
          ...(SelectedFeaturedItem?.contentType != 'L'
            ? [
                {
                  title: 'Download',
                  image: Images.download, // Replace with your icon
                  imageType: ImageType.svg,
                  onPress: () => handleSelectedActionItem('Download'),
                },
              ]
            : []),
          {
            title: 'Share',
            image: Images.share, // Replace with your icon
            imageType: ImageType.svg,
            onPress: () => handleSelectedActionItem('Share'),
          },
        ]}
      />
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      paddingTop: 20,
      paddingHorizontal: 10,
    },
    content: {
      alignItems: 'center',
    },
    heading: {
      flexDirection: 'row',
    },
    profilePic: { padding: 0 },
    titleLayout: {
      flex: 1,
      marginLeft: 10,
      flexDirection: 'column',
    },
    title: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    time: {
      marginTop: 0,
    },
    moreLay: {
      paddingHorizontal: 10,
    },
    more: {
      height: 20,
      width: 20,
    },
    showMoreButton: {
      alignSelf: 'flex-end',
      padding: 0,
      marginRight: 5,
    },
    description: {
      flex: 1,
      marginTop: 20,
    },
    banner: {
      flex: 1,
      height: 250,
      marginTop: 20,
      borderRadius: theme.roundness,
    },
    imgLay: {
      marginRight: 20,
      marginVertical: 20,
      justifyContent: 'center',
    },
    pdfLay: {
      marginRight: 20,
      marginVertical: 20,
      justifyContent: 'center',
    },
    img: {
      height: '100%',
      width: '100%',
      borderRadius: theme.roundness,
    },
    video: { flex: 1 },
    likeLayout: {
      flexDirection: 'row',
      marginTop: 5,
    },
    likeIcon: {
      height: 20,
      width: 20,
    },
    comment: {
      paddingLeft: 0,
    },
    loadingContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.gradientColorLevel2,
    },
    rightIcon: { height: 15, width: 15 },
    topCommentContainer: {
      flexDirection: 'row',
      alignContent: 'flex-start',
      marginTop: 15,
      marginLeft: 30,
      paddingTop: 10,
      gap: 10,
      borderTopWidth: 0.5,
      borderColor: theme.colors.border,
    },
    topCommentHeader: {
      flex: 1,
    },
    commentProfilePic: {
      height: 20,
      width: 20,
      //  borderRadius: theme.extraRoundness
    },
    commentLikeIcon: {
      height: 12,
      width: 12,
    },
    nameLay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    noPadding: {
      padding: 0,
    },

    newsCard: {
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      width: '100%', // fill whatever parent width you give it
      flexDirection: 'row',
      marginVertical: 2,
      padding: 12,
    },
    cardWrapper: {
      width: '90%', // match your itemSize
      alignContent: 'center',
      alignItems: 'center',
    },
    thumbnailImg: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    TapViewContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    newsContent: {
      flex: 1,
      paddingHorizontal: 3,
      justifyContent: 'space-between',
      gap: 5,
    },
    newsTag: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      alignSelf: 'flex-start',
    },
    flatListContainerStyleHorizontal: {
      paddingHorizontal: 16, // optional side‐padding
      alignItems: 'center', // center cards vertically
    },
    filterContainer: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      borderColor: theme.colors.primary,
      padding: 5,
      margin: 5,
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
    moreIcon: {
      height: 17,
      width: 17,
    },

    iconBgMore: {
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 7,
      paddingHorizontal: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.elevation.level3,
      paddingVertical: 2,
      width: 25,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    tagAndLoader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    loaderAfterTag: {
      marginLeft: 8, // puts loader right after the tag
    },
  });

export default memo(PostItem);
