import { heroui } from "@heroui/react";

// Color shades are generated from:
// https://www.tints.dev/palette/v1:cHJpbWFyeXxBMDdDRUZ8NjAwfHB8MHwwfDEwMHwwfG1-c2Vjb25kYXJ5fDVjNmRmZHw2MDB8cHwwfDB8MTAwfDB8bX5kYW5nZXJ8ZmY3MDlifDYwMHxwfDB8MHwxMDB8MHxtfnN1Y2Nlc3N8MzVFMDU3fDUwMHxwfDB8MHwxMDB8MHxtfndhcm5pbmd8ZjljZjU4fDUwMHxwfDB8MHwxMDB8MHxt// The color 950 is ignored
// In dark theme the colors are inversed, the 950 is ignored

export default heroui({
  themes: {
    dark: {
      colors: {
        background: "#1B063A",
        foreground: "#f0e7ff",
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
          foreground: "#EBE5FC", // Text color to use ON TOP of primary colors, value of 900
          DEFAULT: "#8C58EA", // Default 500 primary
        },
        secondary: {
          50: "#000738",
          100: "#010F54",
          200: "#021C7D",
          300: "#052AAE",
          400: "#093AE1",
          500: "#2E4FFC",
          600: "#5C6DFD",
          700: "#8892FE",
          800: "#B1B6FE",
          900: "#D8DAFF",
          DEFAULT: "#2E4FFC", // Default 500 secondary
          foreground: "#D8DAFF", // Text color to use ON TOP of secondary colors, value of 900
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
          DEFAULT: "#FF0A7C", // Default 500 danger
          foreground: "#FFDDE4", // Text color to use ON TOP of danger colors,
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
          foreground: "#D4FED8", // Text color to use ON TOP of success colors
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
          foreground: "#FEF6E8", // Text color to use ON TOP of warning
        },
        focus: "#A07CEF", // 600 from primary
      },
    },
  },
});
