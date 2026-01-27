require('dotenv').config();
const Stripe = require('stripe');

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static('./'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
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

// Store analysis results for demo purposes (in production, use a database)
let analysisResults = {};

// Routes
app.post('/api/upload', upload.single('tradingData'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let results = [];
    let responseHandled = false;

    if (ext === '.csv') {
      // Parse CSV file
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          if (responseHandled) return;
          responseHandled = true;
          try {
            const analysisResult = performAIAnalysis(results);
            const analysisId = Date.now().toString();
            analysisResults[analysisId] = analysisResult;
            res.json({
              success: true,
              message: 'File uploaded and processed successfully',
              analysisId: analysisId
            });
          } catch (analysisError) {
            res.status(500).json({ error: 'Analysis failed: ' + analysisError.message });
          } finally {
            // Clean up uploaded file
            fs.unlink(filePath, (err) => {
              if (err) console.error('Error deleting file:', err);
            });
          }
        })
        .on('error', (streamError) => {
          if (responseHandled) return;
          responseHandled = true;
          res.status(400).json({ error: 'Failed to parse CSV: ' + streamError.message });
          // Clean up uploaded file
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      return;
    } else if (ext === '.pdf') {
      try {
        // Parse PDF file
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        // Try to extract tables from the text (very basic, expects CSV-like tables)
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

        // Process the trading data with AI analysis
        const analysisResult = performAIAnalysis(results);
        const analysisId = Date.now().toString();
        analysisResults[analysisId] = analysisResult;
        res.json({
          success: true,
          message: 'File uploaded and processed successfully',
          analysisId: analysisId
        });
      } finally {
        // Clean up uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
    } else if (ext === '.doc' || ext === '.docx') {
      try {
        // Parse Word file
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

        // Process the trading data with AI analysis
        const analysisResult = performAIAnalysis(results);
        const analysisId = Date.now().toString();
        analysisResults[analysisId] = analysisResult;
        res.json({
          success: true,
          message: 'File uploaded and processed successfully',
          analysisId: analysisId
        });
      } finally {
        // Clean up uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    // Clean up uploaded file if exists
    if (fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  }
});

app.post('/api/analyze-manual', (req, res) => {
  try {
    const { trades } = req.body;
    
    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'No trading data provided' });
    }
    
    // Process the manually entered trading data
    const analysisResult = performAIAnalysis(trades);
    
    // Store the results with a unique ID
    const analysisId = Date.now().toString();
    analysisResults[analysisId] = analysisResult;
    
    res.json({ 
      success: true, 
      analysisId: analysisId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/:id', (req, res) => {
  const analysisId = req.params.id;
  
  if (!analysisResults[analysisId]) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  
  res.json({
    success: true,
    analysis: analysisResults[analysisId]
  });
});

// AI Analysis function (mock implementation with realistic trading metrics)
function performAIAnalysis(tradingData) {
  // Validate and clean the data
  const cleanedData = cleanTradingData(tradingData);
  
  // Calculate basic performance metrics
  const performanceMetrics = calculatePerformanceMetrics(cleanedData);
  
  // Identify trading patterns
  const patterns = identifyTradingPatterns(cleanedData);
  
  // Generate actionable insights
  const insights = generateInsights(cleanedData, performanceMetrics, patterns);
  
  // Create risk profile
  const riskProfile = analyzeRiskProfile(cleanedData);
  
  // Return comprehensive analysis results
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

// Helper functions for AI analysis
function cleanTradingData(tradingData) {
  // In a real implementation, this would validate and normalize data
  // For now, just return the data with some basic validation
  return tradingData.filter(trade => {
    // Check for required fields
    return trade.date && (trade.profit !== undefined || trade.result !== undefined);
  });
}

function calculatePerformanceMetrics(trades) {
  // Calculate win/loss counts
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
  
  // Calculate key metrics
  const winRate = wins / (wins + losses) * 100;
  const profitFactor = totalProfit / (totalLoss || 1); // Avoid division by zero
  
  const averageWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, profit) => sum + profit, 0) / winningTrades.length 
    : 0;
    
  const averageLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, loss) => sum + loss, 0) / losingTrades.length 
    : 0;
  
  const expectancy = ((winRate / 100) * averageWin) - ((1 - winRate / 100) * averageLoss);
  
  // Calculate max drawdown (simplified calculation)
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
  // Simple max drawdown calculation (in real app, would be more sophisticated)
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
  // This function would use AI to identify patterns in real implementation
  // For demo purposes, we'll provide some realistic patterns
  
  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  // Analyze time-based patterns
  const timePatterns = analyzeTimePatterns(sortedTrades);
  
  // Analyze market conditions
  const marketPatterns = analyzeMarketPatterns(sortedTrades);
  
  // Analyze psychological patterns
  const psychologicalPatterns = analyzePsychologicalPatterns(sortedTrades);
  
  return {
    timePatterns,
    marketPatterns,
    psychologicalPatterns
  };
}

function analyzeTimePatterns(trades) {
  // Mock time-based pattern analysis
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
  // Mock market condition pattern analysis
  return {
    performanceInVolatility: "Above average returns in high volatility",
    trendFollowing: "70% win rate when trading with the trend",
    counterTrend: "30% win rate when trading against the trend",
    gapTrading: "Mixed results - strong on gap up, weak on gap down",
    keyLevels: ["Strong performance near major support/resistance", "Poor performance in mid-range"]
  };
}

function analyzePsychologicalPatterns(trades) {
  // Mock psychological pattern analysis
  return {
    recoveryTrades: "Tendency to take larger risks after losses (revenge trading)",
    profitTaking: "Often exits winning trades too early",
    lossCutting: "Inconsistent in cutting losses - sometimes too early, sometimes too late",
    positionSizing: "Increases size on losing trades, decreases on winning trades",
    overtrading: "Signs of overtrading on high-volatility days"
  };
}

function generateInsights(trades, metrics, patterns) {
  // Generate AI insights based on the analysis
  // In a real implementation, this would be an AI-driven component
  
  const insights = [];
  
  // Performance insights
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
  
  // Pattern insights
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
  
  // Add default insights if none were generated
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
  // Create a risk profile based on the trading data
  // This would be AI-driven in a real implementation
  
  // Calculate position sizes relative to account size (mock calculation)
  const positionSizes = trades.map(trade => parseFloat(trade.size || "1"));
  const averagePositionSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
  const maxPositionSize = Math.max(...positionSizes);
  
  // Analyze consecutive losses
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
  // Simplified risk of ruin calculation (would be more sophisticated in real app)
  const metrics = calculatePerformanceMetrics(trades);
  
  // Basic risk of ruin formula (simplified)
  const winProbability = metrics.winRate / 100;
  const lossProbability = 1 - winProbability;
  const riskRewardRatio = metrics.averageLoss / metrics.averageWin;
  
  if (winProbability <= 0.5) {
    return "High";
  } else if (winProbability > 0.5 && winProbability < 0.6) {
    return "Medium";
  } else {
    return "Low";
  }
}

// Stripe Checkout endpoints
app.get('/api/stripe-test', async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    res.json({ success: true, balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/create-checkout-session/report', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Trading Report (One-Time)',
            },
            unit_amount: 2000, // $20.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/thankyou.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/create-checkout-session/subscription', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1RLkrvFHOW0K7xmh50RPMD4H',
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/thankyou.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export for Vercel serverless environment
module.exports = app;

// Start the server locally (not in Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}