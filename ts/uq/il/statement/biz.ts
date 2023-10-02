import { BStatement } from '../../builder';
import * as parser from '../../parser';
import { Builder } from "../builder";
import { IElement } from '../element';
import { BizBud, BizBinAct, BizEntity, BizPend } from '../Biz';
import { ValueExpression } from '../expression';
import { Statement } from "./statement";
import { SetEqu } from '../tool';

export class BizDetailActStatement extends Statement {
    readonly bizDetailAct: BizBinAct;
    constructor(parent: Statement, bizDetailAct: BizBinAct) {
        super(parent);
        this.bizDetailAct = bizDetailAct;
    }

    sub: BizDetailActSubStatement;
    get type(): string { return 'bizstatement'; }
    db(db: Builder): object { return db.bizDetailActStatement(this); }
    parser(context: parser.PContext) { return new parser.PBizDetailActStatement(this, context); }
    setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
}

export abstract class BizDetailActSubStatement extends Statement {
    abstract parser(context: parser.PContext): parser.PElement;
    abstract db(db: Builder): BStatement;
}

export class BizDetailActSubPend extends BizDetailActSubStatement {
    readonly bizStatement: BizDetailActStatement;
    pend: BizPend;
    setEqu: SetEqu;             // 仅用于 Pend -= val;
    val: ValueExpression;       // 仅用于 Pend -= val;
    sets: { [v: string]: ValueExpression };

    constructor(bizStatement: BizDetailActStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'bizpend'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizDetailActSubPend(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubPend(this); }
}

export class BizDetailActTitle extends BizDetailActSubStatement {
    readonly bizStatement: BizDetailActStatement;
    entity: BizEntity;
    bud: BizBud;
    of: ValueExpression;
    setEqu: SetEqu;
    val: ValueExpression;

    constructor(bizStatement: BizDetailActStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'biztitle'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizDetailActTitle(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubSubject(this); }
}
