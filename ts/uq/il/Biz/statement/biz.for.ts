import { BBizFor, DbContext } from '../../../builder';
import { PBizFor, PContext, PElement } from '../../../parser';
import { ValueExpression } from '../../Exp';
import { IElement } from '../../IElement';
import { Statements, Var } from '../../statement';
import { BizSelectStatement, EnumAsc, FromEntity } from './biz.select';

export interface BizForIdCol {
    name: string;
    fromEntity: FromEntity;
}

export interface BizForOrderBy {
    fieldName: string;
    asc: EnumAsc;
}

export class BizFor extends BizSelectStatement {
    get type(): string { return 'foreach'; }
    readonly vars: { [name: string]: Var } = {};
    readonly ids: Map<string, BizForIdCol> = new Map();
    readonly values: Map<string, ValueExpression> = new Map();
    isGroup: boolean;
    readonly orderBys: BizForOrderBy[] = [];
    statements: Statements;

    db(db: DbContext): object {
        return new BBizFor(db, this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizFor(this, context);
    }
}
