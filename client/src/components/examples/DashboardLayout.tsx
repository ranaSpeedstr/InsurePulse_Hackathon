import DashboardLayout from '../DashboardLayout';

export default function DashboardLayoutExample() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">Sample Content 1</h3>
            <p className="text-muted-foreground">This is where dashboard content would go.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">Sample Content 2</h3>
            <p className="text-muted-foreground">Navigation is functional with active states.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">Sample Content 3</h3>
            <p className="text-muted-foreground">Sidebar toggle and settings button work.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}