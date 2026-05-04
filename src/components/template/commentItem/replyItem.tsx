import {
  CustomAvatar,
  CustomImage,
  CustomText,
  HtmlRender,
  Tap,
} from '@/components/atoms';
import {
  ImageType,
  ResizeModeType,
} from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomCarousel } from '@/components/molecules';
import { RootStackParamList } from '@/navigators/types';
import { GetAllCommentsModel } from '@/services/models';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useAppNavigation } from '@/utils/navigationUtils';
import { isEmpty } from '@/utils/utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

type Props = {
  item: GetAllCommentsModel;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onLongPress?: () => void;
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
};

function ReplyItem({ item, ...props }: Props) {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

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
            >
              <CustomImage
                source={{ uri: mediaItem }}
                resizeMode={ResizeModeType.contain}
                style={styles.img}
              />
            </Tap>
          </View>
        )}
      />
    </View>
  );

  return (
    <View>
      <Tap
        onLongPress={() => {
          if (!props.loading) {
            props.onLongPress?.();
          }
        }}
        style={styles.noPadding}
      >
        <View style={[styles.main]}>
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
              viewStyle={styles.nCommentProfilePic}
              imageStyle={styles.nCommentProfilePic}
            />
          </Tap>
          <View style={styles.content}>
            <View style={styles.userNameLay}>
              <View style={styles.userName}>
                <Tap
                  style={styles.noPadding}
                  onPress={() => props.handleProfileClick?.(item.userID)}
                >
                  <CustomText variant={TextVariants.labelLarge}>
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
                  style={styles.replyLikeIcon}
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
                  item.likeCount && item.likeCount > 0 ? item.likeCount : ''
                }`}</CustomText>
              </Tap>
            </View>

            <HtmlRender
              html={item.detailHTML}
              iFrameList={item.iFrameList}
              fontSize={theme.fonts.labelMedium.fontSize}
              style={styles.desc}
              openLinks={url => {
                if (url.startsWith('id://')) {
                  const id = url.replace('id://', '').replace('/', '');

                  props.handleProfileClick?.(parseInt(id));
                } else if (props.openLinks) {
                  // Handle normal URL clicks
                  props.openLinks(url);
                }
              }}
              handleIframeClick={iframeString => {
                props.handleImageClick?.({ iframe: iframeString });
              }}
            />
            {/* Link preview always rendered outside the text content */}
            {!!item.linkPreviewHtml && (
              <HtmlRender
                html={item.linkPreviewHtml}
                openLinks={url => props.openLinks?.(url)}
              />
            )}

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

            {item.postImageLocation &&
              item.postImageLocation?.length > 0 &&
              renderCarouselItem(item.postImageLocation)}
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
      marginTop: 20,
      marginLeft: 5,
      marginRight: 10,
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
    img: {
      height: 200,
      width: 200,
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
      borderRadius: theme.extraRoundness,
    },
    nCommentProfilePic: {
      height: 25,
      width: 25,
      borderRadius: theme.roundness,
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
      borderRadius: theme.extraRoundness,
      backgroundColor: theme.colors.surface,
    },
    skeletonReplyName: {
      width: '70%',
      height: 20,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    likeCount: { paddingHorizontal: 5 },
    desc: { marginLeft: 5 },
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
    viewRepliesLay: {
      flexDirection: 'row',
      gap: 5,
    },
  });

export default memo(ReplyItem);
