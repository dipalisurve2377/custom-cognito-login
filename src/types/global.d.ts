declare module "process" {
  const process: any;
  export default process;
}

declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: typeof Buffer;
    process: any;
  }
}
