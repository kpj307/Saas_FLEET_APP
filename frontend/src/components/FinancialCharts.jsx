
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function formatUGX(value) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "UGX 0";
  }

  return `UGX ${amount.toLocaleString("en-UG", {
    maximumFractionDigits: 0,
  })}`;
}

function FinancialCharts({ data = [] }) {
  const chartData = data.map((item) => ({
    ...item,
    income: Number(item.income ?? 0),
    expenses: Number(item.expenses ?? 0),
    net_income: Number(item.net_income ?? 0),
  }));

  if (chartData.length === 0) {
    return (
      <div className="financial-chart-empty">
        <p>No monthly financial data is available yet.</p>
      </div>
    );
  }

  const tooltipFormatter = (value) => formatUGX(value);

  return (
    <div className="financial-charts-grid">
      <section className="financial-chart-card">
        <div className="financial-chart-heading">
          <h3>Monthly Income vs Expenses</h3>
          <p>Compare income earned with expenses recorded.</p>
        </div>

        <div className="financial-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 12, left: 12, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                minTickGap={15}
              />
              <YAxis
                tickFormatter={(value) =>
                  value.toLocaleString("en-UG")
                }
                tick={{ fontSize: 11 }}
                width={75}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="financial-chart-card">
        <div className="financial-chart-heading">
          <h3>Monthly Net Income</h3>
          <p>Income minus general expenses, by month.</p>
        </div>

        <div className="financial-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 12, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                minTickGap={15}
              />
              <YAxis
                tickFormatter={(value) =>
                  value.toLocaleString("en-UG")
                }
                tick={{ fontSize: 11 }}
                width={75}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line
                type="monotone"
                dataKey="net_income"
                name="Net Income"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default FinancialCharts;