import { cn } from "@/lib/cn";
import {
  getMaintenanceUrgencyLabel,
  getMaintenanceUrgencyTone,
} from "@/lib/maintenance";

type MaintenanceUrgencyBadgeProps = {
  urgencyLevel: number;
};

export function MaintenanceUrgencyBadge({
  urgencyLevel,
}: MaintenanceUrgencyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        getMaintenanceUrgencyTone(urgencyLevel),
      )}
    >
      {getMaintenanceUrgencyLabel(urgencyLevel)}
    </span>
  );
}
