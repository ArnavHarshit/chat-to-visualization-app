import React, { useRef, useEffect, useState } from 'react';

function VisualizationCanvas({ visualization, isPlaying }) {
  const canvasRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!visualization) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;

    // Draw the visualization
    const draw = (time) => {
      if (!isPlaying && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        return;
      }

      if (isPlaying && startTimeRef.current === 0) {
        startTimeRef.current = performance.now() - currentTime;
      }

      const elapsed = isPlaying ? performance.now() - startTimeRef.current : currentTime;
      setCurrentTime(elapsed);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw each layer
      visualization.layers.forEach(layer => {
        drawLayer(ctx, layer, elapsed, visualization.duration);
      });

      if (isPlaying && elapsed < visualization.duration) {
        animationRef.current = requestAnimationFrame(draw);
      } else if (elapsed >= visualization.duration) {
        setCurrentTime(0);
        startTimeRef.current = 0;
      }
    };

    draw(performance.now());

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visualization, isPlaying, currentTime]);

  const drawLayer = (ctx, layer, elapsed, duration) => {
    // Calculate animated properties
    const props = { ...layer.props };
    
    layer.animations.forEach(animation => {
      if (elapsed >= animation.start && elapsed <= animation.end) {
        const progress = (elapsed - animation.start) / (animation.end - animation.start);
        
        if (animation.property === 'x') {
          props.x = animation.from + (animation.to - animation.from) * progress;
        } else if (animation.property === 'y') {
          props.y = animation.from + (animation.to - animation.from) * progress;
        } else if (animation.property === 'opacity') {
          ctx.globalAlpha = animation.from + (animation.to - animation.from) * progress;
        } else if (animation.property === 'orbit') {
          const angle = (progress * 2 * Math.PI) % (2 * Math.PI);
          props.x = animation.centerX + Math.cos(angle) * animation.radius;
          props.y = animation.centerY + Math.sin(angle) * animation.radius;
        }
      }
    });

    // Draw based on type
    if (layer.type === 'circle') {
      ctx.beginPath();
      ctx.arc(props.x, props.y, props.r, 0, 2 * Math.PI);
      ctx.fillStyle = props.fill;
      ctx.fill();
    } else if (layer.type === 'rectangle') {
      ctx.fillStyle = props.fill;
      ctx.fillRect(props.x, props.y, props.width, props.height);
    } else if (layer.type === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(props.x, props.y);
      ctx.lineTo(props.x + props.dx, props.y + props.dy);
      ctx.strokeStyle = props.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Arrowhead
      const angle = Math.atan2(props.dy, props.dx);
      ctx.beginPath();
      ctx.moveTo(props.x + props.dx, props.y + props.dy);
      ctx.lineTo(
        props.x + props.dx - 10 * Math.cos(angle - Math.PI/6),
        props.y + props.dy - 10 * Math.sin(angle - Math.PI/6)
      );
      ctx.lineTo(
        props.x + props.dx - 10 * Math.cos(angle + Math.PI/6),
        props.y + props.dy - 10 * Math.sin(angle + Math.PI/6)
      );
      ctx.closePath();
      ctx.fillStyle = props.color;
      ctx.fill();
    } else if (layer.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(props.x1, props.y1);
      ctx.lineTo(props.x2, props.y2);
      ctx.strokeStyle = props.color;
      ctx.lineWidth = props.width || 2;
      ctx.stroke();
    } else if (layer.type === 'text') {
      ctx.font = `${props.size || 16}px Arial`;
      ctx.fillStyle = props.color || '#000000';
      ctx.fillText(props.text, props.x, props.y);
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1;
  };

  if (!visualization) {
    return (
      <div className="visualization-container">
        <div className="visualization-placeholder">
          Select a question to view visualization
        </div>
      </div>
    );
  }

  return (
    <div className="visualization-container">
      <canvas ref={canvasRef} width={600} height={400} />
    </div>
  );
}

export default VisualizationCanvas;