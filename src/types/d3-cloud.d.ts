declare module "d3-cloud" {
  interface Word {
    text: string;
    size: number;
    x?: number;
    y?: number;
    rotate?: number;
    angle?: number;
    style?: string;
    fontWeight?: string;
    origin?: [number, number];
  }

  interface Layout {
    size(): [number, number];
    size(value: [number, number]): Layout;
    words(): Word[];
    words(value: Word[]): Layout;
    padding(): number;
    padding(value: number): Layout;
    rotate(): ((word: Word) => number) | (() => number);
    rotate(value: ((word: Word) => number) | (() => number)): Layout;
    font(): string;
    font(value: string): Layout;
    fontSize(): (word: Word) => number;
    fontSize(value: (word: Word) => number): Layout;
    spiral():
      | "archimedean"
      | "rectangular"
      | ((size: [number, number], t: number) => [number, number]);
    spiral(
      value:
        | "archimedean"
        | "rectangular"
        | ((size: [number, number], t: number) => [number, number]),
    ): Layout;
    on(event: "end", callback: (words: Word[], layout: Layout) => void): Layout;
    on(event: "word", callback: (word: Word) => void): Layout;
    start(): void;
    stop(): void;
  }

  class Layout {
    size(): [number, number];
    size(value: [number, number]): Layout;
    words(): Word[];
    words(value: Word[]): Layout;
    padding(): number;
    padding(value: number): Layout;
    rotate(): ((word: Word) => number) | (() => number);
    rotate(value: ((word: Word) => number) | (() => number)): Layout;
    font(): string;
    font(value: string): Layout;
    fontSize(): (word: Word) => number;
    fontSize(value: (word: Word) => number): Layout;
    spiral():
      | "archimedean"
      | "rectangular"
      | ((size: [number, number], t: number) => [number, number]);
    spiral(
      value:
        | "archimedean"
        | "rectangular"
        | ((size: [number, number], t: number) => [number, number]),
    ): Layout;
    on(event: "end", callback: (words: Word[], layout: Layout) => void): Layout;
    on(event: "word", callback: (word: Word) => void): Layout;
    start(): void;
    stop(): void;
  }

  export default Layout;
}
