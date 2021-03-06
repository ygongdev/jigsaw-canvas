/**
 * 1. Get rows and columns
 * 2. For each piece, get a smaller square piece
 * 3. For each smaller square piece, draw hole or hill via bezier curve
 * 4. store that piece somewhere 
*/

// Try to draw bezier curve on given image
const JIGSAW_SHAPE = Object.freeze({
	TAB: 0,
  SLOT: 1,
  STRAIGHT: 2,
})

class Piece { 
  shape;
  containerWidth;
  containerHeight;
  width;
  height;
  row;
  col;
  imageSrc;

  get widthPercentage() {
    return this.width / this.containerWidth;
  }

  get heightPercentage() {
    return this.height / this.containerHeight;
  }

  constructor(shape) {
  	this.shape = shape;
  }
}

/**
* How to draw 1 square.
* If edge is at boundary draw a straight line
* If not at boundary since we're going left -> right and top bottom
* we draw left side complementary to the right side if any
* we draw right side freely
* we draw top side complementary to the bottom side if any
* we draw bottom side freely
* clip and save as a piece
* Shift path to new starting point (top left) and draw again
*
* Adjust the bezier curve generation to dynamic sizes
*/
export async function generatePuzzle(img, rows, columns) {
  const canvas = document.createElement('canvas');

  const puzzlePieces = [];
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const pieceWidth = img.width / columns;
  const pieceHeight = img.height / rows;
  const scalarWidth = pieceWidth / 100;
  const scalarHeight = pieceHeight / 100;
  const lowPeak = 8.75;
  const highPeak = 20;
  const newCanvasWidth = pieceWidth + lowPeak*scalarHeight + highPeak*scalarHeight;
  const newCanvasHeight = pieceHeight + lowPeak*scalarWidth + highPeak*scalarWidth;

  const puzzle = [];
  // generate a 2D array of uninitialized values
  for (let i = 0; i < rows; i++) {
  	const newRow = [];
  	for (let j  = 0; j < columns; j++) {
    	newRow.push(null)
    }
    puzzle.push(newRow);
  }
  
  let globalX = 0;
  let globalY = 0;
  context.beginPath();
  /**
   * get the source image coordinates and clip the new small canvas object with bezier curves.
   */
  for (let i = 0; i < rows; i++) {
  	globalX = 0;
    for (let j = 0; j < columns; j++) {

    	const piece = new Piece();
      piece.width = pieceWidth;
      piece.height = pieceHeight;
      piece.row = i;
      piece.col = j;
      piece.containerWidth = newCanvasWidth;
      piece.containerHeight = newCanvasHeight;
      const shape = {};
      const newCanvas = document.createElement('canvas');
      newCanvas.width = newCanvasWidth;
      newCanvas.height = newCanvasHeight;
      const newCanvasCtx = newCanvas.getContext('2d');
      let x = j <= 0 ? 0 : (lowPeak*scalarHeight);
      let y = i <= 0 ? 0 : (highPeak*scalarWidth);
    	// If edge = straight,
      // If has initialized neighbor, build complementary
      // If uninitilzied neighbor build whatever
    	// Build top

      if (i === 0) {
      	shape.TOP = JIGSAW_SHAPE.STRAIGHT;
      } else {
      	const topNeighbor = puzzle[i-1][j];
        if (topNeighbor) {
        	shape.TOP = topNeighbor.shape.BOTTOM;
        } else {
        	shape.TOP = JIGSAW_SHAPE.SLOT;
        }
      }
      // Build bottom
      if (i === rows-1) {
      	shape.BOTTOM = JIGSAW_SHAPE.STRAIGHT;
      } else {
        // Since we build left -> right, top -> bottom, no bottom neighbor yet.
        shape.RIGHT = JIGSAW_SHAPE.SLOT;
      }
      // Build left
      if (j === 0) {
      	shape.LEFT = JIGSAW_SHAPE.STRAIGHT;
      } else {
        const leftNeighbor = puzzle[i][j-1];
        if (leftNeighbor) {
        	shape.LEFT = leftNeighbor.shape.RIGHT;
        } else {
        	shape.LEFT = JIGSAW_SHAPE.SLOT;
        }
      }
      // Build right
      if (j === columns-1) {
      	shape.RIGHT = JIGSAW_SHAPE.STRAIGHT;
      } else {
      	shape.RIGHT = JIGSAW_SHAPE.SLOT;
      }
      piece.shape = shape;
      
      const curves = makeBeziers();
      // Horiztonal curve creation
      const hCurves = createScalarCurves(curves, piece.width / 100);
      // Vertical curve creation
      const vCurves = createScalarCurves(curves, piece.height / 100);
      
      // Draw left -> right, top -> down, right -> left, down -> top
      newCanvasCtx.moveTo(x, y);
      // Draw top left -> top right
      if (shape.TOP === JIGSAW_SHAPE.STRAIGHT) {
        newCanvasCtx.lineTo(x+piece.width, y);
      } else {
        for (let ii = 0; ii < hCurves.length; ii++) {
          const bi = hCurves[ii];
          newCanvasCtx.bezierCurveTo(x+bi.cx1, y+bi.cy1, x+bi.cx2, y+bi.cy2, x+bi.ex, y+bi.ey);
        }
      }
      
      x = x+piece.width;
      
      // Draw top right -> bottom right
      if (shape.RIGHT === JIGSAW_SHAPE.STRAIGHT) {
      	newCanvasCtx.lineTo(x, y+piece.height);
      } else {
        // At top right, need to draw curve downwards.
        const dy = y + piece.height;
        // Right slot, rotate (x,y) = (-y,x)
        for (let ii = 0; ii < vCurves.length; ii++) {
          const bi = vCurves[ii];
          newCanvasCtx.bezierCurveTo(x-bi.cy1, y+bi.cx1, x-bi.cy2, y+bi.cx2, x-bi.ey, y+bi.ex);
        }

      }
      
      y = y+piece.height;
      
      // Draw bottom right -> bottom left
      if (shape.BOTTOM === JIGSAW_SHAPE.STRAIGHT) {
      	newCanvasCtx.lineTo(x-piece.width, y);
      } else {
        for (let ii = 0; ii < hCurves.length; ii++) {
          const bi = hCurves[ii];
          newCanvasCtx.bezierCurveTo(x-bi.cx1, y+bi.cy1, x-bi.cx2, y+bi.cy2, x-bi.ex, y+bi.ey);
        }
      }
      
      x = x-piece.width;
      
      // Draw bottom left -> top left
      if (shape.LEFT === JIGSAW_SHAPE.STRAIGHT) {
      	newCanvasCtx.lineTo(x, y-piece.height);
      } else {
        // Right slot, (x,y) = (-y,x), subtract delta y, which is x
        for (let ii = 0; ii < vCurves.length; ii++) {
          const bi = vCurves[ii];
          newCanvasCtx.bezierCurveTo(x-bi.cy1, y-bi.cx1, x-bi.cy2, y-bi.cx2, x-bi.ey, y-bi.ex);
        }
      }
       
      puzzle[i][j] = piece;

      // clip this and make a new <canvas> draggable element.
      newCanvasCtx.stroke();
      newCanvasCtx.clip();
      newCanvasCtx.drawImage(
        img,
        globalX-(lowPeak*scalarHeight) < 0 ? 0 : globalX-(lowPeak*scalarHeight),
        globalY-(highPeak*scalarWidth) < 0 ? 0: globalY-(highPeak*scalarWidth),
        newCanvas.width,
        newCanvas.height,
        0,
        0,
        newCanvas.width,
        newCanvas.height
      );
      
      piece.imageSrc = newCanvas.toDataURL();
      puzzlePieces.push(piece);
      // move to top right corner which will be the new top left for the next piece.
      globalX += piece.width;
    }
    globalY += pieceHeight;
  }

  return puzzlePieces;
}

function createScalarCurves(curve, scalar) {
	return curve.map(e => {
    return  {
      cx1: e.cx1*scalar,  cy1: e.cy1*scalar,  cx2:e.cx2*scalar,cy2:e.cy2*scalar, ex:e.ex*scalar, ey:e.ey*scalar
    }
  })
}

// slot
function makeBeziers() {
  return([
    {cx1:0,  cy1:0,  cx2:35,cy2:15, ex:37, ey:5},   // left shoulder
    {cx1:37, cy1:5,  cx2:40,cy2:0,  ex:38, ey:-5},  // left neck
    {cx1:38, cy1:-5, cx2:20,cy2:-20,ex:50, ey:-20}, // left head
    {cx1:50, cy1:-20,cx2:80,cy2:-20,ex:62, ey:-5},  // right head
    {cx1:62, cy1:-5, cx2:60,cy2:0,  ex:63, ey:5},   // right neck
    {cx1:63, cy1:5,  cx2:65,cy2:15, ex:100,ey:0},   // right shoulder
  ]);
 }
 
// tab, flip left neck, left head, right head and right neck y
function makeTab() {
  return([
    {cx1:0,  cy1:0,  cx2:35,cy2:-15, ex:37, ey:-5},   // left shoulder
    {cx1:37, cy1:-5,  cx2:40,cy2:0,  ex:38, ey:5},  // left neck
    {cx1:38, cy1:5, cx2:20,cy2:20,ex:50, ey:20}, // left head
    {cx1:50, cy1:20,cx2:80,cy2:20,ex:62, ey:5},  // right head
    {cx1:62, cy1:5, cx2:60,cy2:0,  ex:63, ey:-5},   // right neck
    {cx1:63, cy1:-5,  cx2:65,cy2:-15, ex:100,ey:0},   // right shoulder
  ]);
}

//https://en.wikipedia.org/wiki/B%C3%A9zier_curve
function calcPeakY(cx0, cy0, cx1, cy1, ex, ey) {
  const mid_t = 0.5;

  return cy1 + ((1-mid_t)**2)*(cy0-cy1) + (mid_t**2)*(ey-cy1); 
}
