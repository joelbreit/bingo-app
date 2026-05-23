import { Rocket, Lightbulb, Star } from "lucide-react";

const MAP = { new: Rocket, partial: Lightbulb, knew: Star };

export default function RateIcon({ id, size = 16, className = "", strokeWidth = 2 }) {
  const Icon = MAP[id];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
