import { BBizStatementBinPend, BBizStatementTitle, BBizStatementInPend, BStatement, DbContext, BBizStatementSheet, BBizStatementDetail, BBizStatementAtom, BBizStatementSpec, BBizStatementOut } from '../../builder';
import * as parser from '../../parser';
import { Builder } from "../builder";
import { IElement } from '../IElement';
import { BizBudValue, BizBinAct, BizEntity, BizPend, BizBud, BizAct, BizInAct, BizBin, BizSheet, BizAtom, BizSpec } from '../Biz';
import { ValueExpression } from '../Exp';
import { Statement } from "./Statement";
import { SetEqu } from '../tool';
import { Pointer, VarPointer } from '../pointer';
import { UseOut } from './use';

export abstract class BizStatement<T extends BizAct> extends Statement {
    get type(): string { return 'bizstatement'; }
    readonly bizAct: T;
    sub: BizStatementSub<T>;
    constructor(parent: Statement, bizAct: T) {
        super(parent);
        this.bizAct = bizAct;
    }
    override setNo(no: number) {
        this.no = no;
        this.sub.setNo(no);
    }
    db(db: DbContext): object { return this.sub.db(db);/* db.bizActStatement(this); */ }
}

export class BizStatementBin extends BizStatement<BizBinAct> {
    parser(context: parser.PContext) { return new parser.PBizStatementBin(this, context); }
}

export class BizStatementIn extends BizStatement<BizInAct> {
    parser(context: parser.PContext) { return new parser.PBizStatementIn(this, context); }
}

export abstract class BizStatementSub<T extends BizAct> extends Statement {
    readonly bizStatement: BizStatement<T>;
    constructor(bizStatement: BizStatement<T>) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    abstract parser(context: parser.PContext): parser.PElement;
    abstract db(db: DbContext): BStatement;
}

export abstract class BizStatementPend<T extends BizAct> extends BizStatementSub<T> {
    get type(): string { return 'bizpend'; }
    readonly sets: [BizBud, ValueExpression][] = [];
    pend: BizPend;
    setEqu: SetEqu;             // 仅用于 Pend -= val;
    val: ValueExpression;       // 仅用于 Pend -= val;
}

export class BizStatementBinPend extends BizStatementPend<BizBinAct> {
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementBinPend(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementBinPend(db, this); /* return db.bizBinActSubPend(this);*/ }
}

export class BizStatementInPend extends BizStatementPend<BizInAct> {
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementInPend(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementInPend(db, this); /* db.bizInActSubPend(this); */ }
}

export class BizStatementTitle<T extends BizAct = BizAct> extends BizStatementSub<T> {
    entity: BizEntity;
    bud: BizBudValue;
    of: ValueExpression;
    setEqu: SetEqu;
    val: ValueExpression;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementTitle(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementTitle(db, this); }
}

export abstract class BizStatementSheetBase<T extends BizAct = BizAct> extends BizStatementSub<T> {
    sheet: BizSheet;
    bin: BizBin;
    fields: { [name: string]: ValueExpression } = {};
    buds: { [name: string]: ValueExpression } = {};
}

export class BizStatementSheet<T extends BizAct = BizAct> extends BizStatementSheetBase<T> {
    idPointer: VarPointer;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementSheet(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementSheet(db, this); }
}

export class BizStatementDetail<T extends BizAct = BizAct> extends BizStatementSheetBase<T> {
    idVal: ValueExpression;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementDetail(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementDetail(db, this); }
}

export abstract class BizStatementID<T extends BizAct = BizAct> extends BizStatementSub<T> {
    toVar: VarPointer;
    inVals: ValueExpression[];
}

export class BizStatementAtom<T extends BizAct = BizAct> extends BizStatementID<T> {
    atom: BizAtom;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementAtom(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementAtom(db, this); }
}

export class BizStatementSpec<T extends BizAct = BizAct> extends BizStatementID<T> {
    spec: BizSpec;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementSpec(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementSpec(db, this); }
}

export class BizStatementOut<T extends BizAct = BizAct> extends BizStatementSub<T> {
    useOut: UseOut;
    detail: string;
    readonly sets: { [bud: string]: ValueExpression } = {};
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementOut(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementOut(db, this); }
}
