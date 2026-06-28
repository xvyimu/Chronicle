type VercelInsightsEnv = {
  VERCEL?: string;
};

export function shouldRenderVercelInsights(env?: VercelInsightsEnv): boolean {
  return (env?.VERCEL ?? process.env.VERCEL) === '1';
}
