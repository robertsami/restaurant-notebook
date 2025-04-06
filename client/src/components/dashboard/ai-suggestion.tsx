import { Star } from "lucide-react";

interface AiSuggestionProps {
  name: string;
  cuisine: string;
  rating: string;
  reason: string;
}

export default function AiSuggestion({ name, cuisine, rating, reason }: AiSuggestionProps) {
  return (
    <div className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
      <div className="flex justify-between">
        <h4 className="text-sm font-medium text-neutral-900">{name}</h4>
        <div className="flex items-center text-amber-400 text-xs">
          <Star className="h-3 w-3 fill-current" />
          <span className="ml-1">{rating}</span>
        </div>
      </div>
      <p className="text-xs text-neutral-500 mt-1">{cuisine} • {reason}</p>
    </div>
  );
}
