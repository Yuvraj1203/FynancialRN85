import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  LegendList,
  LegendListRef,
  ViewabilityConfigCallbackPairs,
} from '@legendapp/list';
import React, { forwardRef, ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

export enum keyboardShouldPersistTapsType {
  always = 'always',
  never = 'never',
  handled = 'handled',
}

export enum keyboardDismissModeType {
  none = 'none',
  interactive = 'interactive',
  ondrag = 'on-drag',
}

// options for component
type Props<T> = {
  data: T[];
  ListEmptyComponent?:
    | React.ComponentType<any>
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  onEndReachedThreshold?: number;
  onEndReached?: () => void;
  onRefresh?: () => void;
  ItemSeparatorComponent?: React.ComponentType<any>;
  refreshing?: boolean;
  keyExtractor?: (item: T, index: number) => string;
  renderItem: (props: {
    item: T;
    index: number;
    extraData: any;
    itemType?: string;
  }) => ReactNode;
  keyboardShouldPersistTaps?: keyboardShouldPersistTapsType;
  keyboardDismissMode?: keyboardDismissModeType;
  horizontal?: boolean;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  inverted?: boolean;
  nestedScrollEnabled?: boolean;
  initialScrollIndex?: number;
  onScrollToIndexFailed?: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  updateCellsBatchingPeriod?: number;
  numColumns?: number;
  extraData?: any;
  overrideProps?: object;
  scrollEnabled?: boolean;
  getItemType?: (item: T, index: number) => string;
  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs<T>;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  onStartReachedThreshold?: number;
  onStartReached?: (info: { distanceFromStart: number }) => void;
  stickyIndices?: number[];
  estimatedItemSize?: number;
};

function CustomFlatList<T>(props: Props<T>, ref: React.Ref<LegendListRef>) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  /** Added by @Tarun 24-03-2025 -> flash list for showing list (FYN-5971) */
  return (
    <LegendList
      ref={ref}
      scrollEnabled={props.scrollEnabled}
      data={props.data}
      extraData={[theme.dark, props.extraData]}
      horizontal={props.horizontal}
      recycleItems={true}
      alignItemsAtEnd={props.inverted ? true : false}
      maintainScrollAtEnd={props.inverted ? true : false}
      maintainVisibleContentPosition={true}
      nestedScrollEnabled={props.nestedScrollEnabled}
      keyExtractor={props.keyExtractor}
      renderItem={props.renderItem}
      numColumns={props.numColumns}
      ItemSeparatorComponent={props.ItemSeparatorComponent}
      refreshing={props.refreshing}
      onRefresh={props.onRefresh}
      ListEmptyComponent={props.ListEmptyComponent ?? undefined}
      ListHeaderComponent={props.ListHeaderComponent ?? undefined}
      ListFooterComponent={props.ListFooterComponent ?? undefined}
      keyboardShouldPersistTaps={props.keyboardShouldPersistTaps}
      keyboardDismissMode={props.keyboardDismissMode}
      initialScrollIndex={props.initialScrollIndex}
      showsVerticalScrollIndicator={props.showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={props.showsHorizontalScrollIndicator}
      getItemType={props.getItemType}
      contentContainerStyle={props.contentContainerStyle}
      viewabilityConfigCallbackPairs={props.viewabilityConfigCallbackPairs}
      onEndReached={props.onEndReached}
      onEndReachedThreshold={props.onEndReachedThreshold}
      onStartReached={props.onStartReached}
      onStartReachedThreshold={props.onStartReachedThreshold}
      estimatedItemSize={props.estimatedItemSize ?? 100}
      stickyIndices={props.stickyIndices}
      waitForInitialLayout={true}
    />
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      padding: 5,
    },
  });

export default forwardRef(CustomFlatList) as <T>(
  props: Props<T> & { ref?: React.Ref<LegendListRef> },
) => React.ReactElement;
