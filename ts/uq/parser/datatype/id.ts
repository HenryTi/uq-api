import { IdDataType, Tuid } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PDataType } from './datatype';
import { PContext } from '../pContext';

export class PId extends PDataType {
    private id: IdDataType;
    constructor(id: IdDataType, context: PContext) {
        super(id, context);
        this.id = id;
    }

    protected _parse() {
        switch (this.ts.token) {
            default: return true;
            case Token.VAR:
                if (this.ts.isKeywords('of', 'desc', 'asc') === true) {
                    return true;
                }
                this.id.idType = this.ts.lowerVar;
                break;
            case Token.DOLLARVAR:
                this.id.idType = this.ts.lowerVar;
                break;
        }

        this.ts.readToken();
        if (this.ts.token as any === Token.DOT) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expect('id arr name');
            }
            this.id.arrName = this.ts.lowerVar;
            this.ts.readToken();
        }
        return true;
    }

    scanReturnMessage(space: Space): string {
        let { tuid, idType } = this.id;
        if (tuid !== undefined) return;
        if (idType === undefined) return;
        let entity = space.getEntityTable(idType);
        if (entity === undefined) return idType + ' 不存在';
        switch (entity.type) {
            default: return idType + ' 必须是ID or Tuid';
            case 'id': /*this.id.idType = undefined; */ return;
            case 'tuid': break;
        }
        let t = entity as Tuid;
        this.id.tuid = t;
        this.id.idSize = (t.id.dataType as IdDataType).idSize;
    }
}

export class PTextId extends PDataType {
    protected _parse() {
        return true;
    }
}
