"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const Charts = ({
  data: { salesData },
}: {
  data: {
    salesData: {
      month: string;
      totalSales: number;
    }[];
  };
}) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={salesData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis
          dataKey="month"
          stroke="#0d0b36"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#0d0b36"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₱${value}`}
        />
        <Bar
          dataKey="totalSales"
          fill="#8884d8"
          barSize={30}
          radius={[4, 4, 0, 0]}
          //   className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Charts;
