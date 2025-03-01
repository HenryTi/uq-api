import {
    BBizStatementBinPend, BBizStatementBook as BBizStatementBook, BBizStatementInPend, BStatement, DbContext
    , BBizStatementSheet, BBizStatementAtom, BBizStatementFork as BBizStatementFork, BBizStatementOut, BBizStatementTie,
    BBizStatementError
} from '../../../builder';
import * as parser from '../../../parser';
import { IElement } from '../../IElement';
import { BizAtom, BizFork, IDUnique, } from '../BizID';
import { BizID, BizEntity } from '../Entity';
import { UseOut } from '../InOut';
import { BizTie } from '../Tie';
import { BizBin, BizBinAct } from '../Bin';
import { BizInAct } from '../InOut';
import { BizAct } from '../Base';
import { BizBud, BizBudValue } from '../Bud';
import { CompareExpression, ValueExpression } from '../../Exp';
import { SetEqu } from '../../tool';
import { NamePointer } from '../../pointer';
import { BizPend } from '../Pend';
import { Statement, UseSheet } from '../../statement';

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
    setI: ValueExpression;
    setX: ValueExpression;
    pend: BizPend;
    setEqu: SetEqu;             // 仅用于 Pend -= val;
    val: ValueExpression;       // if val===undefined then _value
    keys: Map<BizBud, ValueExpression>;
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

export class BizStatementBook<T extends BizAct = BizAct> extends BizStatementSub<T> {
    entity: BizEntity;
    bud: BizBudValue;
    of: ValueExpression;
    setEqu: SetEqu;
    val: ValueExpression;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementBook(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementBook(db, this); }
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

export abstract class BizStatementID<I extends BizID, T extends BizAct = BizAct> extends BizStatementSub<T> {
    // readonly entityCase: { bizID: I; condition: CompareExpression; uniqueName: string; uniqueVals: ValueExpression[]; }[] = [];
    bizID: I;
    uniqueVals: ValueExpression[];
    idVal: ValueExpression;
    toVar: NamePointer;
    readonly sets: Map<BizBud, ValueExpression> = new Map();
}

export class BizStatementAtom<T extends BizAct = BizAct> extends BizStatementID<BizAtom, T> {
    uniqueName: string;
    noVal: ValueExpression;
    ex: ValueExpression;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementAtom(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementAtom(db, this); }
}

export class BizStatementFork<T extends BizAct = BizAct> extends BizStatementID<BizFork, T> {
    fork: BizFork;
    valFork: ValueExpression;
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementFork(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementFork(db, this); }
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
    useOut: UseOut;
    readonly tos: ValueExpression[] = [];
    detail: string;
    readonly sets: { [bud: string]: ValueExpression } = {};
    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementOut(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementOut(db, this); }
}

export class BizStatementError<T extends BizAct = BizAct> extends BizStatementSub<T> {
    pendOver: ValueExpression;
    message: ValueExpression;

    parser(context: parser.PContext): parser.PElement<IElement> {
        return new parser.PBizStatementError(this, context);
    }
    db(db: DbContext): BStatement { return new BBizStatementError(db, this); }
}

