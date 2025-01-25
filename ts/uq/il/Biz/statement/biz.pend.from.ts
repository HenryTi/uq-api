import { PContext, PElement, PFromStatement, PFromStatementInPend } from "../../../parser";
import { Builder } from "../../builder";
import { IElement } from "../../IElement";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { Statement } from "../../statement";
import { PendQuery } from "../Pend";
import { BanColumn, BizSelectStatement, FromColumn, IdColumn } from "./biz.select";
import { BizFromEntity } from "../Entity";
import { VarOperand } from "../../Exp";
import { BizBud } from "../Bud";
import { BudDataType } from "../BizPhraseType";
import { FromStatement } from "./biz.from";

export class FromStatementInPend extends FromStatement {
    readonly pendQuery: PendQuery;
    constructor(parent: Statement, pendQuery: PendQuery) {
        super(parent);
        this.pendQuery = pendQuery;
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatementInPend(this, context);
    }
    db(db: Builder): object {
        return db.fromStatementInPend(this);
    }
}
