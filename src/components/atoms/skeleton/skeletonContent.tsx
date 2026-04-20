import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Skeleton from './skeleton';

type Props = {
  short?: boolean;
  shortChildCount?: number;
  style?: StyleProp<ViewStyle>;
};

function SkeletonContent({shortChildCount = 4, ...props}: Props) {
  const theme = useTheme(); //theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  return props.short ? (
    <Skeleton>
      <View style={styles.skeletonLay}>
        <View style={styles.skeletonHeading} />

        {[...Array(shortChildCount).keys()].map((_, index) => (
          <View key={index} style={styles.skeletonDesc} />
        ))}
      </View>
    </Skeleton>
  ) : (
    <View style={[styles.skeletonBg, props.style]}>
      <Skeleton>
        <View style={styles.skeletonLay}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonProfilePic} />
            <View style={styles.skeletonTitleLay}>
              <View style={styles.skeletonHeading} />
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
            </View>
            <View style={styles.skeletonOptionsItem4} />
          </View>
          {[...Array(4).keys()].map((_, index) => (
            <View key={index} style={styles.skeletonDescLay}>
              <View style={styles.skeletonDescItem1} />
              <View style={styles.skeletonDescItem2} />
              <View style={styles.skeletonDescItem3} />
              <View style={styles.skeletonDescItem4} />
            </View>
          ))}
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonOptionsLay}>
            <View style={styles.skeletonOptionsItem1} />
            <View style={styles.skeletonOptionsItem1} />
            <View style={styles.skeletonOptionsItem2} />
            <View style={styles.skeletonOptionsRightLay}>
              <View style={styles.skeletonOptionsItem3} />
            </View>
          </View>
        </View>
      </Skeleton>
    </View>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    skeletonBg: {
      backgroundColor: theme.colors.surface,
    },
    skeletonDivider: {
      backgroundColor: theme.colors.skeletonHighlight,
      height: 12,
      marginVertical: 10,
    },
    skeletonLay: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginTop: 10,
    },
    skeletonHeader: {flexDirection: 'row'},
    skeletonProfilePic: {
      borderRadius: 50,
      height: 50,
      width: 50,
      backgroundColor: theme.colors.surface,
    },
    skeletonTitleLay: {flex: 1, marginLeft: 10},
    skeletonHeading: {
      backgroundColor: theme.colors.surface,
      width: '60%',
      height: 15,
      borderRadius: 5,
      marginTop: 5,
    },
    skeletonTitle: {
      backgroundColor: theme.colors.surface,
      width: '40%',
      height: 10,
      borderRadius: 5,
      marginTop: 5,
    },
    skeletonSubtitle: {
      backgroundColor: theme.colors.surface,
      width: '25%',
      height: 10,
      borderRadius: 5,
      marginTop: 5,
    },
    skeletonDescLay: {
      marginTop: 15,
      width: '100%',
    },
    skeletonDescItem1: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '99%',
      height: 12,
      marginTop: 5,
    },
    skeletonDescItem2: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '83%',
      height: 12,
      marginTop: 5,
    },
    skeletonDescItem3: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '93%',
      height: 12,
      marginTop: 5,
    },
    skeletonDescItem4: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '73%',
      height: 12,
      marginTop: 5,
    },
    skeletonOptionsLay: {
      marginTop: 15,
      width: '100%',
      flexDirection: 'row',
    },
    skeletonOptionsRightLay: {
      flex: 1,
      alignItems: 'flex-end',
    },
    skeletonOptionsItem1: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '3%',
      height: 12,
      marginTop: 5,
      marginRight: 10,
    },
    skeletonOptionsItem2: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '10%',
      height: 12,
      marginTop: 5,
      marginRight: 10,
    },
    skeletonOptionsItem3: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '20%',
      height: 12,
      marginTop: 5,
      marginRight: 10,
    },
    skeletonOptionsItem4: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '5%',
      height: 12,
      marginTop: 5,
      marginRight: 10,
    },
    skeletonImage: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 200,
      borderRadius: 5,
      marginTop: 20,
    },
    skeletonDesc: {
      backgroundColor: theme.colors.surface,
      width: '90%',
      height: 15,
      borderRadius: 3,
      marginTop: 15,
    },
  });

export default SkeletonContent;
