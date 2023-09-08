"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpQueue = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpQueue extends element_1.PElement {
    constructor(opQueue, context) {
        super(opQueue, context);
        this.opQueue = opQueue;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expectToken(tokens_1.Token.VAR);
        }
        this.queueName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            let ix = new il_1.ValueExpression();
            ix.parser(this.context).parse();
            this.opQueue.ix = ix;
        }
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expectToken(tokens_1.Token.VAR);
        }
        const expectHasWaitDone = 'key word has, wait or done';
        if (this.ts.varBrace === true) {
            this.ts.expect(expectHasWaitDone);
        }
        switch (this.ts.lowerVar) {
            default:
                this.ts.expect(expectHasWaitDone);
                break;
            case 'has':
                this.opQueue.action = il_1.OpQueueAction.has;
                break;
            case 'wait':
                this.opQueue.action = il_1.OpQueueAction.wait;
                break;
            case 'done':
                this.opQueue.action = il_1.OpQueueAction.done;
                break;
        }
        this.ts.readToken();
        this.opQueue.vals = this.parseValueArray();
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space) {
        let entity = space.getEntity(this.queueName);
        if (entity === undefined) {
            this.log(`unknown ${this.queueName}`);
        }
        if (entity.type !== 'queue') {
            this.log(`${this.queueName} is not QUEUE`);
        }
        this.opQueue.queue = entity;
        let ok = true;
        if (this.scanValueArray(space, this.opQueue.vals) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.POpQueue = POpQueue;
//# sourceMappingURL=opQueue.js.map