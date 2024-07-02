import { BBizFor, DbContext } from '../../../builder';
import { PBizFor, PContext, PElement } from '../../../parser';
import { ValueExpression } from '../../Exp';
import { IElement } from '../../IElement';
import { Statements, Var } from '../../statement';
import { BizSelectStatement, EnumAsc, FromEntity } from './biz.select';

export interface BizForIdCol {
    name: string;
    asc: EnumAsc;
    fromEntity: FromEntity;
}
export class BizFor extends BizSelectStatement {
    get type(): string { return 'foreach'; }
    // readonly forCols: Var[] = [];
    readonly vars: { [name: string]: Var } = {};
    readonly ids: Map<string, BizForIdCol> = new Map();
    readonly values: Map<string, ValueExpression> = new Map();
    statements: Statements;

    db(db: DbContext): object {
        return new BBizFor(db, this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizFor(this, context);
    }
}
