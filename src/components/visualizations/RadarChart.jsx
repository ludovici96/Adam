import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const DEFAULT_COLORS = {
  axes: '#78716C',      // Stone - warm neutral
  levels: '#A3A3A3',    // Neutral gray
  fill: '#2D8B7A',      // Teal - insight color
  stroke: '#2D8B7A',
  labels: 'var(--text-secondary)',
  points: '#2D8B7A'
};

export function RadarChart({
  data,
  secondaryData,
  size = 280,
  levels = 5,
  colors = {},
  animated = true,
  showLabels = true,
  showValues = false,
  className
}) {
  const mergedColors = { ...DEFAULT_COLORS, ...colors };
  const center = size / 2;
  const radius = (size / 2) - 60; // Leave more room for labels to prevent clipping

  const angleSlice = useMemo(() => (Math.PI * 2) / data.length, [data.length]);

  // Helper: Calculate points for a dataset
  const calculatePoints = (dataset) => {
    if (!dataset) return [];
    return dataset.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = d.value * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle)
      };
    });
  };

  // Helper: Create SVG path
  const createPath = (datasetPoints) => {
    if (!datasetPoints || datasetPoints.length === 0) return '';
    return datasetPoints.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    ).join(' ') + ' Z';
  }

  // Calculate polygon points based on data values
  const points = useMemo(() => calculatePoints(data), [data, angleSlice, radius, center]);
  const secondaryPoints = useMemo(() => calculatePoints(secondaryData), [secondaryData, angleSlice, radius, center]);

  // Create SVG path string for the polygon
  const pathD = useMemo(() => createPath(points), [points]);
  const secondaryPathD = useMemo(() => createPath(secondaryPoints), [secondaryPoints]);

  // Calculate axis end points (at full radius)
  const axisEndPoints = useMemo(() => {
    return data.map((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    });
  }, [data, angleSlice, radius, center]);

  // Calculate label positions (outside the chart)
  const labelPositions = useMemo(() => {
    return data.map((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 28;
      return {
        x: center + labelRadius * Math.cos(angle),
        y: center + labelRadius * Math.sin(angle)
      };
    });
  }, [data, angleSlice, radius, center]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={clsx('w-full h-auto max-w-[280px] mx-auto', className)}
    >
      {/* Background concentric circles (levels) */}
      {Array.from({ length: levels }).map((_, i) => (
        <circle
          key={`level-${i}`}
          cx={center}
          cy={center}
          r={(radius * (i + 1)) / levels}
          fill="none"
          stroke={mergedColors.levels}
          strokeOpacity={0.15}
          strokeWidth={1}
        />
      ))}

      {/* Axis lines from center to edge */}
      {axisEndPoints.map((point, i) => (
        <line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke={mergedColors.axes}
          strokeOpacity={0.25}
          strokeWidth={1}
        />
      ))}

      {/* Primary Data Polygon */}
      <motion.path
        d={pathD}
        fill={mergedColors.fill}
        fillOpacity={0.2}
        stroke={mergedColors.stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
        initial={false}
        animate={{ d: pathD, opacity: 1 }}
        transition={{ type: "spring", stiffness: 45, damping: 12 }}
      />

      {/* Secondary Data Polygon (Ghost Chart) */}
      {secondaryData && secondaryPathD && (
        <motion.path
          d={secondaryPathD}
          fill={colors.secondaryFill || 'none'}
          fillOpacity={colors.secondaryFill ? 0.2 : 0}
          stroke={colors.secondaryStroke || '#2D8B7A'} // Default Teal
          strokeWidth={2}
          strokeDasharray={colors.secondaryFill ? "0" : "4 2"} // Solid if filled (simulation), dashed if not (partner)
          strokeLinejoin="round"
          initial={false}
          animate={{ d: secondaryPathD, opacity: 0.8 }}
          transition={{ type: "spring", stiffness: 40, damping: 10, mass: 1 }}
        />
      )}

      {/* Primary Data points at vertices */}
      {points.map((point, i) => (
        <motion.circle
          key={`point-${i}`}
          cx={point.x}
          cy={point.y}
          r={5}
          fill={mergedColors.points}
          stroke="white"
          strokeWidth={2}
          initial={animated ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 + i * 0.1, duration: 0.2 }}
        />
      ))}

      {/* Secondary Data points at vertices (Smaller, less prominent) */}
      {secondaryPoints && secondaryPoints.map((point, i) => (
        <motion.circle
          key={`sec-point-${i}`}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={colors.secondaryStroke || '#5EEAD4'}
          stroke="white"
          strokeWidth={1.5}
          initial={animated ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ delay: 1.0 + i * 0.1, duration: 0.2 }}
        />
      ))}

      {/* Axis labels */}
      {showLabels && data.map((d, i) => (
        <text
          key={`label-${i}`}
          x={labelPositions[i].x}
          y={labelPositions[i].y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[11px] fill-[var(--text-secondary)] font-medium"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {d.axis}
          {showValues && (
            <tspan className="text-[9px] opacity-50">
              {' '}({Math.round(d.value * 100)}%)
            </tspan>
          )}
        </text>
      ))}

      {/* Center point */}
      <circle
        cx={center}
        cy={center}
        r={3}
        fill={mergedColors.axes}
        fillOpacity={0.3}
      />
    </svg>
  );
}

export default RadarChart;
