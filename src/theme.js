import { extendTheme } from "@chakra-ui/react";

const fonts = {
  heading: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
  body: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
};

const styles = {
  global: {
    "html, body, #root": {
      height: "100%",
    },
    body: {
      bg: "gray.50",
      color: "gray.800",
    },
  },
};

const components = {
  Container: {
    baseStyle: {
      maxW: "container.lg",
      px: 4,
    },
  },
  Button: {
    baseStyle: {
      borderRadius: "md",
      fontWeight: 600,
    },
  },
};

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const customTheme = extendTheme({ config, fonts, styles, components });
export default customTheme;
