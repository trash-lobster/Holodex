import { useDuration } from "@/hooks/useDuration";
import { formatCount, formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Badge } from "@/shadcn/ui/badge";
import { useTranslation } from "react-i18next";

export function PlayerStats({
  type,
  status,
  topic_id,
  end_actual,
  start_actual,
  duration,
  live_viewers,
}: Pick<
  Video,
  | "id"
  | "type"
  | "status"
  | "topic_id"
  | "start_actual"
  | "end_actual"
  | "duration"
  | "live_viewers"
>) {
  const { t } = useTranslation();
  const durationMs = useDuration({
    type,
    status,
    start_actual,
    end_actual,
    duration,
  });

  return (
    <div className="text-base-11 flex items-center gap-1">
      <Badge variant="outline" className="mr-2 capitalize">
        {topic_id}
      </Badge>
      <span className={cn("font-bold", { "text-red": status === "live" })}>
        {formatDuration(durationMs ?? 0)}
      </span>
      {live_viewers && (
        <>
          <span>/</span>
          <span>
            {t("component.videoCard.watching", {
              0: formatCount(live_viewers),
            })}
          </span>
        </>
      )}
    </div>
  );
}
