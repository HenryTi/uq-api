import { Statement } from '../../il';
import { DbContext } from '../dbContext';
import { Sqls } from './sqls';

export abstract class BStatementBase<T extends Statement = Statement> {
    protected context: DbContext;
    protected istatement: T;
    constructor(context: DbContext, istatement: T) {
        this.context = context;
        this.istatement = istatement;
    }

    abstract get singleKey(): string;
    singleHead(sqls: Sqls): void { }
    singleFoot(sqls: Sqls): void { }
    head(sqls: Sqls): void { }
    foot(sqls: Sqls): void { }
    abstract body(sqls: Sqls): void;
}

export abstract class BStatement<T extends Statement = Statement> extends BStatementBase<T> {
    readonly singleKey = undefined;
}
