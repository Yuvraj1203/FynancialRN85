import { InfiniteDotIndicator } from '@/components/atoms';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { forwardRef, ReactElement, useState } from 'react';
import {
  Dimensions,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
} from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

export enum CarouselMode {
  parallax = 'parallax',
  horizontal = 'horizontal',
}

// options for component
type Props<T> = {
  children: (item: T, index: number) => ReactElement;
  mode?: CarouselMode;
  data: T[];
  height?: number;
  width?: number;
  aspectRatio?: number;
  autoplay?: boolean;
  showDotIndicator?: boolean;
  defaultIndex?: number;
  scrollAnimationDuration?: number;
  loop?: boolean;
  style?: StyleProp<TextStyle>;
  onProgress?: (index: number) => void;
};

function CustomCarousel<T>(
  {
    mode = CarouselMode.horizontal,
    scrollAnimationDuration = 1000,
    loop = false,
    autoplay = false,
    showDotIndicator = true,
    aspectRatio = 0.6,
    ...props
  }: Props<T>,
  ref: React.Ref<ICarouselInstance>,
) {
  const theme = useTheme(); //theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const width = Dimensions.get('window').width;

  const height = width * aspectRatio; // Calculate height based on aspect ratio

  const [activeIndex, setActiveIndex] = useState(props.defaultIndex ?? 0); // Track active slide index

  const handleIndexChange = (index: number) => {
    setActiveIndex(index); // Update active index when slide changes
    if (props.onProgress) {
      props.onProgress(index);
    }
  };

  return (
    <View style={[styles.main, props.style]}>
      {mode === CarouselMode.horizontal ? (
        <Carousel
          ref={ref}
          loop={loop}
          width={props.width ? props.width : width}
          height={props.height ? props.height : height}
          autoFillData={loop}
          autoPlay={autoplay}
          data={props.data}
          defaultIndex={props.defaultIndex}
          scrollAnimationDuration={scrollAnimationDuration}
          onProgressChange={(_, absoluteProgress) => {
            handleIndexChange(Math.round(absoluteProgress));
          }}
          onConfigurePanGesture={gestureChain => {
            gestureChain.activeOffsetX([-10, 10]);
          }}
          renderItem={({ item, index }) => props.children(item, index)}
        />
      ) : (
        <Carousel
          mode="parallax"
          ref={ref}
          loop={loop}
          width={props.width ? props.width : width}
          height={props.height ? props.height : height}
          autoFillData={loop}
          autoPlay={autoplay}
          data={props.data}
          defaultIndex={props.defaultIndex}
          scrollAnimationDuration={scrollAnimationDuration}
          onProgressChange={(_, absoluteProgress) => {
            handleIndexChange(Math.round(absoluteProgress));
          }}
          modeConfig={{
            parallaxScrollingScale: 0.89,
            parallaxScrollingOffset: 90,
          }}
          onConfigurePanGesture={gestureChain => {
            gestureChain.activeOffsetX([-10, 10]);
          }}
          renderItem={({ item, index }) => props.children(item, index)}
        />
      )}
      {showDotIndicator && props.data.length > 1 ? (
        <View style={styles.dotLay}>
          <InfiniteDotIndicator
            length={props.data.length}
            currentIndex={activeIndex}
            maxIndicators={2}
            interpolateOpacityAndColor={true}
            activeIndicatorConfig={{
              color: theme.colors.outline,
              margin: 3,
              opacity: 1,
              size: 8,
            }}
            inactiveIndicatorConfig={{
              color: theme.colors.outlineVariant,
              margin: 3,
              opacity: 0.5,
              size: 8,
            }}
            decreasingDots={[
              {
                config: {
                  color: theme.colors.outlineVariant,
                  margin: 3,
                  opacity: 0.5,
                  size: 6,
                },
                quantity: 1,
              },
              {
                config: {
                  color: theme.colors.outlineVariant,
                  margin: 3,
                  opacity: 0.5,
                  size: 4,
                },
                quantity: 1,
              },
            ]}
          />
        </View>
      ) : (
        <></>
      )}
    </View>
  );
}
const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      //flex: 1,
    },
    dotLay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
  });

export default forwardRef(CustomCarousel) as <T>(
  props: Props<T> & { ref?: React.Ref<ICarouselInstance> },
) => React.ReactElement;
