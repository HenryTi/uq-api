"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQueueStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
const __1 = require("..");
class PQueueStatement extends statement_1.PStatement {
    constructor(pokeStatement, context) {
        super(pokeStatement, context);
        this.queueStatement = pokeStatement;
    }
    _parse() {
        if (this.ts.token === __1.Token.LPARENTHESE) {
            let val = new il_1.ValueExpression();
            val.parser(this.context).parse();
            this.queueStatement.entityId = val;
        }
        else if (this.ts.token === __1.Token.VAR) {
            this.queueName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            this.ts.expectToken(__1.Token.VAR);
        }
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            let ix = new il_1.ValueExpression();
            ix.parser(this.context).parse();
            this.queueStatement.ix = ix;
        }
        if (this.ts.isKeyword('add') === true) {
            this.queueStatement.action = il_1.QueueAction.add;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('again') === true) {
            this.queueStatement.action = il_1.QueueAction.again;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('done') === true) {
            this.queueStatement.action = il_1.QueueAction.done;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('del') === true) {
            this.queueStatement.action = il_1.QueueAction.del;
            this.ts.readToken();
        }
        let val = new il_1.ValueExpression();
        val.parser(this.context).parse();
        this.queueStatement.value = val;
    }
    scan(space) {
        let ok = true;
        if (this.queueName !== undefined) {
            let entity = space.getEntity(this.queueName);
            if (entity === undefined) {
                ok = false;
                this.log(`${this.queueName} is not defined`);
            }
            if (entity.type !== 'queue') {
                ok = false;
                this.log(`${this.queueName} is not QUEUE`);
            }
            let queue = this.queueStatement.queue = entity;
            let action = this.queueStatement.action;
            if (queue.onceOnly === true && action === il_1.QueueAction.again) {
                this.log(`QUEUE ${this.queueName} is ONCE ONLY, so can not add again`);
                ok = false;
            }
        }
        else {
            let { entityId } = this.queueStatement;
            if (entityId.pelement.scan(space) === false)
                ok = false;
        }
        let { ix, value } = this.queueStatement;
        if (ix) {
            if (ix.pelement.scan(space) === false)
                ok = false;
        }
        if (value) {
            if (value.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PQueueStatement = PQueueStatement;
//# sourceMappingURL=queue.js.map