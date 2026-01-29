# TradeAnalyticsAI - AI-Powered Trading Analytics Platform

A modern SaaS application that helps traders analyze their trading performance, identify patterns, and receive actionable insights powered by artificial intelligence.

## Features

- **Deep Performance Analysis**: Win rate, profit factor, expectancy, maximum drawdown, and more
- **AI-Driven Insights**: Pattern recognition and psychological trading pattern analysis
- **Multi-Format Support**: Upload trading data in CSV, PDF, or Word format
- **Manual Trade Entry**: Enter trades manually for quick analysis
- **Risk Profile Analysis**: Assess your trading risk, consecutive losses, and risk of ruin
- **Stripe Integration**: Secure payment processing ($20 per report or $100/month subscription)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Prerequisites

- Node.js v14 or higher
- npm or yarn
- Stripe account (for payment processing)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd tradeanalytics
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and add your Stripe API key:

```bash
cp .env.example .env
```

Then edit `.env` and add your Stripe secret key:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
PORT=3000
```

Get your Stripe secret key from: https://dashboard.stripe.com/apikeys

### 4. Start the application

For development (with auto-reload):

```bash
npm run dev
```

For production:

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### For Customers

1. **Purchase a Report**:
   - Navigate to the pricing section
   - Choose between pay-per-report ($20) or subscription ($100/month)
   - Complete checkout with Stripe

2. **Analyze Your Trades**:
   - Upload a CSV, PDF, or Word file with your trading data, or
   - Manually enter your trades one by one

3. **Review Analysis**:
   - View your trading metrics (win rate, profit factor, expectancy)
   - Explore identified trading patterns
   - Read AI-generated insights and suggestions
   - Check your risk profile and recommendations

### File Format Requirements

Your trading data file should include the following columns:

| Column | Format | Example |
|--------|--------|---------|
| Date | YYYY-MM-DD | 2024-01-15 |
| Symbol | Text | AAPL, EURUSD |
| Side | Buy/Sell | Buy |
| Price | Number | 150.25 |
| Size | Number | 100 |
| Profit/Loss | Number | 500.00 |

**CSV Example**:
```
date,symbol,side,price,size,profit
2024-01-15,AAPL,Buy,150.25,100,250.50
2024-01-16,EURUSD,Sell,1.0950,10000,-500.00
```

## API Endpoints

### File Upload
- **POST** `/api/upload`
- **Body**: multipart/form-data with `tradingData` file
- **Response**: `{ success: true, analysisId: "..." }`

### Manual Trade Analysis
- **POST** `/api/analyze-manual`
- **Body**: `{ trades: [{date, symbol, side, price, size, profit}, ...] }`
- **Response**: `{ success: true, analysisId: "..." }`

### Get Analysis Results
- **GET** `/api/analysis/:id`
- **Response**: `{ success: true, analysis: {...} }`

### Stripe Checkout (One-Time Report)
- **POST** `/api/create-checkout-session/report`
- **Response**: `{ url: "checkout_session_url" }`

### Stripe Checkout (Subscription)
- **POST** `/api/create-checkout-session/subscription`
- **Response**: `{ url: "checkout_session_url" }`

## Project Structure

```
tradeanalytics/
├── server.js              # Express backend with API endpoints
├── index.html             # Landing page
├── thankyou.html          # Post-purchase analysis page
├── script.js              # Frontend JavaScript
├── style.css              # Frontend styling
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── .gitignore             # Git exclusions
├── uploads/               # Uploaded trading data files
├── images/                # Static images and charts
└── README.md              # This file
```

## Technology Stack

### Backend
- **Express.js** - Web framework
- **Multer** - File upload handling
- **Stripe** - Payment processing
- **csv-parser** - CSV file parsing
- **pdf-parse** - PDF file parsing
- **Mammoth** - Word document parsing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5/CSS3** - Responsive design
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## Security Considerations

⚠️ **Important**: This application handles sensitive trading data. For production deployment:

1. **Secure Stripe Keys**: Never commit `.env` files with real API keys
2. **HTTPS Only**: Deploy behind HTTPS to encrypt data in transit
3. **Database Security**: Currently uses in-memory storage (not persistent). For production, implement proper database with encryption
4. **Data Retention**: Uploaded files are automatically deleted after processing
5. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
6. **Input Validation**: All user inputs are validated on both client and server

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Ensure `.env` file exists in the root directory
- Verify `STRIPE_SECRET_KEY` is set with a valid Stripe secret key
- Restart the server after updating `.env`

### "No recognizable table found in PDF/Word"
- Ensure your file contains columns: date, symbol, side, price, size, profit
- The parser looks for headers containing "date" and "symbol"
- Try converting to CSV format if parsing fails

### Files not uploading
- Check file size is reasonable (< 10MB recommended)
- Ensure file format is CSV, PDF, or Word (.doc, .docx)
- Check browser console for detailed error messages

## Development Notes

- Analysis results are stored in-memory during the current session
- For production, implement persistent storage (database)
- The AI insights are template-based; real ML implementation would improve accuracy
- File uploads are cleaned up after successful processing

## Support

For issues, bug reports, or feature requests, please create an issue in the repository.

## License

Proprietary - TradeAnalyticsAI. All rights reserved.

---

**Disclaimer**: Trading involves substantial risk. Past performance is not indicative of future results. TradeAnalyticsAI provides analysis tools, not financial advice. Always consult with a qualified financial advisor before making trading decisions.
