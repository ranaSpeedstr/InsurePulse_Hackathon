import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BenchmarkData {
  client: string;
  nps: number;
  retention: number;
  supportScore: number;
}

interface ClientBenchmarkingProps {
  data: BenchmarkData[];
}

export default function ClientBenchmarking({ data }: ClientBenchmarkingProps) {
  return (
    <Card data-testid="card-client-benchmarking">
      <CardHeader>
        <CardTitle>Client Benchmarking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="client" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))"
                }}
              />
              <Legend />
              <Bar dataKey="nps" fill="hsl(var(--chart-1))" name="NPS" radius={[2, 2, 0, 0]} />
              <Bar dataKey="retention" fill="hsl(var(--chart-2))" name="Retention" radius={[2, 2, 0, 0]} />
              <Bar dataKey="supportScore" fill="hsl(var(--chart-4))" name="Support Score" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}