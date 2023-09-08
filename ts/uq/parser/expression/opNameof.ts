import { OpNameof } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class POpNameof extends PElement {
    private entity: string;
    private opNameof: OpNameof;
    constructor(opNameof: OpNameof, context: PContext) {
        super(opNameof, context);
        this.opNameof = opNameof;
    }
    _parse() {
        if (this.ts.token !== Token.VAR) {
            this.ts.expect('entity名字');
        }
        this.entity = this.ts.lowerVar;
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let entity = space.getEntity(this.entity);
        if (entity === undefined) {
            this.log('[' + this.entity + ']必须是Entity');
            return false;
        }
        this.opNameof.entity = entity;
        return true;
    }
}
