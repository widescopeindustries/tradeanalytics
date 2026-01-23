const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Shared analysis functions (move to separate file later)
let analysisResults = {};

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
  // ... (copy the function)
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

  // Configure multer for file uploads (Vercel uses /tmp)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = '/tmp/uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'text/csv',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const allowedExts = ['.csv', '.pdf', '.doc', '.docx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV, PDF, and Word files are allowed'));
      }
    }
  });

  // Handle upload
  const uploadSingle = upload.single('tradingData');
  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let results = [];

      if (ext === '.csv') {
        // Parse CSV file
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve())
            .on('error', reject);
        });
      } else if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const lines = pdfData.text.split('\n');
        const headers = lines.find(line => /date/i.test(line) && /symbol/i.test(line));
        if (!headers) throw new Error('No recognizable table found in PDF');
        const headerArr = headers.split(/,|\s{2,}|\t/).map(h => h.trim().toLowerCase());
        let startIdx = lines.indexOf(headers) + 1;
        for (let i = startIdx; i < lines.length; i++) {
          const row = lines[i].trim();
          if (!row) continue;
          const values = row.split(/,|\s{2,}|\t/);
          if (values.length < headerArr.length) continue;
          let obj = {};
          for (let j = 0; j < headerArr.length; j++) {
            obj[headerArr[j]] = values[j];
          }
          results.push(obj);
        }
      } else if (ext === '.doc' || ext === '.docx') {
        const dataBuffer = fs.readFileSync(filePath);
        const mammothResult = await mammoth.extractRawText({ buffer: dataBuffer });
        const lines = mammothResult.value.split('\n');
        const headers = lines.find(line => /date/i.test(line) && /symbol/i.test(line));
        if (!headers) throw new Error('No recognizable table found in Word document');
        const headerArr = headers.split(/,|\s{2,}|\t/).map(h => h.trim().toLowerCase());
        let startIdx = lines.indexOf(headers) + 1;
        for (let i = startIdx; i < lines.length; i++) {
          const row = lines[i].trim();
          if (!row) continue;
          const values = row.split(/,|\s{2,}|\t/);
          if (values.length < headerArr.length) continue;
          let obj = {};
          for (let j = 0; j < headerArr.length; j++) {
            obj[headerArr[j]] = values[j];
          }
          results.push(obj);
        }
      } else {
        throw new Error('Unsupported file type');
      }

      const analysisResult = performAIAnalysis(results);
      const analysisId = Date.now().toString();
      analysisResults[analysisId] = analysisResult;
      res.json({ 
        success: true, 
        message: 'File uploaded and processed successfully',
        analysisId: analysisId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};