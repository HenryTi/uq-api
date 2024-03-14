import {
    BBizStatementBinPend, BBizStatementTitle, BBizStatementInPend, BStatement, DbContext
    , BBizStatementSheet, BBizStatementAtom, BBizStatementSpec, BBizStatementOut, BBizStatementTie
} from '../../builder';
import * as parser from '../../parser';
import { IElement } from '../IElement';
import {
    BizBudValue, BizBinAct, BizEntity, BizPend, BizBud, BizAct
    , BizInAct, BizBin, BizAtom, BizSpec, UseOut, IDUnique, BizID, BizTie
} from '../Biz';
import { CompareExpression, ValueExpression } from '../Exp';
import { Statement } from "./Statement";
import { SetEqu } from '../tool';
import { VarPointer } from '../pointer';
import { UseSheet } from './use';

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
    db(db: DbContext): object { return this.sub.db(db); }
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

export class BizStatementSheet<T extends BizAct = BizAct> extends BizStatementSub<T> {
    useSheet: UseSheet;
    detail: BizBin;
    bin: BizBin;
    fields: { [name: string]: ValueExpression } = {};
    buds: { [name: string]: ValueExpression } = {};
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementSheet(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementSheet(db, this); }
}

export abstract class BizStatementID<T extends BizAct = BizAct> extends BizStatementSub<T> {
    toVar: VarPointer;
    inVals: ValueExpression[];
}

export class BizStatementAtom<T extends BizAct = BizAct> extends BizStatementID<T> {
    readonly atomCase: { bizID: BizAtom; condition: CompareExpression; }[] = [];
    unique: IDUnique;   // if unique===undefined，no as unique, inVals are parameters of unique
    ex: ValueExpression;
    readonly sets: Map<BizBud, ValueExpression> = new Map();
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

export class BizStatementTie<T extends BizAct = BizAct> extends BizStatementSub<T> {
    tie: BizTie;
    i: ValueExpression;
    x: ValueExpression;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementTie(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementTie(db, this); }
}

export class BizStatementOut<T extends BizAct = BizAct> extends BizStatementSub<T> {
    /*
    ioSite: BizIOSite;
    ioApp: BizIOApp;
    bizOut: BizOut;
    */
    useOut: UseOut;
    readonly tos: ValueExpression[] = [];
    detail: string;
    readonly sets: { [bud: string]: ValueExpression } = {};
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementOut(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementOut(db, this); }
}
