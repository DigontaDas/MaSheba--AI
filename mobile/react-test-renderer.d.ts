declare module "react-test-renderer" {
  import * as React from "react";

  export interface ReactTestRenderer {
    root: ReactTestInstance;
    toJSON(): unknown;
    unmount(): void;
    update(element: React.ReactElement): void;
  }

  export interface ReactTestInstance {
    type: unknown;
    props: any;
    children: any;
    findByProps(props: Record<string, unknown>): ReactTestInstance;
    findAllByType(type: unknown): ReactTestInstance[];
    findByType(type: unknown): ReactTestInstance;
  }

  export function act<T>(callback: () => T | Promise<T>): Promise<void> | void;
  export function create(element: React.ReactElement): ReactTestRenderer;

  const renderer: {
    create: typeof create;
  };

  export default renderer;
}