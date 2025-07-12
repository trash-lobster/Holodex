import { MultiViewIcon, ToolButton } from "./ToolButton";

export function ToolButtonContainer({ icons }: { icons: MultiViewIcon[] }) {
  return (
    <div className="flex flex-row items-center justify-center gap-1 rounded-lg ">
      {icons.map((icon, index) => (
        <ToolButton key={index} icon={icon} index={`${icon.tooltip}-button`} />
      ))}
    </div>
  );
}
