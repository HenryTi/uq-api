import { $UqDbContainer } from "./$UqDbContainer";

export class SpanLog {
    private logger: DbLogger
    private readonly _log: string;
    readonly tick: number;
    tries: number;
    error: string;
    private _ms: number;
    constructor(logger: DbLogger, log: string) {
        this.logger = logger;
        if (log) {
            if (log.length > 2048) log = log.substring(0, 2048);
        }
        this._log = log;
        this.tick = Date.now();
        this.tries = 0;
    }

    close() {
        this._ms = Date.now() - this.tick;
        this.logger.add(this);
    }

    get ms() { return this._ms }
    get log(): string {
        if (this.error !== undefined) {
            return `${this._log} RETRY:${this.tries} ERR:${this.error}`;
        }
        if (this.tries > 0) {
            return `${this._log} RETRY:${this.tries}`;
        }
        return this._log;
    }
}

const tSep = '\r';
const nSep = '\r\r';
export class DbLogger {
    // private db: Db;
    private readonly $uqDb: $UqDbContainer;
    private minSpan: number; // 10ms
    private tick: number = Date.now();
    private spans: SpanLog[] = [];

    constructor($uqDb: $UqDbContainer, minSpan: number = 0) {
        this.minSpan = minSpan;
        this.$uqDb = $uqDb;
    }

    async open(log: string): Promise<SpanLog> {
        return new SpanLog(this, log);
    }

    add(span: SpanLog) {
        let { ms: count, log } = span;
        if (count >= this.minSpan) {
            this.spans.push(span);
        }
        let len = this.spans.length;
        if (len === 0) return;
        let tick = Date.now();
        if (len > 10 || tick - this.tick > 10 * 1000) {
            this.tick = tick;
            let spans = this.spans;
            this.spans = [];
            this.save(spans);
        }
    }

    private save(spans: SpanLog[]): void {
        for (let span of spans) {
            let now = Date.now();
            let { log, tick, ms } = span;
            if (ms === undefined || ms < 0 || ms > 1000000) {
                debugger;
            }
            if (tick > now || tick < now - 1000000) {
                //debugger;
            }
            this.$uqDb.logPerformance(tick, log, ms);
        }
    }
}
