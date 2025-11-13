// beam settings
const BEAM_WIDTH = 5; 
const BEAM_DEPTH = 2;


// wrapper so we always initialize simulation context correctly
function getScoredMoves(piece, board) {
    simulationContext.init(board);
    const moves = getPossibleMoves(piece);
    for (let m of moves) {
        m.score = evaluateBoard(m.board);
    }
    return moves;
}


// main beam-search logic
function beamSearchAgent(currentPiece, nextPiece, board) {

    // first ply moves
    let level1Moves = getScoredMoves(currentPiece, board);
    if (level1Moves.length === 0) return null;

    // sort by heuristic 
    level1Moves.sort((a, b) => b.score - a.score);

    // beam trimming
    let beam = level1Moves.slice(0, BEAM_WIDTH);

    if (BEAM_DEPTH === 1) {
        return beam[0];
    }

    // depth = 2 lookahead
    let globalBestMove = null;
    let globalBestScore = -Infinity;

    for (let m1 of beam) {

        const boardAfter = m1.board;

        const virtualNextPiece = {
            type: nextPiece.type,
            dir: DIR.UP
        };

        let secondMoves = getScoredMoves(virtualNextPiece, boardAfter);

        // no valid moves for next piece
        if (secondMoves.length === 0) {
            if (m1.score > globalBestScore) {
                globalBestScore = m1.score;
                globalBestMove = m1;
            }
            continue;
        }

        // best next move
        let bestChildScore = -Infinity;
        for (let m2 of secondMoves) {
            if (m2.score > bestChildScore) {
                bestChildScore = m2.score;
            }
        }

        // select parent m1 that leads to best future
        if (bestChildScore > globalBestScore) {
            globalBestScore = bestChildScore;
            globalBestMove = m1;
        }
    }

    return globalBestMove;
}


// integrate into the actual game piece
function beamAgent() {
    const move = beamSearchAgent(current, next, blocks);
    if (!move) return;

    // Move only uses x and dir — y must be recalculated
    current.x   = move.x;
    current.dir = move.piece.dir;

    // important: recalc Y on REAL board
    current.y = getDropPosition(current, current.x, blocks);

    drop();
}
