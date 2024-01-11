import { BStatement } from '../../builder';
import * as parser from '../../parser';
import { Builder } from "../builder";
import { IElement } from '../IElement';
import { BizBudValue, BizBinAct, BizEntity, BizPend, BizBud, BizAct, BizInAct } from '../Biz';
import { ValueExpression } from '../Exp';
import { Statement } from "./Statement";
import { SetEqu } from '../tool';

export abstract class BizActStatement<T extends BizAct> extends Statement {
    readonly bizAct: T;
    sub: BizActSubStatement;
    constructor(parent: Statement, bizAct: T) {
        super(parent);
        this.bizAct = bizAct;
    }
}

export class BizBinActStatement extends BizActStatement<BizBinAct> {
    sub: BizActSubStatement;
    get type(): string { return 'bizstatement'; }
    db(db: Builder): object { return db.bizBinActStatement(this); }
    parser(context: parser.PContext) { return new parser.PBizBinActStatement(this, context); }
    setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
}

export class BizInActStatement extends BizActStatement<BizInAct> {
    get type(): string { return 'bizstatement'; }
    db(db: Builder): object { return db.bizInActStatement(this); }
    parser(context: parser.PContext) { return new parser.PBizInActStatement(this, context); }
    setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
}

export abstract class BizActSubStatement extends Statement {
    abstract parser(context: parser.PContext): parser.PElement;
    abstract db(db: Builder): BStatement;
}

export abstract class BizPendStatement<T extends BizAct> extends BizActSubStatement {
    readonly bizStatement: BizActStatement<T>;
    readonly sets: [BizBud, ValueExpression][] = [];
    pend: BizPend;
    setEqu: SetEqu;             // 仅用于 Pend -= val;
    val: ValueExpression;       // 仅用于 Pend -= val;

    constructor(bizStatement: BizActStatement<any>) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'bizpend'; }
    /*
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizBinPendStatement(this, context);
    }
    */
}

export class BizBinPendStatement extends BizPendStatement<BizBinAct> {
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizBinPendStatement(this, context);
    }
    db(db: Builder): BStatement { return db.bizBinActSubPend(this); }
}

export class BizInPendStatement extends BizPendStatement<BizInAct> {
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizInPendStatement(this, context);
    }
    db(db: Builder): BStatement { return db.bizInActSubPend(this); }
}

export class BizTitleStatement extends BizActSubStatement {
    readonly bizStatement: BizActStatement<BizAct>;
    entity: BizEntity;
    bud: BizBudValue;
    of: ValueExpression;
    setEqu: SetEqu;
    val: ValueExpression;

    constructor(bizStatement: BizActStatement<any>) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type(): string { return 'biztitle'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizTitleStatement(this, context);
    }
    db(db: Builder): BStatement { return db.bizActSubTitle(this); }
}
