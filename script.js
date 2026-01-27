document.addEventListener('DOMContentLoaded', () => {
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu-nav');

    if (hamburgerButton && mobileMenu) {
        hamburgerButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            hamburgerButton.classList.toggle('active'); // Toggle animation class on button
        });

        // Optional: Close mobile menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                 mobileMenu.classList.remove('active');
                 hamburgerButton.classList.remove('active');
            });
        });

        // Optional: Close mobile menu if clicked outside
         document.addEventListener('click', (event) => {
            const isClickInsideMenu = mobileMenu.contains(event.target);
            const isClickOnHamburger = hamburgerButton.contains(event.target);

            if (!isClickInsideMenu && !isClickOnHamburger && mobileMenu.classList.contains('active')) {
                 mobileMenu.classList.remove('active');
                 hamburgerButton.classList.remove('active');
            }
        });
    }

    // Smooth scrolling for anchor links (Optional but nice)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Check if it's just a hash link and not part of the mobile menu toggle logic
            if (this.getAttribute('href') !== '#' && document.querySelector(this.getAttribute('href'))) {
                e.preventDefault();

                const targetElement = document.querySelector(this.getAttribute('href'));
                const headerOffset = 70; // Adjust based on your fixed header height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Tab switching for analysis results
    const navButtons = document.querySelectorAll('.nav-button');
    const resultSections = document.querySelectorAll('.result-section');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            resultSections.forEach(section => section.classList.remove('active'));
            btn.classList.add('active');
            const section = btn.getAttribute('data-section');
            const targetSection = document.getElementById(section + '-section');
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Upload form logic
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('csv-file');
            if (!fileInput.files.length) {
                alert('Please select a file to upload.');
                return;
            }
            const formData = new FormData();
            formData.append('tradingData', fileInput.files[0]);
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success && data.analysisId) {
                    fetchAndDisplayResults(data.analysisId);
                } else {
                    alert(data.error || 'Upload failed.');
                }
            } catch (err) {
                alert('Error uploading file.');
            }
        });
    }

    // Manual entry form logic
    const manualForm = document.getElementById('manual-form');
    if (manualForm) {
        manualForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const entries = Array.from(document.querySelectorAll('#trade-entries .trade-entry'));

            // Validate all entries before submission
            for (const entry of entries) {
                const date = entry.querySelector('input[name="date"]').value;
                const symbol = entry.querySelector('input[name="symbol"]').value;
                const price = parseFloat(entry.querySelector('input[name="price"]').value);
                const size = parseFloat(entry.querySelector('input[name="size"]').value);
                const profit = parseFloat(entry.querySelector('input[name="profit"]').value);

                if (!date || !symbol) {
                    alert('All trades must have a date and symbol.');
                    return;
                }

                if (isNaN(price) || price <= 0) {
                    alert('Price must be a valid positive number.');
                    return;
                }

                if (isNaN(size) || size <= 0) {
                    alert('Size must be a valid positive number.');
                    return;
                }

                if (isNaN(profit)) {
                    alert('Profit/Loss must be a valid number.');
                    return;
                }
            }

            const trades = entries.map(entry => {
                return {
                    date: entry.querySelector('input[name="date"]').value,
                    symbol: entry.querySelector('input[name="symbol"]').value,
                    side: entry.querySelector('select[name="side"]').value,
                    price: entry.querySelector('input[name="price"]').value,
                    size: entry.querySelector('input[name="size"]').value,
                    profit: entry.querySelector('input[name="profit"]').value
                };
            });
            try {
                const response = await fetch('/api/analyze-manual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trades })
                });
                const data = await response.json();
                if (data.success && data.analysisId) {
                    fetchAndDisplayResults(data.analysisId);
                } else {
                    alert(data.error || 'Analysis failed.');
                }
            } catch (err) {
                alert('Error submitting manual trades.');
            }
        });
    }

    // Add another trade entry logic
    const addTradeBtn = document.getElementById('add-trade');
    if (addTradeBtn) {
        addTradeBtn.addEventListener('click', () => {
            const tradeEntries = document.getElementById('trade-entries');
            if (!tradeEntries) return;
            const entry = document.createElement('div');
            entry.className = 'trade-entry';
            entry.innerHTML = `
                <input type="date" name="date" placeholder="Date" required>
                <input type="text" name="symbol" placeholder="Symbol" required>
                <select name="side">
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
                <input type="number" name="price" placeholder="Price" step="0.01" required>
                <input type="number" name="size" placeholder="Size" step="0.01" required>
                <input type="number" name="profit" placeholder="Profit/Loss" step="0.01" required>
            `;
            tradeEntries.appendChild(entry);
        });
    }

    // Fetch and display analysis results
    async function fetchAndDisplayResults(analysisId) {
        try {
            const response = await fetch(`/api/analysis/${analysisId}`);
            const data = await response.json();
            if (data.success && data.analysis) {
                showResultsSection(data.analysis);
            } else {
                alert('Analysis not found.');
            }
        } catch (err) {
            alert('Error fetching analysis results.');
        }
    }

    // Show and fill the results section
    function showResultsSection(analysis) {
        const resultsSection = document.getElementById('analysis-results');
        if (!resultsSection) return;
        resultsSection.classList.remove('hidden');
        // Fill summary metrics
        document.getElementById('total-trades').textContent = analysis.summary.totalTrades;
        document.getElementById('win-rate').textContent = (analysis.summary.winRate || 0).toFixed(2) + '%';
        document.getElementById('profit-factor').textContent = (analysis.summary.profitFactor || 0).toFixed(2);
        document.getElementById('expectancy').textContent = '$' + (analysis.summary.expectancy || 0).toFixed(2);
        document.getElementById('max-drawdown').textContent = (analysis.summary.maxDrawdown || 0).toFixed(2);

        // Fill detailed metrics
        const metricsGrid = document.querySelector('.metrics-grid');
        if (metricsGrid && analysis.performanceMetrics) {
            metricsGrid.innerHTML = '';
            for (const [key, value] of Object.entries(analysis.performanceMetrics)) {
                const metricDiv = document.createElement('div');
                metricDiv.className = 'metric-card';
                metricDiv.innerHTML = `<span class="metric-label">${key.replace(/([A-Z])/g, ' $1')}</span><span class="metric-value">${typeof value === 'number' ? value.toFixed(2) : value}</span>`;
                metricsGrid.appendChild(metricDiv);
            }
        }

        // Fill patterns
        if (analysis.patterns) {
            fillPatternList('time-patterns', analysis.patterns.timePatterns);
            fillPatternList('market-patterns', analysis.patterns.marketPatterns);
            fillPatternList('psychological-patterns', analysis.patterns.psychologicalPatterns);
        }

        // Fill insights
        const insightsContainer = document.getElementById('insights-container');
        if (insightsContainer && analysis.insights) {
            insightsContainer.innerHTML = '';
            analysis.insights.forEach(insight => {
                const div = document.createElement('div');
                div.className = 'insight-item';
                // Handle both string and object insights
                if (typeof insight === 'string') {
                    div.textContent = insight;
                } else if (insight.insight) {
                    div.innerHTML = `<strong>${insight.category || 'Insight'}:</strong> ${insight.insight}<br><em>Action: ${insight.actionItem || 'N/A'}</em>`;
                } else {
                    div.textContent = JSON.stringify(insight);
                }
                insightsContainer.appendChild(div);
            });
        }

        // Fill risk profile
        if (analysis.riskProfile) {
            const riskIndicator = document.getElementById('risk-indicator');
            if (riskIndicator && riskIndicator.querySelector('.risk-text')) {
                riskIndicator.querySelector('.risk-text').textContent = analysis.riskProfile.riskLevel || 'Medium';
            }

            const maxDrawdownEl = document.getElementById('max-drawdown');
            if (maxDrawdownEl) {
                maxDrawdownEl.textContent = (analysis.riskProfile.maxDrawdown || 0).toFixed(2);
            }

            const maxLossesEl = document.getElementById('max-consecutive-losses');
            if (maxLossesEl) {
                maxLossesEl.textContent = analysis.riskProfile.maxConsecutiveLosses || 0;
            }

            const riskRuinEl = document.getElementById('risk-of-ruin');
            if (riskRuinEl) {
                riskRuinEl.textContent = analysis.riskProfile.riskOfRuin || 'Low';
            }

            const suggestionsList = document.getElementById('risk-suggestions-list');
            if (suggestionsList) {
                suggestionsList.innerHTML = '';
                (analysis.riskProfile.suggestions || []).forEach(suggestion => {
                    const li = document.createElement('li');
                    li.textContent = suggestion;
                    suggestionsList.appendChild(li);
                });
            }
        }
    }

    function fillPatternList(elementId, patterns) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = '';
        if (Array.isArray(patterns)) {
            patterns.forEach(pattern => {
                const div = document.createElement('div');
                div.className = 'pattern-item';
                div.textContent = pattern;
                el.appendChild(div);
            });
        } else if (typeof patterns === 'object' && patterns !== null) {
            // Handle object patterns (like time, market, and psychological patterns)
            for (const [key, value] of Object.entries(patterns)) {
                const div = document.createElement('div');
                div.className = 'pattern-item';
                if (Array.isArray(value)) {
                    div.innerHTML = `<strong>${key}:</strong> ${value.join(', ')}`;
                } else {
                    div.innerHTML = `<strong>${key}:</strong> ${value}`;
                }
                el.appendChild(div);
            }
        }
    }

});