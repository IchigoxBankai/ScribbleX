class DrawingManager {
  addDrawingAction(room, action) {
    if (!room.gameState.drawingHistory) {
      room.gameState.drawingHistory = [];
    }

    if (action.type === 'clear') {
      room.gameState.drawingHistory = [];
      room.gameState.redoStack = [];
    } else if (action.type === 'undo') {
      if (room.gameState.drawingHistory.length > 0) {
        if (!room.gameState.redoStack) room.gameState.redoStack = [];
        const lastAction = room.gameState.drawingHistory[room.gameState.drawingHistory.length - 1];
        if (lastAction && lastAction.strokeId) {
          const targetStrokeId = lastAction.strokeId;
          const undone = room.gameState.drawingHistory.filter(act => act.strokeId === targetStrokeId);
          room.gameState.redoStack.push({ type: 'stroke', strokeId: targetStrokeId, actions: undone });
          room.gameState.drawingHistory = room.gameState.drawingHistory.filter(act => act.strokeId !== targetStrokeId);
        } else {
          const undone = room.gameState.drawingHistory.pop();
          room.gameState.redoStack.push({ type: 'single', action: undone });
        }
      }
    } else if (action.type === 'redo') {
      // Redo is handled by the client re-emitting the redone stroke actions
    } else {
      // Ordinary drawing/fill segment/stroke
      room.gameState.drawingHistory.push(action);
      // Clear redo stack on new action
      room.gameState.redoStack = [];
    }
  }

  getDrawingHistory(room) {
    return room.gameState.drawingHistory || [];
  }

  clearDrawing(room) {
    room.gameState.drawingHistory = [];
    room.gameState.redoStack = [];
  }
}

module.exports = new DrawingManager();
