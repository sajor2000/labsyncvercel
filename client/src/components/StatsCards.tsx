import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Users, CheckSquare, Calendar } from "lucide-react";

const stats = [
  {
    title: "Active Studies",
    value: "12",
    change: "+2 this month",
    icon: FlaskConical,
    color: "text-primary",
  },
  {
    title: "Team Members",
    value: "24",
    change: "+3 new",
    icon: Users,
    color: "text-green-600 dark:text-green-400",
  },
  {
    title: "Completed Tasks",
    value: "89",
    change: "+12 today",
    icon: CheckSquare,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    title: "Upcoming Standups",
    value: "5",
    change: "This week",
    icon: Calendar,
    color: "text-orange-600 dark:text-orange-400",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}