'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { color: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="glass rounded-xl border border-[#1e2d45] px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="text-sm font-medium text-[#F8FAFC]">{item.name}</span>
        <span className="text-sm text-[#64748B]">{item.value}</span>
      </div>
    </div>
  );
}

export function StatusDonut({ data }: { data: StatusDistribution[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#64748B]">
        No hypotheses yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with mini bars */}
      <div className="flex flex-col gap-3 flex-1">
        {data.map((item) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <div key={item.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[#94A3B8]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-[#F8FAFC]">
                    {item.value}
                  </span>
                  <span className="text-xs text-[#64748B]">{pct}%</span>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[#1e2d45]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
