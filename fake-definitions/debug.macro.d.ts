interface Debug {
    (...args: any[]): void;
    vars(...args: any[]): void;
    var(...args: any[]): void;
    allInScope(): void;
    all(): void;
}

declare const debug: Debug;

export default debug;