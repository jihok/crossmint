const CANDIDATE_ID = process.env.CANDIDATE_ID;
const MAX_RETRIES = 5;
const NUM_ROWS = 11;
const NUM_COLS = 11;

const postWithRetry = async (route, params, retries = 0) => {
  try {
    const res = await fetch(`https://challenge.crossmint.io/api/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: CANDIDATE_ID, ...params }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`Success: ${JSON.stringify(params)}`, data);
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const delay = Math.pow(2, retries) * 1000 + Math.random() * 500; // jitter
      console.warn(
        `Retry ${retries + 1} for ${JSON.stringify(params)} after ${delay.toFixed(0)}ms`
      );
      await new Promise((res) => setTimeout(res, delay));
      return postWithRetry(route, params, retries + 1);
    } else {
      console.error(`Failed after ${MAX_RETRIES} retries: ${JSON.stringify(params)}`, err);
    }
  }
};

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
// phase1();

const getGoal = async () => {
  try {
    const res = await fetch(`https://challenge.crossmint.io/api/map/${CANDIDATE_ID}/goal`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(data);
    return data.goal;
  } catch (err) {
    console.error('Error:', err);
  }
};
// getGoal();

const parseRequestParams = (content) => {
  if (content === 'SPACE') {
    return null;
  }

  if (content === 'POLYANET') {
    return { route: 'polyanets' };
  }

  if (content.includes('_')) {
    const parts = content.split('_');

    let route;
    if (parts[1] === 'COMETH') {
      route = 'comeths';
    } else if (parts[1] === 'SOLOON') {
      route = 'soloons';
    }

    if (route) {
      let params;
      const possibleParam = parts[0].toLowerCase();
      if (
        route === 'comeths' &&
        (possibleParam === 'left' ||
          possibleParam === 'right' ||
          possibleParam === 'up' ||
          possibleParam === 'down')
      ) {
        params = { direction: possibleParam };
      } else if (
        route === 'soloons' &&
        (possibleParam === 'blue' ||
          possibleParam === 'red' ||
          possibleParam === 'purple' ||
          possibleParam === 'white')
      ) {
        params = { color: possibleParam };
      }

      if (params) {
        return {
          route,
          params,
        };
      }

      console.warn(`Unknown params in content: ${content}`);
    }
  }

  console.warn(`Unknown content: ${content}`);
};

const phase2 = async () => {
  const goal = await getGoal();
  const numRows = goal.length;
  const numCols = goal[0].length;

  for (let row = 0; row < numRows; row += 1) {
    for (let column = 0; column < numCols; column += 1) {
      const requestParams = parseRequestParams(goal[row][column]);
      const route = requestParams?.route;
      const params = requestParams?.params;
      console.log(`row: ${row}`, `col: ${column}`, `content: ${goal[row][column]}`, route, params);
      if (route) {
        await postWithRetry(route, { row, column, ...params });
      }
    }
  }
};
phase2();
