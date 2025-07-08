import { postWithRetry } from './utils';

const NUM_ROWS = 11;
const NUM_COLS = 11;

const phase1 = async () => {
  for (let row = 0; row < NUM_ROWS; row += 1) {
    for (let column = 0; column < NUM_COLS; column += 1) {
      const isEdge = row < 2 || row >= NUM_ROWS - 2;
      if (!isEdge) {
        if (row === column || row + column === 10) {
          await postWithRetry('polyanets', { row, column });
        }
      }
    }
  }
};

phase1();
