import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function Canvas({ isArtist, brushColor, brushSize, tool, setTool }) {
  const { socket, sendDrawAction, drawingHistory } = useSocket();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const historyRef = useRef([]); // local draw actions history
  const redoRef = useRef([]); // local redo history
  const lastCoordsRef = useRef(null);
  const strokeIdRef = useRef(null);

  // Fixed logical width and height for coordination synchronization
  const LOGICAL_WIDTH = 800;
  const LOGICAL_HEIGHT = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    clearCanvasLocal(false);

    if (drawingHistory && drawingHistory.length > 0) {
      drawingHistory.forEach(action => {
        applyDrawAction(action);
      });
      historyRef.current = [...drawingHistory];
    }
  }, [drawingHistory]);

  // Listener for incoming drawing actions from backend
  useEffect(() => {
    if (!socket) return;

    const handleDrawAction = (action) => {
      if (action.type === 'clear') {
        historyRef.current = [];
        redrawHistory();
      } else if (action.type === 'undo') {
        // Find last action's strokeId
        const lastAction = historyRef.current[historyRef.current.length - 1];
        if (lastAction && lastAction.strokeId) {
          const targetStrokeId = lastAction.strokeId;
          historyRef.current = historyRef.current.filter(act => act.strokeId !== targetStrokeId);
        } else {
          historyRef.current.pop();
        }
        redrawHistory();
      } else if (action.type === 'redo') {
        // Redo stack is managed locally by each client if they are the artist,
        // but for others we just clear redo or handle custom sync.
        // The simplest is letting server state re-sync on room updates.
      } else {
        applyDrawAction(action);
        historyRef.current.push(action);
      }
    };

    socket.on('drawAction', handleDrawAction);
    return () => {
      socket.off('drawAction', handleDrawAction);
    };
  }, [socket]);

  const clearCanvasLocal = (notify = true) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    if (notify) {
      const action = { type: 'clear' };
      historyRef.current = [];
      redoRef.current = [];
      sendDrawAction(action);
    }
  };

  const redrawHistory = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    historyRef.current.forEach(action => {
      applyDrawAction(action);
    });
  };

  // Run a canvas action
  const applyDrawAction = (action) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    if (action.type === 'clear') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    } else if (action.type === 'draw') {
      ctx.beginPath();
      ctx.strokeStyle = action.color;
      ctx.lineWidth = action.size;

      const points = action.points;
      if (points.length === 1) {
        ctx.arc(points[0].x * LOGICAL_WIDTH, points[0].y * LOGICAL_HEIGHT, action.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = action.color;
        ctx.fill();
      } else {
        ctx.moveTo(points[0].x * LOGICAL_WIDTH, points[0].y * LOGICAL_HEIGHT);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x * LOGICAL_WIDTH, points[i].y * LOGICAL_HEIGHT);
        }
        ctx.stroke();
      }
    } else if (action.type === 'fill') {
      floodFill(
        canvasRef.current,
        Math.floor(action.x * LOGICAL_WIDTH),
        Math.floor(action.y * LOGICAL_HEIGHT),
        action.color
      );
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    return {
      x: relX / rect.width,
      y: relY / rect.height
    };
  };

  const startDrawingHandler = (e) => {
    if (!isArtist) return;
    e.preventDefault();

    const coords = getCoordinates(e);

    if (tool === 'fill') {
      const action = {
        type: 'fill',
        x: coords.x,
        y: coords.y,
        color: brushColor
      };
      applyDrawAction(action);
      historyRef.current.push(action);
      redoRef.current = [];
      sendDrawAction(action);
      return;
    }

    setIsDrawing(true);
    const colorToUse = tool === 'eraser' ? '#FFFFFF' : brushColor;
    const strokeId = Math.random().toString(36).substr(2, 9);
    
    strokeIdRef.current = strokeId;
    lastCoordsRef.current = coords;

    // Draw single dot on touch/click start
    const action = {
      type: 'draw',
      color: colorToUse,
      size: brushSize,
      strokeId,
      points: [coords, coords]
    };

    historyRef.current.push(action);
    redoRef.current = [];
    applyDrawAction(action);
    sendDrawAction(action);
  };

  const drawHandler = (e) => {
    if (!isDrawing || !isArtist) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const colorToUse = tool === 'eraser' ? '#FFFFFF' : brushColor;

    // Send segment in real-time
    const action = {
      type: 'draw',
      color: colorToUse,
      size: brushSize,
      strokeId: strokeIdRef.current,
      points: [lastCoordsRef.current, coords]
    };

    historyRef.current.push(action);
    applyDrawAction(action);
    sendDrawAction(action);

    lastCoordsRef.current = coords;
  };

  const stopDrawingHandler = () => {
    if (!isDrawing || !isArtist) return;
    setIsDrawing(false);
    strokeIdRef.current = null;
    lastCoordsRef.current = null;
  };

  const undo = () => {
    if (!isArtist || historyRef.current.length === 0) return;
    
    // Find the last stroke/action and its strokeId
    const lastAction = historyRef.current[historyRef.current.length - 1];
    if (lastAction) {
      if (lastAction.strokeId) {
        const targetStrokeId = lastAction.strokeId;
        
        // Push undone actions to redo stack
        const undone = historyRef.current.filter(act => act.strokeId === targetStrokeId);
        redoRef.current.push({ type: 'stroke', strokeId: targetStrokeId, actions: undone });
        
        // Remove from local history
        historyRef.current = historyRef.current.filter(act => act.strokeId !== targetStrokeId);
      } else {
        const undone = historyRef.current.pop();
        redoRef.current.push({ type: 'single', action: undone });
      }
      
      redrawHistory();
      sendDrawAction({ type: 'undo' });
    }
  };

  const redo = () => {
    if (!isArtist || redoRef.current.length === 0) return;
    
    const item = redoRef.current.pop();
    if (item.type === 'stroke') {
      item.actions.forEach(action => {
        historyRef.current.push(action);
        applyDrawAction(action);
        sendDrawAction(action);
      });
    } else if (item.type === 'single') {
      historyRef.current.push(item.action);
      applyDrawAction(item.action);
      sendDrawAction(item.action);
    }
  };

  useEffect(() => {
    window.canvasUndo = undo;
    window.canvasRedo = redo;
    window.canvasClear = () => clearCanvasLocal(true);
    return () => {
      delete window.canvasUndo;
      delete window.canvasRedo;
      delete window.canvasClear;
    };
  }, [brushColor, brushSize, tool]);

  const floodFill = (canvas, startX, startY, fillColor) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const startIdx = (startY * width + startX) * 4;
    const rTarget = data[startIdx];
    const gTarget = data[startIdx + 1];
    const bTarget = data[startIdx + 2];
    const aTarget = data[startIdx + 3];

    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const { r: rFill, g: gFill, b: bFill } = hexToRgb(fillColor);
    const aFill = 255;

    if (rTarget === rFill && gTarget === gFill && bTarget === bFill && aTarget === aFill) {
      return;
    }

    const stack = [[startX, startY]];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const idx = (y * width + x) * 4;

      if (
        data[idx] === rTarget &&
        data[idx + 1] === gTarget &&
        data[idx + 2] === bTarget &&
        data[idx + 3] === aTarget
      ) {
        data[idx] = rFill;
        data[idx + 1] = gFill;
        data[idx + 2] = bFill;
        data[idx + 3] = aFill;

        if (x > 0) stack.push([x - 1, y]);
        if (x < width - 1) stack.push([x + 1, y]);
        if (y > 0) stack.push([x, y - 1]);
        if (y < height - 1) stack.push([x, y + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  return (
    <div className="relative w-full h-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-white border border-gray-200">
      <canvas
        ref={canvasRef}
        className={`w-full h-full block ${isArtist ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        onMouseDown={startDrawingHandler}
        onMouseMove={drawHandler}
        onMouseUp={stopDrawingHandler}
        onMouseLeave={stopDrawingHandler}
        onTouchStart={startDrawingHandler}
        onTouchMove={drawHandler}
        onTouchEnd={stopDrawingHandler}
      />
      {!isArtist && (
        <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/10 pointer-events-none select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          Viewing Artist Drawing...
        </div>
      )}
    </div>
  );
}
