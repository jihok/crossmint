export type Direction = 'up' | 'down' | 'left' | 'right';
export type Color = 'blue' | 'red' | 'purple' | 'white';
type BaseParam = { row: number; column: number };
type Param = BaseParam | (BaseParam & { direction: Direction }) | (BaseParam & { color: Color });

const MAX_RETRIES = 5;

/**
 * Makes a POST request to the Crossmint challenge API with retry logic and exponential backoff.
 *
 * @param route - The API route to post to (e.g., 'polyanets', 'soloons', 'comeths').
 * @param params - The request body parameters, including candidateId, row, column, and any additional properties.
 * @param retries - The current retry attempt (used internally for backoff, default is 0).
 * @returns A promise that resolves when the request succeeds or all retries are exhausted.
 */
export const postWithRetry = async (route: string, params: Param, retries = 0) => {
  try {
    const res = await fetch(`https://challenge.crossmint.io/api/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: process.env.CANDIDATE_ID, ...params }),
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
