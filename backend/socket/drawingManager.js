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
        const undone = room.gameState.drawingHistory.pop();
        room.gameState.redoStack.push(undone);
      }
    } else if (action.type === 'redo') {
      if (room.gameState.redoStack && room.gameState.redoStack.length > 0) {
        const redone = room.gameState.redoStack.pop();
        room.gameState.drawingHistory.push(redone);
      }
    } else {
      // Ordinary drawing/fill stroke
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
