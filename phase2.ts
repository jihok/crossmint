import { postWithRetry } from './utils';
import type { Direction, Color, Route } from './utils';

type DirectionOrColor = { color: Color } | { direction: Direction };
type ParseRequestParamsResult =
  | { route: Route; params: { color: Color } | { direction: Direction } | null }
  | null
  | undefined;

/**
 * Gets goal or throws error if unexpected result
 * @returns goal matrix
 */
const getGoal = async (): Promise<Array<Array<string>> | undefined> => {
  try {
    const res = await fetch(
      `https://challenge.crossmint.io/api/map/${process.env.CANDIDATE_ID}/goal`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.goal) throw new Error('No goal');
    if (!data.goal.length || !data.goal[0].length) {
      throw new Error(`Malformed goal: ${JSON.stringify(data.goal)}`);
    }

    return data.goal;
  } catch (err) {
    console.error('Error:', err);
  }
};

/**
 * Parses the content value at a given slot in the goal matrix and determines the appropriate
 * API route and parameters for making a request to the Crossmint challenge API.
 *
 * @param content - The string value at a given slot in the matrix (e.g., 'SPACE', 'POLYANET', 'RED_SOLOON', 'UP_COMETH').
 * @returns An object containing the API route and parameters if applicable, or null if the content is 'SPACE'.
 *          Note: will return undefined and not throw an error if the content is unrecognized or invalid.
 */
const parseRequestParams = (content: string): ParseRequestParamsResult => {
  if (content === 'SPACE') {
    return null;
  }

  if (content === 'POLYANET') {
    return { route: 'polyanets', params: null };
  }

  if (content.includes('_')) {
    const parts = content.split('_');

    let route: Route | undefined;
    if (parts[1] === 'COMETH') {
      route = 'comeths';
    } else if (parts[1] === 'SOLOON') {
      route = 'soloons';
    }

    if (route) {
      let params: DirectionOrColor | undefined;
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
  if (!goal) throw new Error('Goal matrix could not be retrieved.');

  const numRows = goal.length;
  const numCols = goal[0].length;

  for (let row = 0; row < numRows; row += 1) {
    for (let column = 0; column < numCols; column += 1) {
      const parsedParams = parseRequestParams(goal[row][column]);
      if (parsedParams) {
        const { route, params } = parsedParams;
        await postWithRetry(route, { row, column, ...params });
      }
    }
  }
};

phase2();
