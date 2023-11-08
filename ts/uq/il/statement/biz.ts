import { BStatement } from '../../builder';
import * as parser from '../../parser';
import { Builder } from "../builder";
import { IElement } from '../element';
import { BizBudValue, BizBinAct, BizEntity, BizPend } from '../Biz';
import { ValueExpression } from '../Exp';
import { Statement } from "./statement";
import { SetEqu } from '../tool';

export class BizBinActStatement extends Statement {
    readonly bizDetailAct: BizBinAct;
    constructor(parent: Statement, bizDetailAct: BizBinAct) {
        super(parent);
        this.bizDetailAct = bizDetailAct;
    }

    sub: BizBinSubStatement;
    get type(): string { return 'bizstatement'; }
    db(db: Builder): object { return db.bizDetailActStatement(this); }
    parser(context: parser.PContext) { return new parser.PBizBinStatement(this, context); }
    setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
}

export abstract class BizBinSubStatement extends Statement {
    abstract parser(context: parser.PContext): parser.PElement;
    abstract db(db: Builder): BStatement;
}

export class BizBinPendStatement extends BizBinSubStatement {
    readonly bizStatement: BizBinActStatement;
    pend: BizPend;
    setEqu: SetEqu;             // 仅用于 Pend -= val;
    val: ValueExpression;       // 仅用于 Pend -= val;
    sets: { [v: string]: ValueExpression };

    constructor(bizStatement: BizBinActStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'bizpend'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizBinPendStatement(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubPend(this); }
}

export class BizBinTitleStatement extends BizBinSubStatement {
    readonly bizStatement: BizBinActStatement;
    entity: BizEntity;
    bud: BizBudValue;
    of: ValueExpression;
    setEqu: SetEqu;
    val: ValueExpression;

    constructor(bizStatement: BizBinActStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'biztitle'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizBinTitleStatement(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubSubject(this); }
}
