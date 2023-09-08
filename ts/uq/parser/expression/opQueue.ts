import { OpQueue, OpQueueAction, Queue, ValueExpression } from "../../il";
import { PElement } from "../element";
import { PContext } from "../pContext";
import { Space } from "../space";
import { Token } from "../tokens";

export class POpQueue extends PElement {
    private queueName: string;
    private readonly opQueue: OpQueue;
    constructor(opQueue: OpQueue, context: PContext) {
        super(opQueue, context);
        this.opQueue = opQueue;
    }
    _parse() {
        if (this.ts.token !== Token.VAR) {
            this.ts.expectToken(Token.VAR);
        }
        this.queueName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            let ix = new ValueExpression();
            ix.parser(this.context).parse();
            this.opQueue.ix = ix;
        }
        if (this.ts.token !== Token.VAR) {
            this.ts.expectToken(Token.VAR);
        }
        const expectHasWaitDone = 'key word has, wait or done';
        if (this.ts.varBrace === true) {
            this.ts.expect(expectHasWaitDone);
        }
        switch (this.ts.lowerVar) {
            default: this.ts.expect(expectHasWaitDone); break;
            case 'has': this.opQueue.action = OpQueueAction.has; break;
            case 'wait': this.opQueue.action = OpQueueAction.wait; break;
            case 'done': this.opQueue.action = OpQueueAction.done; break;
        }
        this.ts.readToken();
        this.opQueue.vals = this.parseValueArray();
        if (this.ts.token as any !== Token.RPARENTHESE) {
            this.ts.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let entity = space.getEntity(this.queueName);
        if (entity === undefined) {
            this.log(`unknown ${this.queueName}`);
        }
        if (entity.type !== 'queue') {
            this.log(`${this.queueName} is not QUEUE`);
        }
        this.opQueue.queue = entity as Queue;
        let ok = true;
        if (this.scanValueArray(space, this.opQueue.vals) === false) {
            ok = false;
        }
        return ok;
    }
}
