import { usePreferredName } from "@/store/settings";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { cn, makeThumbnailUrl } from "@/lib/utils";
import { MemoizedLiveChannelTooltipContentCard } from "./LiveChannelTooltipContentCard";
import { compareTimeDiffToNow } from "@/lib/time";
import Icon from "@mdi/react";
import { mdiTwitch } from "@mdi/js";
import { Badge } from "@/shadcn/ui/badge";

interface LiveChannelProps {
  video: VideoBase & {
    platform: string;
  };
}

export function LiveChannel({ video }: LiveChannelProps) {
  const preferredName = usePreferredName({
    name: video.channel.name,
    english_name: video.channel.english_name,
  });

  const thumbnail = makeThumbnailUrl(video.id, "sm");

  // TODO: move live stream info card outside of this components
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div draggable="true" className="relative cursor-pointer">
            <Avatar className="size-12">
              <AvatarImage
                src={video.channel.photo}
                alt={`${preferredName} user icon`}
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Badge
              className={cn(
                "absolute bottom-0 right-0 h-4 rounded-sm p-0.5 text-xs text-white",
                video.status === "live" ? "bg-red" : "bg-slate-10",
              )}
            >
              {video.status === "live"
                ? compareTimeDiffToNow(video.start_actual)
                : compareTimeDiffToNow(video.start_scheduled)}
            </Badge>
            {video.platform === "twitch" && (
              <Badge
                className={cn(
                  "absolute bottom-0 left-0 h-4 rounded-sm bg-purple p-0.5 text-xs text-white",
                )}
              >
                <Icon path={mdiTwitch} size={0.6} />
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="mt-2 w-[250px] rounded-md bg-slate-4 px-4 py-2"
        >
          <MemoizedLiveChannelTooltipContentCard
            video={video}
            thumbnail={thumbnail}
            preferredName={preferredName}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
