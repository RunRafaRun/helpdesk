import React from "react";
import * as LucideIcons from "react-icons/lu";
import * as MDIIcons from "react-icons/md";

interface IconProps {
  icon: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export function Icon({ icon, size = 16, className, style, title }: IconProps) {
  if (!icon) return null;

  // Parse icon format: "prefix:icon-name" or just "icon-name" (defaults to lucide)
  let prefix = "lucide";
  let iconName = icon;

  if (icon.includes(":")) {
    [prefix, iconName] = icon.split(":", 2);
  }

  // Select the appropriate icon collection
  let iconCollection: any;
  let prefixChar = "";

  switch (prefix) {
    case "lucide":
      iconCollection = LucideIcons;
      prefixChar = "Lu";
      break;
    case "mdi":
    case "material":
      iconCollection = MDIIcons;
      prefixChar = "Md";
      break;
    default:
      // Default to lucide
      iconCollection = LucideIcons;
      prefixChar = "Lu";
      break;
  }

  // Convert kebab-case to PascalCase with collection-specific mappings
  const convertToIconName = (name: string, collection: string): string => {
    const parts = name.split("-");

    // Handle special cases based on collection
    if (collection === "lucide") {
      const specialMappings: Record<string, string> = {
        "circle-help": "CircleHelp",
        "circle-alert": "CircleAlert",
        "circle-check": "CircleCheck",
        "circle-x": "CircleX",
        "user-check": "UserCheck",
      };

      if (specialMappings[name]) {
        return specialMappings[name];
      }
    }

    // Default conversion: capitalize each part and join
    return parts
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  };

  const componentName = `${prefixChar}${convertToIconName(iconName, prefix)}`;

  // Get the icon component from the selected collection
  const IconComponent = iconCollection[componentName];

  if (!IconComponent) {
    // Fallback: show the icon name if component not found
    return (
      <span
        className={className}
        style={{
          fontSize: size * 0.75,
          color: "var(--muted)",
          ...style
        }}
        title={`Icon not found: ${icon} (${componentName})`}
      >
        {iconName}
      </span>
    );
  }

  return (
    <IconComponent
      size={size}
      className={className}
      style={style}
      title={title}
    />
  );
}