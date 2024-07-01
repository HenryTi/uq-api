import { BBizFor, DbContext } from '../../../builder';
import { PBizFor, PContext, PElement } from '../../../parser';
import { IElement } from '../../IElement';
import { Statements, Var } from '../../statement';
import { BizSelectStatement } from './biz.from';

export class BizFor extends BizSelectStatement {
    readonly forCols: Var[] = [];
    statements: Statements;

    db(db: DbContext): object {
        return new BBizFor(db, this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizFor(this, context);
    }
}
