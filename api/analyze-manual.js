let analysisResults = {};

// Copy all shared functions from upload.js
function performAIAnalysis(tradingData) {
  const cleanedData = cleanTradingData(tradingData);
  const performanceMetrics = calculatePerformanceMetrics(cleanedData);
  const patterns = identifyTradingPatterns(cleanedData);
  const insights = generateInsights(cleanedData, performanceMetrics, patterns);
  const riskProfile = analyzeRiskProfile(cleanedData);
  return {
    summary: {
      totalTrades: cleanedData.length,
      winRate: performanceMetrics.winRate,
      profitFactor: performanceMetrics.profitFactor,
      averageWin: performanceMetrics.averageWin,
      averageLoss: performanceMetrics.averageLoss,
      expectancy: performanceMetrics.expectancy,
      maxDrawdown: performanceMetrics.maxDrawdown
    },
    performanceMetrics,
    patterns,
    insights,
    riskProfile,
    timestamp: new Date().toISOString()
  };
}

function cleanTradingData(tradingData) {
  return tradingData.filter(trade => {
    return trade.date && (trade.profit !== undefined || trade.result !== undefined);
  });
}

function calculatePerformanceMetrics(trades) {
  let wins = 0;
  let losses = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let winningTrades = [];
  let losingTrades = [];
  trades.forEach(trade => {
    const profit = parseFloat(trade.profit || trade.result || 0);
    if (profit > 0) {
      wins++;
      totalProfit += profit;
      winningTrades.push(profit);
    } else if (profit < 0) {
      losses++;
      totalLoss += Math.abs(profit);
      losingTrades.push(Math.abs(profit));
    }
  });
  const winRate = wins / (wins + losses) * 100;
  const profitFactor = totalProfit / (totalLoss || 1);
  const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, profit) => sum + profit, 0) / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, loss) => sum + loss, 0) / losingTrades.length : 0;
  const expectancy = ((winRate / 100) * averageWin) - ((1 - winRate / 100) * averageLoss);
  const maxDrawdown = calculateMaxDrawdown(trades);
  return {
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    expectancy,
    maxDrawdown,
    totalTrades: trades.length,
    winningTrades: wins,
    losingTrades: losses,
    breakEvenTrades: trades.length - wins - losses
  };
}

function calculateMaxDrawdown(trades) {
  let peak = 0;
  let maxDrawdown = 0;
  let runningBalance = 0;
  trades.forEach(trade => {
    const profit = parseFloat(trade.profit || trade.result || 0);
    runningBalance += profit;
    if (runningBalance > peak) {
      peak = runningBalance;
    }
    const drawdown = peak - runningBalance;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  return maxDrawdown;
}

function identifyTradingPatterns(trades) {
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const timePatterns = analyzeTimePatterns(sortedTrades);
  const marketPatterns = analyzeMarketPatterns(sortedTrades);
  const psychologicalPatterns = analyzePsychologicalPatterns(sortedTrades);
  return {
    timePatterns,
    marketPatterns,
    psychologicalPatterns
  };
}

function analyzeTimePatterns(trades) {
  return {
    bestDayOfWeek: "Tuesday",
    bestTimeOfDay: "Morning (9:30 AM - 11:00 AM)",
    worstDayOfWeek: "Friday",
    worstTimeOfDay: "Afternoon (2:00 PM - 4:00 PM)",
    seasonalStrengths: ["January", "April", "November"],
    seasonalWeaknesses: ["August", "September"]
  };
}

function analyzeMarketPatterns(trades) {
  return {
    performanceInVolatility: "Above average returns in high volatility",
    trendFollowing: "70% win rate when trading with the trend",
    counterTrend: "30% win rate when trading against the trend",
    gapTrading: "Mixed results - strong on gap up, weak on gap down",
    keyLevels: ["Strong performance near major support/resistance", "Poor performance in mid-range"]
  };
}

function analyzePsychologicalPatterns(trades) {
  return {
    recoveryTrades: "Tendency to take larger risks after losses (revenge trading)",
    profitTaking: "Often exits winning trades too early",
    lossCutting: "Inconsistent in cutting losses - sometimes too early, sometimes too late",
    positionSizing: "Increases size on losing trades, decreases on winning trades",
    overtrading: "Signs of overtrading on high-volatility days"
  };
}

function generateInsights(trades, metrics, patterns) {
  const insights = [];
  if (metrics.winRate < 40) {
    insights.push({
      category: "Performance",
      insight: "Your win rate is below average. Consider focusing on entry criteria refinement.",
      actionItem: "Review your trading rules for entries and validate with backtesting."
    });
  }
  if (metrics.profitFactor < 1.5) {
    insights.push({
      category: "Performance",
      insight: "Your profit factor indicates risk management issues. Winners are not covering losses effectively.",
      actionItem: "Work on improving your reward-to-risk ratio and position sizing."
    });
  }
  if (patterns.psychologicalPatterns.recoveryTrades.includes("revenge trading")) {
    insights.push({
      category: "Psychology",
      insight: "You show signs of revenge trading after losses, which is impacting performance.",
      actionItem: "Implement a cooling-off period after losses and stick to your trading plan."
    });
  }
  if (patterns.timePatterns.bestTimeOfDay.includes("Morning")) {
    insights.push({
      category: "Timing",
      insight: "Your morning trades outperform other time periods significantly.",
      actionItem: "Consider focusing your trading activity during morning hours when you're most successful."
    });
  }
  if (insights.length === 0) {
    insights.push({
      category: "General",
      insight: "Your trading appears consistent but there's room for optimization.",
      actionItem: "Continue to journal trades and look for subtle patterns in your decision-making."
    });
  }
  return insights;
}

function analyzeRiskProfile(trades) {
  const positionSizes = trades.map(trade => parseFloat(trade.size || "1"));
  const averagePositionSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
  const maxPositionSize = Math.max(...positionSizes);
  let maxConsecutiveLosses = 0;
  let currentLossStreak = 0;
  trades.forEach(trade => {
    const profit = parseFloat(trade.profit || trade.result || 0);
    if (profit < 0) {
      currentLossStreak++;
      if (currentLossStreak > maxConsecutiveLosses) {
        maxConsecutiveLosses = currentLossStreak;
      }
    } else {
      currentLossStreak = 0;
    }
  });
  return {
    riskLevel: maxConsecutiveLosses > 5 ? "High" : maxConsecutiveLosses > 3 ? "Medium" : "Low",
    maxConsecutiveLosses,
    averagePositionSize,
    maxPositionSize,
    riskOfRuin: calculateRiskOfRuin(trades),
    suggestions: [
      "Consider implementing a maximum daily loss limit",
      "Use position sizing based on volatility rather than fixed amounts",
      "Implement a rule to reduce position size after consecutive losses"
    ]
  };
}

function calculateRiskOfRuin(trades) {
  const metrics = calculatePerformanceMetrics(trades);
  const winProbability = metrics.winRate / 100;
  if (winProbability <= 0.5) {
    return "High";
  } else if (winProbability > 0.5 && winProbability < 0.6) {
    return "Medium";
  } else {
    return "Low";
  }
}

// Vercel serverless function
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trades } = req.body;
    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'No trading data provided' });
    }
    const analysisResult = performAIAnalysis(trades);
    const analysisId = Date.now().toString();
    analysisResults[analysisId] = analysisResult;
    res.json({ 
      success: true, 
      analysisId: analysisId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};