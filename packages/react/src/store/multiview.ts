import { indicatePageFullscreenAtom } from "@/hooks/useFrame";
import {
  Cell,
  ChatCell,
  ChatCellStatus,
  MultiviewCells,
  PlaceholderCell,
  VideoCell,
} from "@/types/multiview";
import { atom, useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { nanoid } from "nanoid";

export const isMultiViewFullscreenAtom = atom(!!document.fullscreenElement);

export function useMultiViewFullScreen() {
  const [isFullScreen, setIsFullScreen] = useAtom(isMultiViewFullscreenAtom);
  const indicatePageFullscreen = useSetAtom(indicatePageFullscreenAtom);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      indicatePageFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [setIsFullScreen, indicatePageFullscreen]);

  const toggleFullScreen = () => {
    const multiviewElement = document.getElementById("multiview");
    if (multiviewElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        multiviewElement.requestFullscreen();
      }
    }
  };

  return {
    isFullScreen,
    toggleFullScreen,
  };
}

// TODO: read from memory
export const multiviewCellsAtom = atom<MultiviewCells>({ cells: [] });
multiviewCellsAtom.debugLabel = "multiviewCellsAtom";
export const isAutoLayoutAtom = atom(false);

// updating the cell order here means that we will see a re-render of the cells whenever it is moved
export const readMultiviewCellsAtom = atom((get) => get(multiviewCellsAtom));

export const removeMultiviewCellAtom = atom(
  null,
  (get, set, cellId: string) => {
    const curr = get(readMultiviewCellsAtom);
    set(multiviewCellsAtom, {
      cells: calculateLayout(curr.cells.filter((cell) => cell.i !== cellId)),
    });
  },
);

export const clearMultiviewCellsAtom = atom(null, (_, set) => {
  set(multiviewCellsAtom, { cells: [] });
});

export const setCellsAtom = atom(null, (_, set, cells: Cell[]) => {
  set(multiviewCellsAtom, { cells: cells });
});

/**
 * Registers a new video cell in the multiview layout.
 * New cell is assigned a unique ID
 * This also take into account of any reordering that has been done to the cells and write to state
 * This is so that when recalculating the default layout, we respect the reordering
 * Due to an issue with React-Player not firing off events after the video cells have been moved and new cells are added,
 * we have to re-render all the cells that are inbetween the cells that were moved.
 * The way we have landed on doing that is by reassiging a new UUID to those affected cells
 * So that the video components will re-render due to a key change (UUID is part of the component key)
 */
export const registerVideoCellAtom = atom(
  null,
  (get, set, video: VideoBase) => {
    const curr = get(readMultiviewCellsAtom);
    const copy = [...curr.cells];
    copy.sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    let shouldUpdate = false;
    curr.cells.forEach((cell, i) => {
      if (cell.i !== copy[i].i) {
        shouldUpdate = !shouldUpdate;
        copy[i].uuid = nanoid(8);
      } else if (shouldUpdate) {
        copy[i].uuid = nanoid(8);
      }
    });

    copy.push({
      i: `video_${video.id}`,
      type: "video",
      video: video,
      x: 0,
      y: 0,
      uuid: nanoid(8),
      w: 1,
      h: 1,
    });

    set(setCellsAtom, calculateLayout(copy));
  },
);

// recalculate the default layout of the cells
export function calculateLayout(cells: Cell[]) {
  const numberOfCells = cells.length;
  const rows = Math.floor(Math.sqrt(numberOfCells));
  const cols = Math.ceil(numberOfCells / rows);

  // Calculate grid units (each cell should span equal portions of the 24x24 grid)
  const cellWidth = Math.floor(24 / cols);
  const cellHeight = Math.floor(24 / rows);

  const arrangedCells: Cell[] = [];

  for (let i = 0; i < numberOfCells; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const newPosition = {
      x: col * cellWidth,
      y: row * cellHeight,
      w: cellWidth,
      h: cellHeight,
    };

    arrangedCells.push({
      ...cells[i],
      ...newPosition,
    });
  }
  return arrangedCells;
}

export const removeVideoCellAtom = atom(null, (_, set, videoId: string) => {
  set(removeMultiviewCellAtom, `video_${videoId}`);
});

export const updateCellStateAtom = atom(
  null,
  (
    get,
    set,
    { cellId, updates }: { cellId: string; updates: Partial<Cell> },
  ) => {
    const curr = get(readMultiviewCellsAtom);
    const cellExists = curr.cells.some((cell) => cell.i === cellId);

    if (!cellExists) {
      console.warn(`Cell with id ${cellId} not found`);
      return;
    }

    set(multiviewCellsAtom, {
      cells: curr.cells.map((cell) => {
        if (cell.i !== cellId) return cell;
        // Only allow updates that are valid for the specific cell type
        if (
          cell.type === "video" &&
          (!updates.type || updates.type === "video")
        ) {
          return { ...cell, ...(updates as Partial<VideoCell>) };
        }
        if (
          cell.type === "chat" &&
          (!updates.type || updates.type === "chat")
        ) {
          return { ...cell, ...(updates as Partial<ChatCell>) };
        }
        if (
          cell.type === "placeholder" &&
          (!updates.type || updates.type === "placeholder")
        ) {
          return { ...cell, ...(updates as Partial<PlaceholderCell>) };
        }
        return cell;
      }),
    });
  },
);

export const updateCellPositionAtom = atom(
  null,
  (
    get,
    set,
    cellId: string,
    updates: Partial<Pick<Cell, "x" | "y" | "h" | "w">>,
  ) => {
    const curr = get(readMultiviewCellsAtom);
    const targetCellIndex = curr.cells.findIndex((cell) => cell.i === cellId);

    if (targetCellIndex === -1) {
      console.warn(`Cell with id ${cellId} not found`);
      return;
    }

    const targetCell = curr.cells[targetCellIndex];

    // Check if any values actually changed
    const hasChanges = Object.keys(updates).some((key) => {
      const updateKey = key as keyof typeof updates;
      return (
        updates[updateKey] !== undefined &&
        targetCell[updateKey] !== updates[updateKey]
      );
    });

    if (!hasChanges) {
      console.log(`Cell with id ${cellId} has no changes to apply`);
      return;
    }

    // Create new array with only the changed cell replaced
    const newCells = [...curr.cells];
    newCells[targetCellIndex] = {
      ...targetCell,
      ...updates,
    };

    set(multiviewCellsAtom, {
      cells: newCells,
    });
  },
);

export const updateCellStatusAtom = atom(
  null,
  (_, set, { cellId, status }: { cellId: string; status: ChatCellStatus }) => {
    set(updateCellStateAtom, { cellId, updates: { status } });
  },
);

const mutateCellTypesAtom = atom(
  null,
  (get, set, { cellId, newCell }: { cellId: string; newCell: Cell }) => {
    // find in the array of cells the cell with the given cell id
    const curr = get(readMultiviewCellsAtom);
    const cell = curr.cells.find((cell) => cell.i === cellId);
    if (!cell) {
      console.warn(`Cell with id ${cellId} not found`);
      return;
    }

    set(multiviewCellsAtom, {
      cells: curr.cells.map((cell) =>
        cell.i === cellId
          ? {
              ...newCell,
              x: cell.x ?? 0,
              y: cell.y ?? 0,
              h: cell.h ?? 1,
              w: cell.w ?? 1,
            }
          : cell,
      ),
    });
  },
);

export const mutateVideoToPlaceholderAtom = atom(
  null,
  (_, set, videoId: string) => {
    const id = cleanMultiviewCellId(videoId);
    const newPlaceholderCell: PlaceholderCell = {
      i: `placeholder_${id}`,
      uuid: nanoid(8),
      type: "placeholder",
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };
    set(mutateCellTypesAtom, {
      cellId: `video_${id}`,
      newCell: newPlaceholderCell,
    });
  },
);

export const mutatePlaceholderToOtherCellAtom = atom(
  null,
  (_, set, { cellId, newCell }: { cellId: string; newCell: Cell }) => {
    const id = cleanMultiviewCellId(cellId);
    set(mutateCellTypesAtom, {
      cellId: `placeholder_${id}`,
      newCell: {
        ...newCell,
        i: `${newCell.type}_${id}`, // Ensure the new cell has the correct prefix
      },
    });
  },
);

export function cleanMultiviewCellId(id: string): string {
  // remove placeholder, video and chat prefixes
  if (id.startsWith("placeholder_")) return id.replace("placeholder_", "");
  if (id.startsWith("chat_")) return id.replace("chat_", "");
  return id.startsWith("video_") ? id.replace("video_", "") : id;
}

// function to manage cell layout
