
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCategoryColor } from '../utils/colorUtils';

interface ChartData {
  name: string;
  total: number;
}

interface ExpenseChartProps {
  data: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-800">{label}</p>
        <p style={{ color: payload[0].payload.fill }}>{`Total: ₹${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
      <h2 className="text-2xl font-semibold text-slate-700 mb-6 border-b pb-3">Spending by Category</h2>
        {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {data.map((entry) => {
                        const color = getCategoryColor(entry.name);
                        return <Cell key={`cell-${entry.name}`} fill={color.hex} />;
                    })}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-[300px] flex items-center justify-center text-center">
                <div>
                    <p className="text-slate-500">No data to display yet.</p>
                    <p className="text-sm text-slate-400">Your spending chart will appear here once you categorize expenses.</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default ExpenseChart;