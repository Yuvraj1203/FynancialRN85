import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  I18nManager,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

export interface DotConfig {
  size: number;
  opacity: number;
  color: string;
  margin: number;
  borderWidth?: number;
  borderColor?: string;
}
export interface DecreasingDot {
  quantity: number;
  config: DotConfig;
}

export interface InfiniteDotState {
  currentIndex: number;
  state: number;
}

export interface InfiniteDotsProps {
  length: number;
  currentIndex: number;
  maxIndicators: number;
  activeIndicatorConfig: DotConfig;
  inactiveIndicatorConfig: DotConfig;
  decreasingDots: DecreasingDot[];
  verticalOrientation?: boolean;
  interpolateOpacityAndColor?: boolean;
}

const calculateDotSize = (dot: DotConfig): number => dot.size + 2 * dot.margin;
const calculateDecreasingDotSize = (dot: DecreasingDot): number => {
  return calculateDotSize(dot.config) * (dot.quantity * 2);
};
const calculateIndicatorDotSize = (
  maxIndicators: number,
  activeIndicatorConfig: DotConfig,
  inactiveIndicatorConfig: DotConfig,
): number => {
  return (
    calculateDotSize(activeIndicatorConfig) +
    calculateDotSize(inactiveIndicatorConfig) * (maxIndicators - 1)
  );
};

const calculateOffsetSize = (
  decreasingDot: DecreasingDot[],
  offset: number,
): number => {
  const minimumSize = calculateDotSize(
    decreasingDot[decreasingDot.length - 1].config,
  );
  const result = decreasingDot.reduce(
    (acc, dot) => {
      if (acc.offset === 0) return acc;
      if (acc.offset - dot.quantity <= 0) {
        return {
          offset: 0,
          totalSize: acc.totalSize + calculateDotSize(dot.config) * acc.offset,
        };
      }
      return {
        offset: acc.offset - dot.quantity,
        totalSize: acc.totalSize + calculateDotSize(dot.config) * dot.quantity,
      };
    },
    { offset, totalSize: 0 },
  );
  return result.totalSize + result.offset * minimumSize;
};

const InfiniteDotIndicator = ({
  length,
  currentIndex,
  maxIndicators,
  activeIndicatorConfig,
  inactiveIndicatorConfig,
  decreasingDots,
  verticalOrientation = false,
  interpolateOpacityAndColor = true,
}: InfiniteDotsProps) => {
  const refScrollView = useRef<ScrollView>(null);
  const [curIndex, setCurIndex] = useState<number>(currentIndex);
  const positiveMomentum = useRef<boolean>(false);
  const prevIndex = usePrevious(curIndex, curIndex);
  const [carouselState, setCarouselState] = useState<InfiniteDotState>({
    currentIndex,
    state: 1,
  });
  const list = [...Array(length).keys()];
  const scrollTo = useCallback(
    (index: number): void => {
      if (!refScrollView.current) return;
      const moveTo = positiveMomentum.current
        ? calculateOffsetSize(decreasingDots, index - maxIndicators + 1)
        : calculateOffsetSize(decreasingDots, index);

      refScrollView.current.scrollTo({
        animated: true,
        x: moveTo,
      });
    },
    [decreasingDots, maxIndicators],
  );
  useEffect(() => {
    setCurIndex(currentIndex);
  }, [currentIndex]);
  useEffect(() => {
    positiveMomentum.current = curIndex - prevIndex > 0;
    let internalState = carouselState.state;
    internalState += curIndex - prevIndex;
    const finalState = internalState;
    if (internalState > maxIndicators) internalState = maxIndicators;
    if (internalState < 1) internalState = 1;
    if (internalState) {
      setCarouselState({
        currentIndex: curIndex,
        state: internalState,
      });
    }

    if (
      length > maxIndicators &&
      (finalState > maxIndicators || finalState < 1)
    )
      scrollTo(curIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curIndex, length, maxIndicators, scrollTo]);
  const containerSize =
    decreasingDots.reduce(
      (acc, current) => calculateDecreasingDotSize(current) + acc,
      0,
    ) +
    calculateIndicatorDotSize(
      maxIndicators,
      activeIndicatorConfig,
      inactiveIndicatorConfig,
    );
  if (length <= maxIndicators) {
    return (
      <View style={styles.container}>
        {list.map(i => {
          return (
            <Dot
              key={i}
              index={i}
              maxIndicators={maxIndicators}
              activeIndicatorConfig={activeIndicatorConfig}
              inactiveIndicatorConfig={inactiveIndicatorConfig}
              verticalOrientation={verticalOrientation}
              decreasingDots={decreasingDots}
              carouselState={carouselState}
              interpolateOpacityAndColor={interpolateOpacityAndColor}
            />
          );
        })}
      </View>
    );
  }
  const invisibleFillerSize =
    decreasingDots.reduce(
      (acc, current) => calculateDecreasingDotSize(current) + acc,
      0,
    ) / 2;
  return (
    <View
      style={[
        verticalOrientation
          ? { flex: 1, height: containerSize }
          : { flex: 1, flexDirection: 'row', width: containerSize },
      ]}
    >
      <ScrollView
        ref={refScrollView}
        contentContainerStyle={[
          styles.scrollContainer,
          { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
        ]}
        bounces={false}
        horizontal={!verticalOrientation}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <InvisibleFiller
          size={invisibleFillerSize}
          verticalOrientation={verticalOrientation}
        />
        {list.map(i => {
          return (
            <Dot
              key={i}
              index={i}
              maxIndicators={maxIndicators}
              activeIndicatorConfig={activeIndicatorConfig}
              inactiveIndicatorConfig={inactiveIndicatorConfig}
              decreasingDots={decreasingDots}
              verticalOrientation={verticalOrientation}
              carouselState={carouselState}
              interpolateOpacityAndColor={interpolateOpacityAndColor}
            />
          );
        })}
        <InvisibleFiller
          size={invisibleFillerSize}
          verticalOrientation={verticalOrientation}
        />
      </ScrollView>
    </View>
  );
};

const InvisibleFiller = ({
  size,
  verticalOrientation,
}: {
  size: number;
  verticalOrientation: boolean;
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          height: verticalOrientation ? size : 1,
          width: verticalOrientation ? 1 : size,
        },
      ]}
    />
  );
};

interface Dot {
  maxIndicators: number;
  activeIndicatorConfig: DotConfig;
  inactiveIndicatorConfig: DotConfig;
  decreasingDots: DecreasingDot[];
  index: number;
  carouselState: InfiniteDotState;
  verticalOrientation: boolean;
  interpolateOpacityAndColor: boolean;
}

const Dot = ({
  maxIndicators,
  activeIndicatorConfig,
  inactiveIndicatorConfig,
  decreasingDots,
  index,
  carouselState,
  verticalOrientation,
  interpolateOpacityAndColor,
}: Dot) => {
  const { currentIndex, state } = carouselState;
  const [type, setType] = useState(
    getDotStyle({
      activeIndicatorConfig,
      currentIndex,
      decreasingDots,
      inactiveIndicatorConfig,
      index,
      indicatorState: state,
      maxIndicators,
    }),
  );
  const prevType = usePrevious(type, type);
  const animatedValue = useRef<Animated.Value>(new Animated.Value(0));

  useEffect(() => {
    setType(
      getDotStyle({
        activeIndicatorConfig,
        currentIndex,
        decreasingDots,
        inactiveIndicatorConfig,
        index,
        indicatorState: state,
        maxIndicators,
      }),
    );
  }, [
    activeIndicatorConfig,
    currentIndex,
    decreasingDots,
    inactiveIndicatorConfig,
    index,
    maxIndicators,
    state,
  ]);

  useEffect(() => {
    animatedValue.current.setValue(0);
    Animated.timing(animatedValue.current, {
      duration: 300,
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const size = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: [prevType.size, type.size],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: interpolateOpacityAndColor
            ? animatedValue.current.interpolate({
                inputRange: [0, 1],
                outputRange: [prevType.color, type.color],
              })
            : type.color,
          borderColor: type.borderColor,
          borderRadius: type.size,
          borderWidth: type.borderWidth,
          marginHorizontal: verticalOrientation ? 0 : type.margin,
          marginVertical: verticalOrientation ? type.margin : 0,
          opacity: interpolateOpacityAndColor
            ? animatedValue.current.interpolate({
                inputRange: [0, 1],
                outputRange: [prevType.opacity, type.opacity],
              })
            : type.opacity,
        },
        {
          height: size,
          width: size,
        },
      ]}
    />
  );
};

interface GetDotStyle {
  index: number;
  currentIndex: number;
  maxIndicators: number;
  activeIndicatorConfig: DotConfig;
  inactiveIndicatorConfig: DotConfig;
  decreasingDots: DecreasingDot[];
  indicatorState: number;
}

export const getDotStyle = ({
  index,
  currentIndex,
  maxIndicators,
  activeIndicatorConfig,
  inactiveIndicatorConfig,
  decreasingDots,
  indicatorState,
}: GetDotStyle): DotConfig => {
  let dotConfig = decreasingDots[decreasingDots.length - 1].config;

  const rightRemnant = maxIndicators - indicatorState;
  const leftRemnant = indicatorState - 1;
  const leftDifference = currentIndex - leftRemnant;
  const rightDifference = currentIndex + rightRemnant;
  if (index >= leftDifference && index <= rightDifference) {
    dotConfig = inactiveIndicatorConfig;
    if (index === currentIndex) {
      dotConfig = activeIndicatorConfig;
    }
  } else {
    let leftMax = leftDifference;
    let rightMax = rightDifference;
    decreasingDots.forEach(dot => {
      if (
        (index >= leftMax - dot.quantity && index < leftMax) ||
        (index <= rightMax + dot.quantity && index > rightMax)
      ) {
        dotConfig = dot.config;
      }
      leftMax -= dot.quantity;
      rightMax += dot.quantity;
    });
  }
  return dotConfig;
};

const usePrevious = <T extends unknown>(value: T, initialValue: T): T => {
  const ref = useRef<T>(initialValue);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InfiniteDotIndicator;
