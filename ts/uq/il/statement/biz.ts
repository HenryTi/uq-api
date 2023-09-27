import { BStatement } from '../../builder';
import * as parser from '../../parser';
import { Builder } from "../builder";
import { IElement } from '../element';
import { BizBud, BizDetailAct, BizEntity, BizPend } from '../Biz';
import { ValueExpression } from '../expression';
import { Statement } from "./statement";
import { SetEqu } from '../tool';

export class BizDetailActStatement extends Statement {
    readonly bizDetailAct: BizDetailAct;
    constructor(parent: Statement, bizDetailAct: BizDetailAct) {
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
    setEqu: SetEqu;
    val: ValueExpression;

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

export class BizDetailActSubTab extends BizDetailActSubStatement {
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
    get type(): string { return 'bizbud'; }
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizDetailActSubTab(this, context);
    }
    db(db: Builder): BStatement { return db.bizDetailActSubSubject(this); }
}
