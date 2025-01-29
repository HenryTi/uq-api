import { Space } from '../space';
import { Queue, QueueAction, QueueStatement, ValueExpression } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';
import { Token } from '..';

export class PQueueStatement extends PStatement {
    private queueName: string;
    private queueStatement: QueueStatement;
    constructor(pokeStatement: QueueStatement, context: PContext) {
        super(pokeStatement, context);
        this.queueStatement = pokeStatement;
    }

    protected _parse() {
        if (this.ts.token === Token.LPARENTHESE) {
            let val = new ValueExpression();
            val.parser(this.context).parse();
            this.queueStatement.entityId = val;
        }
        else if (this.ts.token === Token.VAR) {
            this.queueName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            this.ts.expectToken(Token.VAR);
        }
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            let ix = new ValueExpression();
            ix.parser(this.context).parse();
            this.queueStatement.ix = ix;
        }
        if (this.ts.isKeyword('add') === true) {
            this.queueStatement.action = QueueAction.add;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('again') === true) {
            this.queueStatement.action = QueueAction.again;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('done') === true) {
            this.queueStatement.action = QueueAction.done;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('del') === true) {
            this.queueStatement.action = QueueAction.del;
            this.ts.readToken();
        }
        let val = new ValueExpression();
        val.parser(this.context).parse();
        this.queueStatement.value = val;
    }

    scan(space: Space): boolean {
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
            let queue = this.queueStatement.queue = entity as Queue;
            let action = this.queueStatement.action;
            if (queue.onceOnly === true && action === QueueAction.again) {
                this.log(`QUEUE ${this.queueName} is ONCE ONLY, so can not add again`);
                ok = false;
            }
        }
        else {
            let { entityId } = this.queueStatement;
            if (entityId.pelement.scan(space) === false) ok = false;
        }
        let { ix, value } = this.queueStatement;
        if (ix) {
            if (ix.pelement.scan(space) === false) ok = false;
        }
        if (value) {
            if (value.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}
