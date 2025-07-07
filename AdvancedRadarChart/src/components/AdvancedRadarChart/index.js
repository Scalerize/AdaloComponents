import React from 'react';
import { View } from 'react-native';
import Svg, { G, Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

const sampleData = ['A', 'B', 'C', 'D', 'E', 'F'].map((c) => ({ category: c, value: Math.round(Math.random()), series: 'Sample' }));
/**
 * RadarChart component for Adalo
 * Implements list specification & child components
 * Compatible with Web, Android & iOS (React‑Native)
 * When props.editor is true, a sample series with fake data is rendered.
 */
const RadarChart = (props) => {
  const {
    data = [],
    maxValue = 100,
    levels = 5,
    showDots = true,
    dotRadius = 3,
    showLabels = true,
    labelColor = '#333',
    labelFontSize = 12,
    gridColor = '#C0C0C0',
    gridLineWidth = 1,
    strokeWidth = 2,
    fillOpacity = 0.2,
    color = '#3366CC',
    _width = 300,
    _height = 300,
    editor
  } = props;

  // ----- Helpers -----------------------------------------------------------
  const extractPoint = (item = {}) => {
    // Support both childComponent nesting (item.point.{field}) and flat objects
    const p = item.point || item;
    return {
      category: p.category,
      value: Number(p.value),
      series: p.series || 'Series 1',
    };
  };

  // ----- Build Data -------------------------------------------------------
  let processed = (data || []).map(extractPoint);

  if (editor || processed.length === 0) {
    // Generate sample data in Adalo editor preview 
    processed = sampleData.map(x => ({...x, value: x.value * maxValue}));
  }

  const categories = [...new Set(processed.map((d) => d.category))];
  const seriesNames = [...new Set(processed.map((d) => d.series))];

  // Canvas sizing
  const width = _width || 300;
  const height = _height || 300;
  const cx = width / 2;
  const cy = height / 2;
  const radius = (Math.min(width, height) / 2) * 0.8;

  // Convert to per‑series point arrays
  const seriesData = seriesNames.map((name, sIdx) => {
    const pts = categories.map((cat, idx) => {
      const entry = processed.find((d) => d.series === name && d.category === cat);
      const value = entry ? entry.value : 0;
      const angle = (Math.PI * 2 * idx) / categories.length - Math.PI / 2;
      const r = (value / maxValue) * radius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
    return { name, pts, color };
  });

  // Grid polygons
  const grid = Array.from({ length: levels }, (_, lvl) =>
    categories
      .map((_, idx) => {
        const r = ((lvl + 1) / levels) * radius;
        const angle = (Math.PI * 2 * idx) / categories.length - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(' ')
  );

  // Axis lines
  const axes = categories.map((_, idx) => {
    const angle = (Math.PI * 2 * idx) / categories.length - Math.PI / 2;
    return {
      x1: cx,
      y1: cy,
      x2: cx + radius * Math.cos(angle),
      y2: cy + radius * Math.sin(angle),
      angle,
    };
  });

  // ----- Render -----------------------------------------------------------
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <G>
          {/* Grid levels */}
          {grid.map((points, idx) => (
            <Polygon key={`grid-${idx}`} points={points} fill="none" stroke={gridColor} strokeWidth={gridLineWidth} />
          ))}

          {/* Axes */}
          {axes.map((axis, idx) => (
            <Line key={`axis-${idx}`} {...axis} stroke={gridColor} strokeWidth={gridLineWidth} />
          ))}

          {/* Series polygons & dots */}
          {seriesData.map((serie, sIdx) => {
            const poly = serie.pts.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <G key={`series-${sIdx}`}>
                <Polygon points={poly} fill={serie.color} opacity={fillOpacity/100} stroke={serie.color} strokeWidth={strokeWidth} />
                {showDots &&
                  serie.pts.map((p, i) => <Circle key={`dot-${sIdx}-${i}`} cx={p.x} cy={p.y} r={dotRadius} fill={serie.color} />)}
              </G>
            );
          })}

          {/* Category labels */}
          {showLabels &&
            categories.map((cat, idx) => {
              const angle = (Math.PI * 2 * idx) / categories.length - Math.PI / 2;
              const r = radius + labelFontSize + 4;
              return (
                <SvgText
                  key={`label-${idx}`}
                  x={cx + r * Math.cos(angle)}
                  y={cy + r * Math.sin(angle) + labelFontSize / 2}
                  fontSize={labelFontSize}
                  fill={labelColor}
                  textAnchor="middle"
                >
                  {cat}
                </SvgText>
              );
            })}
        </G>
      </Svg>
    </View>
  );
};

export default RadarChart;