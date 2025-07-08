export type Direction = 'up' | 'down' | 'left' | 'right';
export type Color = 'blue' | 'red' | 'purple' | 'white';
type Param = {
  row: number;
  column: number;
  direction?: Direction;
  color?: Color;
};

export const postWithRetry = async (route: string, params: Param, retries = 0) => {
  const MAX_RETRIES = 5;
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
