import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Path, Text, Line } from "react-native-svg";
import * as d3 from "d3-shape";

import { useAppState } from "@/context/state";
import * as fft from "@/utils/signalProcessing/fft";

interface ChartProps {
  data?: Array<{ x: number; y: number }>;
  strokeColor?: string;
  pointColor?: string;
}

const createLabelsFromList = (
  labels: number[],
  l2value: (x: number) => number,
  min: number,
  max: number
) => {
  const labelList = labels.map((x) => {
    return {
      label: x.toFixed(0),
      v: (l2value(x) - min) / (max - min), // Normalize x value to for the SVG viewBox
    };
  });
  return labelList;
};

const createMinorLabelsFromList = (
  labels: number[],
  l2value: (x: number) => number,
  min: number,
  max: number
) => {
  let ret = [];
  for (let i = 0; i < labels.length; i++) {
    let step = 1;
    let pow = Math.floor(Math.log10(labels[i]));

    while (labels[i] + step * Math.pow(10, pow) < (labels.length === i ? max : labels[i + 1])) {
      let xv = labels[i] + step * Math.pow(10, pow);
      ret.push({
        label: xv.toFixed(0),
        v: (l2value(xv) - min) / (max - min), // Normalize x value to for the SVG viewBox
      });
      step++;
    }
  }
  return ret;
};

const GridLines: React.FC<{
  lines: Array<{ v: number; label: string }>;
  orientation: "horizontal" | "vertical";
  length: number;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  dashArray?: string;
}> = ({ lines, orientation, length, stroke, strokeWidth, dashArray, width, height }) => {
  return (
    <>
      {lines.map((p) => (
        <Line
          key={`${orientation}-grid-${p.label}`}
          x1={orientation === "vertical" ? p.v * length : 0}
          y1={orientation === "horizontal" ? p.v * length : 0}
          x2={orientation === "vertical" ? p.v * length : width}
          y2={orientation === "horizontal" ? p.v * length : height}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      ))}
    </>
  );
};

const Labels: React.FC<{
  labels: Array<{ v: number; label: string }>;
  orientation: "horizontal" | "vertical";
  positionOffset: number;
  fontSize: number;
  fill: string;
  width: number;
  height: number;
}> = ({ labels, orientation, positionOffset, fontSize, fill, width, height }) => {
  return (
    <>
      {labels.map((p) => (
        <Text
          key={`${orientation}-label-${p.label}`}
          x={orientation === "vertical" ? positionOffset : p.v * width}
          y={orientation === "horizontal" ? positionOffset : p.v * height}
          fontSize={fontSize}
          fill={fill}
          textAnchor="middle"
        >
          {p.label}
        </Text>
      ))}
    </>
  );
};

const BBBAudioPlots: React.FC<ChartProps> = ({
  data = [],
  strokeColor = "rgb(0, 123, 255)",
  pointColor = "rgb(110, 136, 162)",
}) => {
  const { bbbParams } = useAppState();
  // State to store dynamic dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, heightMargin: 0 });

  // Handle layout changes to get parent dimensions
  const onLayout = (event: any) => {
    console.log("onLayout", event.nativeEvent.layout);
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height, heightMargin: height / 5 });
  };

  /* Misc labels */
  const FFT_X_MAJOR_TICKS = [fft.FFT_X_MIN, 100, 1000, 10000, fft.FFT_X_MAX]; // Major ticks for x-axis (in Hz), but spaced logarithmically
  const FFT_Y_MAJOR_TICKS = [fft.FFT_Y_MIN, -20, -10, -5, 0, fft.FFT_Y_MAX]; // Major ticks for y-axis (in dB)
  const X_MINOR_LABELS = useMemo(
    () =>
      createMinorLabelsFromList(
        FFT_X_MAJOR_TICKS,
        (x) => {
          return Math.log10(x);
        },
        fft.LIN_X_MIN,
        fft.LIN_X_MAX
      ), // 5 labels from 20Hz to 20kHz
    [FFT_X_MAJOR_TICKS, fft.LIN_X_MIN, fft.LIN_X_MAX]
  );

  const X_MAJOR_LABELS = useMemo(
    () =>
      createLabelsFromList(
        FFT_X_MAJOR_TICKS,
        (x) => {
          return Math.log10(x);
        },
        fft.LIN_X_MIN,
        fft.LIN_X_MAX
      ), // 5 labels from 20Hz to 20kHz
    [FFT_X_MAJOR_TICKS, fft.LIN_X_MIN, fft.LIN_X_MAX]
  );

  const Y_MINOR_LABELS = useMemo(
    () =>
      createLabelsFromList(
        FFT_Y_MAJOR_TICKS,
        (x) => {
          return fft.db2lin(x);
        },
        fft.LIN_Y_MAX,
        fft.LIN_Y_MIN
      ), // 5 labels from -80dB to 10dB
    [FFT_Y_MAJOR_TICKS, fft.LIN_Y_MAX, fft.LIN_Y_MIN]
  );

  const [lpfCutoff, setLpfCutoff] = useState(fft.FFT_X_MIN);

  useEffect(() => {
    const lpfCutoffValue = bbbParams.get("LpfCutoff")?.value ?? fft.FFT_X_MIN; // Get the LPF cutoff value from the state
    setLpfCutoff(
      fft.log10ToLinRange(lpfCutoffValue, fft.LIN_X_MIN, fft.LIN_X_MAX) * dimensions.width
    ); // Update the LPF cutoff state
  }, [bbbParams]);

  /* Data path string */
  const pathString = useMemo(() => {
    if (!data.length) return ""; // Return empty string if no data

    const lineGenerator = d3
      .line<{ x: number; y: number }>()
      .x(
        (d: { x: number; y: number }) =>
          fft.log10ToLinRange(d.x, fft.LIN_X_MIN, fft.LIN_X_MAX) * dimensions.width
      )
      .y(
        (d: { x: number; y: number }) =>
          (1 - fft.db2linRange(d.y, fft.LIN_Y_MIN, fft.LIN_Y_MAX)) * dimensions.height
      )
      .curve(d3.curveBasis); // Use curveBasis for smoothing

    return lineGenerator(data) || "";
  }, [data, dimensions.width, dimensions.height]);

  return (
    <View
      style={{
        alignItems: "center",
        marginTop: "5%",
        width: "100%",
        height: "30%",
        marginBottom: "5%",
      }}
      onLayout={onLayout}
    >
      <Svg
        height="100%"
        width="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height + dimensions.heightMargin}`}
      >
        {/* plot data */}
        <Path d={pathString} fill="none" stroke={strokeColor} strokeWidth="2" />

        {/* Grid Lines */}
        <GridLines
          lines={Y_MINOR_LABELS}
          orientation="horizontal"
          length={dimensions.height}
          stroke="rgb(177, 177, 177)"
          strokeWidth={0.5}
          width={dimensions.width}
          height={dimensions.height}
        />
        <GridLines
          lines={X_MAJOR_LABELS}
          orientation="vertical"
          length={dimensions.width}
          stroke="rgb(102, 102, 102)"
          strokeWidth={0.5}
          width={dimensions.width}
          height={dimensions.height}
        />
        <GridLines
          lines={X_MINOR_LABELS}
          orientation="vertical"
          length={dimensions.width}
          stroke="rgb(102, 102, 102)"
          strokeWidth={0.5}
          width={dimensions.width}
          height={dimensions.height}
        />

        {/* axis labels */}
        <Labels
          labels={Y_MINOR_LABELS}
          orientation="vertical"
          positionOffset={-20} // Position below the y-axis
          fontSize={10}
          fill="black"
          width={dimensions.width}
          height={dimensions.height}
        />
        <Labels
          labels={X_MAJOR_LABELS}
          orientation="horizontal"
          positionOffset={dimensions.height + dimensions.heightMargin / 2} // Position below the x-axis
          fontSize={10}
          fill="black"
          width={dimensions.width}
          height={dimensions.height}
        />

        {/* LPF Cutoff */}
        {/* <Line
          x1={lpfCutoff}
          y1={0}
          x2={lpfCutoff}
          y2={dimensions.height}
          stroke="black"
          strokeWidth="1"
          strokeDasharray="5,5"
        /> */}
      </Svg>
    </View>
  );
};

export default BBBAudioPlots;
