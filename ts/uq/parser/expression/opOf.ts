import { OpOf, Tuid } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class POpOf extends PElement {
    private tuid: string;
    private arr: string;
    private opOf: OpOf;
    constructor(opOf: OpOf, context: PContext) {
        super(opOf, context);
        this.opOf = opOf;
    }
    _parse() {
        if (this.ts.token !== Token.VAR) {
            this.ts.expect('tuid名字');
        }
        this.tuid = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(Token.DOT);
        this.ts.readToken();
        if (this.ts.token !== Token.VAR) {
            this.ts.expect('tuid arr名字');
        }
        this.arr = this.ts.lowerVar;
        this.ts.readToken();
    }
    
    scan(space:Space):boolean {
        let entity = space.getEntityTable(this.tuid);
        if (entity === undefined || entity.type !== 'tuid') {
            this.log('['+this.tuid + ']必须是TUID');
            return false;
        }
        let tuid = entity as Tuid;
        let arr = tuid.getArr(this.arr);
        if (arr === undefined) {
            this.log('[' + this.arr + ']必须是[' + this.tuid + ']的ARR');
            return false;
        }
        this.opOf.tuidArr = arr;
        return true;
    }
}
