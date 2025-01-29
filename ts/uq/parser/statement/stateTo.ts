import { Space } from '../space';
import { Token } from '../tokens';
import { StateToStatement } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';

export class PStateTo extends PStatement {
    stateTo: StateToStatement;
    constructor(stateTo: StateToStatement, context: PContext) {
        super(stateTo, context);
        this.stateTo = stateTo;
    }

    protected _parse() {
        if (this.ts.isKeyword('to') !== true) this.expect('to');
        this.ts.readToken();
        if (this.ts.token !== Token.VAR) this.expect('state名称');
        this.stateTo.to = this.ts.lowerVar;
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let to = this.stateTo.to;
        switch (to) {
            case 'start':
            case 'end':
            case 'delete': return true;
        }
        let states = space.getStates();
        if (states === undefined || states[to] === undefined) {
            this.log('未知的状态 ' + to);
            return false;
        }
        return true;
    }
}

