import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  FlashList,
  FlashListRef,
  ListRenderItem,
  ViewToken,
} from '@shopify/flash-list';
import React, { forwardRef } from 'react';
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
  renderItem: ListRenderItem<T>;
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
  getItemType?:
    | ((item: T, index: number, extraData?: any) => string | number | undefined)
    | undefined;
  onViewableItemsChanged?:
    | ((info: {
        viewableItems: ViewToken<T>[];
        changed: ViewToken<T>[];
      }) => void)
    | null
    | undefined;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
};

function CustomFlatList<T>(props: Props<T>, ref: React.Ref<FlashListRef<any>>) {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  /** Added by @Tarun 24-03-2025 -> flash list for showing list (FYN-5971) */
  return (
    <FlashList
      ref={ref}
      scrollEnabled={props.scrollEnabled}
      data={props.data}
      extraData={[theme.dark, props.extraData]}
      horizontal={props.horizontal}
      maintainVisibleContentPosition={{
        //autoscrollToBottomThreshold: 0.2,
        startRenderingFromBottom: props.inverted,
      }}
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
      overrideProps={{
        ...props.overrideProps,
        contentContainerStyle: props.contentContainerStyle,
      }}
      onViewableItemsChanged={props.onViewableItemsChanged}
      onEndReached={props.onEndReached}
      onEndReachedThreshold={props.onEndReachedThreshold}
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
  props: Props<T> & { ref?: React.Ref<FlashListRef<T>> },
) => React.ReactElement;
