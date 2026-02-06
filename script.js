document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // Scroll Progress Bar
    // =========================================
    const progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.width = progress + '%';
        }, { passive: true });
    }


    // =========================================
    // Scroll Reveal (IntersectionObserver)
    // =========================================
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback: just show everything
        revealElements.forEach(el => el.classList.add('revealed'));
    }


    // =========================================
    // Navbar scroll effect
    // =========================================
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            // Add a subtle background change when scrolled
            if (currentScroll > 50) {
                navbar.style.background = 'rgba(15, 22, 41, 0.95)';
                navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
            } else {
                navbar.style.background = 'rgba(15, 22, 41, 0.8)';
                navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
            }
            lastScroll = currentScroll;
        }, { passive: true });
    }


    // =========================================
    // Hamburger Menu
    // =========================================
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu-nav');

    if (hamburgerButton && mobileMenu) {
        hamburgerButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            hamburgerButton.classList.toggle('active');
        });

        // Close mobile menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                hamburgerButton.classList.remove('active');
            });
        });

        // Close mobile menu if clicked outside
        document.addEventListener('click', (event) => {
            const isClickInsideMenu = mobileMenu.contains(event.target);
            const isClickOnHamburger = hamburgerButton.contains(event.target);

            if (!isClickInsideMenu && !isClickOnHamburger && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                hamburgerButton.classList.remove('active');
            }
        });
    }


    // =========================================
    // Smooth scrolling for anchor links
    // =========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    hamburgerButton.classList.remove('active');
                }
            }
        });
    });


    // =========================================
    // Tab switching for analysis tool
    // =========================================
    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolPanes = document.querySelectorAll('.tool-pane');
    toolTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            toolTabs.forEach(b => b.classList.remove('active'));
            toolPanes.forEach(pane => pane.classList.remove('active'));
            btn.classList.add('active');
            const tool = btn.getAttribute('data-tool');
            const pane = document.getElementById(tool + '-pane');
            if (pane) pane.classList.add('active');
        });
    });


    // =========================================
    // Tab switching for results
    // =========================================
    const tabButtons = document.querySelectorAll('.nav-button');
    const resultSections = document.querySelectorAll('.result-section');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            resultSections.forEach(section => section.classList.remove('active'));
            btn.classList.add('active');
            const section = btn.getAttribute('data-section');
            const el = document.getElementById(section + '-section');
            if (el) el.classList.add('active');
        });
    });


    // =========================================
    // Upload form logic
    // =========================================
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


    // =========================================
    // Manual entry form logic
    // =========================================
    const manualForm = document.getElementById('manual-form');
    if (manualForm) {
        manualForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const entries = Array.from(document.querySelectorAll('#trade-entries .trade-entry'));
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


    // =========================================
    // Add another trade entry
    // =========================================
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


    // =========================================
    // Fetch and display analysis results
    // =========================================
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


    // =========================================
    // Show and fill the results section
    // =========================================
    function showResultsSection(analysis) {
        const resultsSection = document.getElementById('analysis-results');
        if (!resultsSection) return;
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });

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
                div.innerHTML = `<h4>${insight.category}</h4><p>${insight.insight}</p><p><strong>Action:</strong> ${insight.actionItem}</p>`;
                insightsContainer.appendChild(div);
            });
        }

        // Fill risk profile
        if (analysis.riskProfile) {
            document.getElementById('risk-indicator').querySelector('.risk-text').textContent = analysis.riskProfile.level || 'Medium';
            document.getElementById('max-drawdown').textContent = (analysis.riskProfile.maxDrawdown || 0).toFixed(2) + '%';
            document.getElementById('max-consecutive-losses').textContent = analysis.riskProfile.maxConsecutiveLosses || 0;
            document.getElementById('risk-of-ruin').textContent = analysis.riskProfile.riskOfRuin || 'Low';
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
        if (patterns && typeof patterns === 'object' && !Array.isArray(patterns)) {
            Object.entries(patterns).forEach(([key, value]) => {
                const div = document.createElement('div');
                div.className = 'pattern-item';
                div.innerHTML = `<strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value}`;
                el.appendChild(div);
            });
        } else if (Array.isArray(patterns)) {
            patterns.forEach(pattern => {
                const div = document.createElement('div');
                div.className = 'pattern-item';
                div.textContent = pattern;
                el.appendChild(div);
            });
        }
    }

});
