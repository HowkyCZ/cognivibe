import { heroui } from "@heroui/react";

// Color shades are generated from:
// https://www.tints.dev/palette/v1:cHJpbWFyeXxBMDdDRUZ8NjAwfHB8MHwwfDEwMHwwfG1-c2Vjb25kYXJ5fDVjNmRmZHw2MDB8cHwwfDB8MTAwfDB8bX5kYW5nZXJ8ZmY3MDlifDYwMHxwfDB8MHwxMDB8MHxtfnN1Y2Nlc3N8MzVFMDU3fDUwMHxwfDB8MHwxMDB8MHxtfndhcm5pbmd8ZjljZjU4fDUwMHxwfDB8MHwxMDB8MHxt// The color 950 is ignored
// In dark theme the colors are inversed, the 950 is ignored

export default heroui({
  themes: {
    dark: {
      colors: {
        // Core brand surfaces
        background: "#19141C", // primary app background
        foreground: "#FFFFFF", // primary text
        content1: "#221D28", // surfaces: cards/containers
        content2: "#272130",
        content3: "#2C2538",
        content4: "#322A40",
        divider: "#343037",

        // Neutral scale (used by `bg-default-*`, inputs, subtle surfaces, etc.)
        default: {
          50: "#19141C",
          100: "#221D28",
          200: "#2A2432",
          300: "#332C3B",
          400: "#3C3444",
          500: "#463D50",
          600: "#5A5165",
          700: "#7B7487",
          800: "#A39EAD",
          900: "#E6E4EA",
          DEFAULT: "#2A2432",
          foreground: "#FFFFFF",
        },
        primary: {
          50: "#180535",
          100: "#250A4C",
          200: "#3F1679",
          300: "#5A23A9",
          400: "#7730DC",
          500: "#8C58EA",
          600: "#A07CEF",
          700: "#B69EF3",
          800: "#CDBEF7",
          900: "#E5DFFB",
          foreground: "#19141C", // text on top of primary fills
          DEFAULT: "#A07CEF", // exact accent
        },
        secondary: {
          50: "#000738",
          100: "#010F54",
          200: "#021C7D",
          300: "#052AAE",
          400: "#093AE1",
          500: "#2E4FFC",
          600: "#5C78FD",
          700: "#8892FE",
          800: "#B1B6FE",
          900: "#D8DAFF",
          DEFAULT: "#5C78FD", // exact accent
          foreground: "#19141C",
        },
        danger: {
          50: "#2B000F",
          100: "#43001B",
          200: "#6E0031",
          300: "#9C0048",
          400: "#CD0061",
          500: "#FF0A7C",
          600: "#FF709B",
          700: "#FF97B2",
          800: "#FFBDCD",
          900: "#FFDDE4",
          DEFAULT: "#FF709B", // exact accent
          foreground: "#19141C",
        },
        success: {
          50: "#021D05",
          100: "#042F0C",
          200: "#0F581D",
          300: "#1A812F",
          400: "#27AF42",
          500: "#35E057",
          600: "#39ED5C",
          700: "#3CFA62",
          800: "#9EFEA9",
          900: "#D4FED8",
          DEFAULT: "#35E057", // Default 500 success
          foreground: "#EBFFEC", // 950
        },
        warning: {
          50: "#1E1704",
          100: "#33290B",
          200: "#604E1C",
          300: "#90772F",
          400: "#C4A243",
          500: "#F9CF58",
          600: "#FAD98E",
          700: "#FBE3B1",
          800: "#FCECCE",
          900: "#FEF6E8",
          DEFAULT: "#F9CF58", // Default 500 warning
          foreground: "#FEF9F0", // 950
        },
        focus: "#A07CEF",
      },
    },
  },
});
