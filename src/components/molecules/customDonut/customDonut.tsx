import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import React, { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { VictoryPie, VictoryTheme } from 'victory-native';

export type DonutDataType = {
  text: string;
  value: number;
  color?: string;
};

type CustomDonutProps = {
  innerRadius?: number;
  data: Array<any>;
  padAngle?: number;
  label?: ReactNode;
  animateDuration?: number;
  radius?: number;
  labelPlacement?: LabelPlacementEnum;
  selectedItem?: string;
  outerRaius?: number;
  hasSegmentLabel?: boolean;
};

export enum LabelPlacementEnum {
  Parallel = 'parallel',
  Vertical = 'vertical',
}

const CustomDonut = ({
  innerRadius = 80,
  outerRaius = 100,
  padAngle = 1,
  animateDuration = 500,
  hasSegmentLabel = false,
  labelPlacement = LabelPlacementEnum.Parallel,
  ...props
}: CustomDonutProps) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  //this data is used to animate the pie chart
  const [donutData, setDonutData] = React.useState<DonutDataType[]>([
    {
      text: '',
      value: 0.0001,
      color: theme.dark ? theme.colors.onSurface : theme.colors.surface,
    },
    {
      text: '',
      value: 1,
      color: theme.dark ? theme.colors.onSurface : theme.colors.surface,
    },
    {
      text: '',
      value: 0.0001,
      color: theme.dark ? theme.colors.onSurface : theme.colors.surface,
    },
  ] as DonutDataType[]);

  const labelRadius = innerRadius * 1.3;
  const CHART_SIZE = outerRaius * 2 + 20;
  const radius = props.radius ? props.radius : theme.roundness;

  useEffect(() => {
    setTimeout(() => {
      setDonutData(props.data);
    }, 500);
  }, [props.data]);

  return (
    <View style={styles.container}>
      <VictoryPie
        width={CHART_SIZE}
        height={CHART_SIZE}
        innerRadius={innerRadius}
        data={donutData}
        padding={3}
        x={datum => datum.text}
        y={datum => datum.value}
        padAngle={padAngle}
        theme={VictoryTheme.clean}
        cornerRadius={radius}
        radius={({ datum }) => {
          if (props.selectedItem === datum.text) {
            return outerRaius + 10;
          }
          return outerRaius;
        }}
        labels={hasSegmentLabel ? ({ datum }) => datum.text : () => null}
        labelPlacement={labelPlacement}
        animate={{
          duration: animateDuration,
        }}
        style={{
          data: {
            fill: ({ datum }) => datum.color,
          },
        }}
      />
      {props.label && (
        <View
          style={[
            styles.centerLabel,
            { maxWidth: labelRadius, maxHeight: labelRadius },
          ]}
        >
          {props.label}
        </View>
      )}
    </View>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      position: 'relative',
    },
    centerLabel: {
      position: 'absolute',
      top: 'auto',
      bottom: 'auto',
      left: 'auto',
      right: 'auto',
      zIndex: 10,
    },
  });

export default CustomDonut;
