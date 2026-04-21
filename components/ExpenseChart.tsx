
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
      <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-lg">
        <p className="text-[11px] font-bold text-slate-900 mb-1">{label}</p>
        <p className="text-[11px] font-semibold" style={{ color: payload[0].payload.fill }}>{`₹${payload[0].value.toLocaleString('en-IN')}`}</p>
      </div>
    );
  }
  return null;
};

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Spending Analysis</h2>
        {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
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
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Awaiting records</p>
                    <p className="text-[11px] text-slate-300 mt-1 max-w-[200px]">Data will manifest once transactions are categorized.</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default ExpenseChart;