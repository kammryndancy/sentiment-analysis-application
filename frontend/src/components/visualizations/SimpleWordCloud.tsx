import React, { useState } from 'react';

interface WordCloudDatum {
  word: string;
  count: number;
  avgWeightedSentiment?: number;
}

interface SimpleWordCloudProps {
  words: WordCloudDatum[];
  width?: number;
  height?: number;
}

// Utility to scale font size
function getFontSize(count: number, min: number, max: number, minSize = 14, maxSize = 48) {
  if (max === min) return (minSize + maxSize) / 2;
  return minSize + ((count - min) / (max - min)) * (maxSize - minSize);
}

// Utility to color by sentiment (smoothly interpolate red -> orange -> yellow -> green)
function getSentimentColor(sentiment?: number) {
  if (sentiment === undefined) return '#aaa';
  // Clamp between -1 and 1
  const s = Math.max(-1, Math.min(1, sentiment));
  // Interpolate:
  // -1 (red: #a82a2a, rgb(168,42,42))
  // -0.5 (orange: #e67e22, rgb(230,126,34))
  // 0 (yellow: #f1c40f, rgb(241,196,15))
  // 0.5 (yellow-green: #b7d61c, rgb(183,214,28))
  // 1 (green: #1f9909, rgb(31,153,9))
  let r, g, b;
  if (s < -0.5) {
    // Red to orange
    const t = (s + 1) / 0.5; // -1 to -0.5
    r = 168 + (230 - 168) * t;
    g = 42 + (126 - 42) * t;
    b = 42 + (34 - 42) * t;
  } else if (s < 0) {
    // Orange to yellow
    const t = (s + 0.5) / 0.5; // -0.5 to 0
    r = 230 + (241 - 230) * t;
    g = 126 + (196 - 126) * t;
    b = 34 + (15 - 34) * t;
  } else if (s < 0.5) {
    // Yellow to yellow-green
    const t = s / 0.5; // 0 to 0.5
    r = 241 + (183 - 241) * t;
    g = 196 + (214 - 196) * t;
    b = 15 + (28 - 15) * t;
  } else {
    // Yellow-green to green
    const t = (s - 0.5) / 0.5; // 0.5 to 1
    r = 183 + (31 - 183) * t;
    g = 214 + (153 - 214) * t;
    b = 28 + (9 - 28) * t;
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

const SimpleWordCloud: React.FC<SimpleWordCloudProps> = ({ words, width = 900, height = 350 }) => {
  if (!words || words.length === 0) return <div style={{ color: '#bdbdbd', textAlign: 'center', padding: '2rem' }}>No data</div>;
  const minCount = Math.min(...words.map(w => w.count));
  const maxCount = Math.max(...words.map(w => w.count));

  // More dispersed spiral layout for up to 50 words
  const centerX = width / 2;
  const centerY = height / 2;
  const spiral = (i: number) => {
    // Spread words out more by increasing angle and radius step
    const angle = 0.8 * i;
    const radius = 40 + 18 * Math.sqrt(i); // larger radius step
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // Compute top 5 highest and lowest avgWeightedSentiment words
  const sortedBySentiment = [...words].filter(w => typeof w.avgWeightedSentiment === 'number')
    .sort((a, b) => (b.avgWeightedSentiment! - a.avgWeightedSentiment!));
  const top5 = sortedBySentiment.slice(0, 5);
  const bottom5 = sortedBySentiment.slice(-5).reverse();

  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ word: string; color: string; sentiment?: number } | null>(null);

  // Styling
  const bg = '#1c271c'; // match panel bg
  const font = 'Segoe UI, Arial, sans-serif';
  const shadow = '0 2px 10px rgba(0,0,0,0.06)';

  return (
    <div style={{
      width: '100%',
      height: height + 32, // allow for padding
      background: bg,
      borderRadius: 10,
      boxShadow: shadow,
      padding: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      position: 'relative',
    }}>
      {/* Left: Top 5 Positive */}
      <div style={{
        position: 'absolute',
        left: 18,
        top: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 11,
        alignItems: 'flex-start',
      }}>
        {top5.map(w => (
          <span
            key={w.word}
            style={{
              color: getSentimentColor(w.avgWeightedSentiment),
              fontWeight: highlightedWord === w.word ? 900 : 600,
              fontSize: highlightedWord === w.word ? '1.15rem' : '1rem',
              background: highlightedWord === w.word ? '#2c3e2c' : 'transparent',
              borderRadius: 6,
              padding: highlightedWord === w.word ? '2px 10px' : '2px 4px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={() => setHighlightedWord(w.word)}
            onMouseLeave={() => setHighlightedWord(null)}
            onFocus={() => setHighlightedWord(w.word)}
            onBlur={() => setHighlightedWord(null)}
            tabIndex={0}
          >
            <span>{w.word}</span>
            <span style={{color: '#aaa', fontWeight: 400, fontSize: '0.98rem'}}>
              {typeof w.avgWeightedSentiment === 'number' ? w.avgWeightedSentiment.toFixed(3) : ''}
            </span>
          </span>
        ))}
      </div>
      {/* Right: Top 5 Negative */}
      <div style={{
        position: 'absolute',
        right: 18,
        top: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 11,
        alignItems: 'flex-end',
      }}>
        {bottom5.map(w => (
          <span
            key={w.word}
            style={{
              color: getSentimentColor(w.avgWeightedSentiment),
              fontWeight: highlightedWord === w.word ? 900 : 600,
              fontSize: highlightedWord === w.word ? '1.15rem' : '1rem',
              background: highlightedWord === w.word ? '#2c3e2c' : 'transparent',
              borderRadius: 6,
              padding: highlightedWord === w.word ? '2px 10px' : '2px 4px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={() => setHighlightedWord(w.word)}
            onMouseLeave={() => setHighlightedWord(null)}
            onFocus={() => setHighlightedWord(w.word)}
            onBlur={() => setHighlightedWord(null)}
            tabIndex={0}
          >
            <span>{w.word}</span>
            <span style={{color: '#aaa', fontWeight: 400, fontSize: '0.98rem'}}>
              {typeof w.avgWeightedSentiment === 'number' ? w.avgWeightedSentiment.toFixed(3) : ''}
            </span>
          </span>
        ))}
      </div>
      {/* Word Cloud SVG */}
      <svg width={width} height={height} style={{ background: 'transparent', width: '100%', height: '100%' }}>
        {words.slice(0, 50).map((w, i) => {
          const { x, y } = spiral(i);
          const fontSize = getFontSize(w.count, minCount, maxCount, 18, 64); // larger font range
          const fill = getSentimentColor(w.avgWeightedSentiment);
          const isHovered = hovered && hovered.word === w.word;
          const isHighlighted = highlightedWord === w.word;
          return (
            <text
              key={w.word}
              x={x}
              y={y}
              fontSize={fontSize}
              fill={isHovered || isHighlighted ? fill : fill}
              textAnchor="middle"
              alignmentBaseline="middle"
              style={{
                fontWeight: isHovered || isHighlighted ? 900 : 600,
                cursor: 'pointer',
                userSelect: 'none',
                fontFamily: font,
                letterSpacing: 0.5,
                transition: 'fill 0.2s, font-weight 0.2s',
                filter: (isHovered || isHighlighted) ? 'brightness(1.3) drop-shadow(0 0 6px #000a)' : undefined,
                outline: (isHovered || isHighlighted) ? 'none' : undefined,
              }}
              tabIndex={0}
              onMouseEnter={() => setHovered({ word: w.word, color: fill, sentiment: w.avgWeightedSentiment })}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered({ word: w.word, color: fill, sentiment: w.avgWeightedSentiment })}
              onBlur={() => setHovered(null)}
            >
              {w.word}
            </text>
          );
        })}
      </svg>
      {/* Hovered Word Box */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 24,
            background: '#223322',
            color: hovered.color,
            padding: '10px 20px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: 1,
            boxShadow: '0 2px 8px #0003',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 60,
            textAlign: 'center',
            border: '1.5px solid #1c271c',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span style={{color: hovered.color}}>{hovered.word}</span>
          <span style={{color: '#aaa', fontWeight: 400, fontSize: '1.1rem'}}>
            {hovered.sentiment !== undefined ? hovered.sentiment.toFixed(3) : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default SimpleWordCloud;
