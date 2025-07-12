import { MultiViewBackground } from "@/components/multiview/background";
import { ToolBar } from "@/components/multiview/toolbar/ToolBar";
import { ToolButton } from "@/components/multiview/toolbar/ToolButton";
import {
  multiViewPanelOpenAtom,
  openMultiViewPanelAtom,
} from "@/hooks/useFrame";
import { cn } from "@/lib/utils";
import { mdiChevronDown } from "@mdi/js";
import { useAtomValue, useSetAtom } from "jotai";
import { Helmet } from "react-helmet-async";

// multiview skeleton
// selection bar at the top to change between orgs and allow url insertion
// grid page for drag and drop

export function Multiview() {
  const isBarActive = useAtomValue(multiViewPanelOpenAtom);
  const openPanel = useSetAtom(openMultiViewPanelAtom);

  return (
    <>
      <Helmet>
        <title>Multiview - Holodex</title>
      </Helmet>
      <div id="multiview">
        <div className="relative flex h-full w-full flex-col">
          <ToolBar />
          <ToolButton
            className={cn(
              "right-2 top-0 z-20 rounded-none bg-base-2 p-1 transition-all md:px-5",
              "absolute",
              isBarActive ? "hidden" : "visible",
            )}
            icon={{
              path: mdiChevronDown,
              tooltip: "Open Panel",
              onClick: openPanel,
            }}
          />
        </div>
        <MultiViewBackground
          columnWidth={120}
          rowHeight={90}
          showTips={true}
          collapseToolbar={!isBarActive}
        />
      </div>
    </>
  );
}
