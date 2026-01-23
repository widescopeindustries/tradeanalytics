let analysisResults = {};

// Vercel serverless function
module.exports = async (req, res) => {
  const { id } = req.query;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!analysisResults[id]) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json({
    success: true,
    analysis: analysisResults[id]
  });
};