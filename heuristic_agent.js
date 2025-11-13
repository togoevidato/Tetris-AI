// Heuristic evaluation function
function evaluateBoard(board) {
    let aggregateHeight = 0;
    let completeLines = 0;
    let holes = 0;
    let bumpiness = 0;
    let columnHeights = new Array(nx).fill(0);

    // FIX Bug 1: Iterate X first (columns), then Y (rows)
    for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0 ) {
                columnHeights[x] = ny - y;
                aggregateHeight += columnHeights[x];
                break;
            }
        }
    }

    // Calculate complete lines
    for (let y = 0; y < ny; y++) {
        var complete = true;
        for (let x = 0; x < nx; x++) {
            if (board[x][y] === 0) {
                complete = false;
                break;
            }
        }
        if (complete)
            completeLines++;
    }

    // Calculate holes
    for (let x = 0; x < nx; x++) {
        let blockFound = false;
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                blockFound = true;
            } else if (blockFound && board[x][y] === 0 ) {
                holes++;
            }
        }
    }

    // Calculate bumpiness
    for (let x = 0; x < nx - 1; x++) {
        bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
    }

    // Combine features into a heuristic score
    return -0.51 * aggregateHeight + 0.76 * completeLines - 0.36 * holes - 0.18 * bumpiness;
}

// Function to deep copy the blocks array
function copyBlocks(blocks) {
    let new_blocks = [];
    for (let x = 0; x < nx; x++) {
        new_blocks[x] = [];
        for (let y = 0; y < ny; y++) {
            new_blocks[x][y] = blocks[x][y];
        }
    }
    return new_blocks;
}

// FIX Bug 2: Get the actual width of rotated piece
function getPieceWidth(type, dir) {
    let minimumX = 4, maximumX = -1;
    eachblock(type, 0, 0, dir, function(x, y) {
        if (x < minimumX) minimumX = x;
        if (x > maximumX) maximumX = x;
    });
    return maximumX - minimumX + 1;
}

// FIX Bug 3: Create a simulation context that holds the board state
var simulationContext = {
    board: null,

    init: function(initialBoard) {
        this.board = initialBoard;
    },
    
    isOccupied: function(type, x, y, dir) {
        var result = false;
        eachblock(type, x, y, dir, function(px, py) {
            if (px < 0 || px >= nx || py < 0 || py >= ny || this.board[px][py] !== 0) {
            result = true;
        }
        }.bind(this));
        return result;
    },
    
    findDropY: function(type, x, dir) {
        let y = 0;
        while (!this.isOccupied(type, x, y + 1, dir)) {
            y++;
        }
        return y;
    },
    
    placePiece: function(type, x, y, dir) {
        let newBoard = copyBlocks(this.board);
        eachblock(type, x, y, dir, function(px, py) {
            if (px >= 0 && px < nx && py >= 0 && py < ny) {
                newBoard[px][py] = type;
            }
        });
        return newBoard;
    }
};

// FIX Bug 4: Generate moves using simulation context
function getPossibleMoves(piece) {
    let moves = [];
    
    // For each rotation of the piece
    for (let dir = 0; dir < 4; dir++) {
        let testPiece = { type: piece.type, dir: dir };
        
        // FIX Bug 5: Start from -3 to allow left positioning
        for (let x = -3; x < nx; x++) {
            if (simulationContext.isOccupied(testPiece.type, x, 0, testPiece.dir)) {
                continue;
            }
            
            let y = simulationContext.findDropY(testPiece.type, x, testPiece.dir);
            
            if (simulationContext.isOccupied(testPiece.type, x, y, testPiece.dir)) {
                continue;
            }
            
            let resultBoard = simulationContext.placePiece(testPiece.type, x, y, testPiece.dir);
            
            moves.push({
                piece: { type: testPiece.type, dir: testPiece.dir },
                x: x,
                y: y,
                board: resultBoard
            });
        }
    }
    
    return moves;
}

// FIX Bug 4: Initialize simulation context before getting moves
function selectBestMove(piece, board) {
    simulationContext.init(board);
    
    let moves = getPossibleMoves(piece);
    let bestMove = null;
    let bestScore = -Infinity;

    moves.forEach(move => {
        let score = evaluateBoard(move.board);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });

    return bestMove;
}

function getDropPosition(piece, x, board) {
    simulationContext.init(board);
    return simulationContext.findDropY(piece.type, x, piece.dir);
}
