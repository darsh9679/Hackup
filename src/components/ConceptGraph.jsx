import React, { useMemo } from "react";
import "./ConceptGraph.css";

/**
 * Interactive SVG concept dependency graph
 * Nodes colored by mastery, root cause highlighted, edges show prerequisites
 */
export default function ConceptGraph({ graphData, conceptScores, rootCause, weakConcepts, learningPath }) {
  const layout = useMemo(() => computeLayout(graphData), [graphData]);

  if (!graphData || graphData.length === 0) return null;

  const svgWidth = layout.width;
  const svgHeight = layout.height;

  function getNodeColor(conceptId) {
    const score = conceptScores?.[conceptId];
    if (score === undefined) return "#4b5563";
    if (score >= 80) return "#22c55e";
    if (score >= 50) return "#eab308";
    return "#ef4444";
  }

  function isRootCause(conceptId) {
    return rootCause?.concept === conceptId;
  }

  function isOnLearningPath(conceptId) {
    return learningPath?.some(p => p.concept === conceptId);
  }

  function isWeak(conceptId) {
    return weakConcepts?.includes(conceptId);
  }

  return (
    <div className="cg-container">
      <div className="cg-legend">
        <span className="cg-legend-item"><span className="cg-dot" style={{background:"#22c55e"}} /> Strong (≥80%)</span>
        <span className="cg-legend-item"><span className="cg-dot" style={{background:"#eab308"}} /> Moderate (50-79%)</span>
        <span className="cg-legend-item"><span className="cg-dot" style={{background:"#ef4444"}} /> Weak (&lt;50%)</span>
        <span className="cg-legend-item"><span className="cg-dot cg-dot-pulse" style={{background:"#f97316"}} /> Root Cause</span>
      </div>
      <div className="cg-scroll">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="cg-svg">
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
            </marker>
            <marker id="arrowhead-path" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#c084fc" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {graphData.map(node =>
            node.prerequisites.map(prereqId => {
              const from = layout.positions[prereqId];
              const to = layout.positions[node.id];
              if (!from || !to) return null;
              const isPathEdge = isOnLearningPath(prereqId) && isOnLearningPath(node.id);
              const midY = (from.y + to.y) / 2;
              return (
                <path
                  key={`${prereqId}-${node.id}`}
                  d={`M ${from.x} ${from.y + 20} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 20}`}
                  fill="none"
                  stroke={isPathEdge ? "#c084fc" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isPathEdge ? 2.5 : 1.5}
                  markerEnd={isPathEdge ? "url(#arrowhead-path)" : "url(#arrowhead)"}
                  className={isPathEdge ? "cg-edge-path" : ""}
                />
              );
            })
          )}

          {/* Nodes */}
          {graphData.map(node => {
            const pos = layout.positions[node.id];
            if (!pos) return null;
            const color = getNodeColor(node.id);
            const isRoot = isRootCause(node.id);
            const score = conceptScores?.[node.id];

            return (
              <g key={node.id} className="cg-node-group" filter={isRoot ? "url(#glow)" : undefined}>
                {/* Outer ring for root cause */}
                {isRoot && (
                  <circle cx={pos.x} cy={pos.y} r="28" fill="none" stroke="#f97316" strokeWidth="2" className="cg-pulse-ring" />
                )}
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="22"
                  fill={isRoot ? "rgba(249,115,22,0.15)" : `${color}15`}
                  stroke={isRoot ? "#f97316" : color}
                  strokeWidth={isWeak(node.id) ? 2.5 : 1.5}
                />
                {/* Score inside */}
                <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                  className="cg-node-score" fill={color} fontSize="11" fontWeight="700">
                  {score !== undefined ? `${score}%` : "—"}
                </text>
                {/* Label below */}
                <text x={pos.x} y={pos.y + 38} textAnchor="middle"
                  className="cg-node-label" fill={isRoot ? "#f97316" : "#9ca3af"} fontSize="11" fontWeight="600">
                  {node.name}
                </text>
                {/* Root cause badge */}
                {isRoot && (
                  <text x={pos.x} y={pos.y + 52} textAnchor="middle"
                    className="cg-root-badge" fill="#f97316" fontSize="9" fontWeight="700">
                    ROOT CAUSE
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * Compute layered layout positions for concept graph
 */
function computeLayout(graphData) {
  if (!graphData || graphData.length === 0) return { positions: {}, width: 0, height: 0 };

  // Assign layers via topological sort
  const layers = {};
  const assigned = new Set();

  function getLayer(nodeId) {
    if (layers[nodeId] !== undefined) return layers[nodeId];
    const node = graphData.find(n => n.id === nodeId);
    if (!node || node.prerequisites.length === 0) {
      layers[nodeId] = 0;
      return 0;
    }
    const maxPrereqLayer = Math.max(...node.prerequisites.map(p => getLayer(p)));
    layers[nodeId] = maxPrereqLayer + 1;
    return layers[nodeId];
  }

  graphData.forEach(n => getLayer(n.id));

  // Group by layer
  const layerGroups = {};
  Object.entries(layers).forEach(([id, layer]) => {
    if (!layerGroups[layer]) layerGroups[layer] = [];
    layerGroups[layer].push(id);
  });

  const numLayers = Math.max(...Object.keys(layerGroups).map(Number)) + 1;
  const nodeSpacingX = 130;
  const layerSpacingY = 100;
  const paddingX = 80;
  const paddingY = 60;

  const maxNodesInLayer = Math.max(...Object.values(layerGroups).map(g => g.length));
  const width = Math.max(maxNodesInLayer * nodeSpacingX + paddingX * 2, 400);
  const height = numLayers * layerSpacingY + paddingY * 2;

  const positions = {};
  Object.entries(layerGroups).forEach(([layer, nodes]) => {
    const y = Number(layer) * layerSpacingY + paddingY;
    const totalWidth = (nodes.length - 1) * nodeSpacingX;
    const startX = (width - totalWidth) / 2;

    nodes.forEach((nodeId, i) => {
      positions[nodeId] = { x: startX + i * nodeSpacingX, y };
    });
  });

  return { positions, width, height };
}
