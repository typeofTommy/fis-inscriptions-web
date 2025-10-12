declare module "react-world-flags" {
  import { ComponentType, CSSProperties } from "react";

  interface FlagProps {
    code: string;
    fallback?: ComponentType;
    height?: number | string;
    width?: number | string;
    className?: string;
    style?: CSSProperties;
  }

  const Flag: ComponentType<FlagProps>;
  export default Flag;
}
