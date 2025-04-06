import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: "primary" | "orange" | "yellow" | "mint";
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  const getColorClasses = (color: string): { bg: string; text: string } => {
    switch (color) {
      case "primary":
        return { bg: "bg-primary-100", text: "text-primary-600" };
      case "orange":
        return { bg: "bg-orange-100", text: "text-orange-500" };
      case "yellow":
        return { bg: "bg-amber-100", text: "text-amber-500" };
      case "mint":
        return { bg: "bg-lime-100", text: "text-lime-600" };
      default:
        return { bg: "bg-primary-100", text: "text-primary-600" };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 ${colorClasses.bg} rounded-lg`}>
          <div className={`text-xl ${colorClasses.text}`}>
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          <p className="text-2xl font-semibold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
