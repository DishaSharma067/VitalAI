export function calculateHealthScore(data) {

  let score = 100;

  const heartRate = Number(data?.heartRate || 0);
  const sleep = Number(data?.sleep || 0);
  const water = Number(data?.water || 0);
  const calories = Number(data?.calories || 0);

  // Heart Rate
  if (heartRate > 100 || heartRate < 60) {
    score -= 20;
  }

  // Sleep
  if (sleep < 7) {
    score -= 25;
  }

  // Water
  if (water < 2) {
    score -= 20;
  }

  // Calories
  if (calories < 1800) {
    score -= 15;
  }

  // Prevent negative values
  if (score < 0) {
    score = 0;
  }

  return score;
}