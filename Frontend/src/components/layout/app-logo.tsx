import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_LOGO_SRC } from "@/lib/constants";

interface AppLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function AppLogo({ size = 36, className, priority = false }: AppLogoProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-black shadow-sm",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={APP_LOGO_SRC}
        alt="Universidad Mariano Galvez"
        width={size}
        height={size}
        className="h-full w-full object-cover"
        priority={priority}
      />
    </div>
  );
}
