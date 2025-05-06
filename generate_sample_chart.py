import matplotlib.pyplot as plt
import numpy as np
import os

# Create images directory if it doesn't exist
os.makedirs('images', exist_ok=True)

# Simulate equity curve data
np.random.seed(42)
trades = 100
equity = np.cumsum(np.random.normal(loc=0.5, scale=2, size=trades)) + 100
drawdown = np.maximum.accumulate(equity) - equity

fig, ax1 = plt.subplots(figsize=(8, 4.5))

# Plot equity curve
ax1.plot(equity, color='#2563eb', linewidth=2.5, label='Equity Curve')
ax1.fill_between(range(trades), equity, color='#2563eb', alpha=0.08)
ax1.set_ylabel('Equity ($)', color='#2563eb', fontsize=11)
ax1.set_xlabel('Trade Number', fontsize=11)
ax1.tick_params(axis='y', labelcolor='#2563eb')
ax1.grid(alpha=0.2)

# Plot drawdown on secondary axis
ax2 = ax1.twinx()
ax2.plot(drawdown, color='#ef4444', linestyle='--', linewidth=1.5, label='Drawdown')
ax2.set_ylabel('Drawdown ($)', color='#ef4444', fontsize=11)
ax2.tick_params(axis='y', labelcolor='#ef4444')

# Title and legend
fig.suptitle('Sample Trading Performance', fontsize=15, fontweight='bold')
lines, labels = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines + lines2, labels + labels2, loc='upper left', fontsize=10)

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig('images/sample-report-chart.png', dpi=150)
plt.close()
print('Chart saved as images/sample-report-chart.png')
