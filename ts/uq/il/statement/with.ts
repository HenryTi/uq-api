import { Var } from "./Statement";
import { PContext, PWithStatement } from "../../parser";
import { Builder } from "../builder";
import { ID, IX, IDX } from "../entity";
import { IdBase } from "../entity/IdBase";
import { CompareExpression, IDNewType, ValueExpression } from "../Exp";
import { Statement } from "./Statement";
import { SetValue } from "./def";

abstract class With {
    abstract get type(): string;
    abstract get entity(): IdBase;
}
export class WithID extends With {
    get entity(): IdBase { return this.ID }
    type: string = 'id';
    idVal: ValueExpression;
    ID: ID;
    keyVals: ValueExpression[];
    idToVar: Var;
    newType: IDNewType;
    prevToVar: Var;
    stampVal: ValueExpression;
}

export class WithIDX extends With {
    get entity(): IdBase { return this.IDX }
    type: string = 'idx';
    idVal: ValueExpression;
    IDX: IDX;
}

export class WithIX extends With {
    get entity(): IdBase { return this.IX }
    type: string = 'ix';
    IX: IX;
    ixxVal: ValueExpression;
    iVal: ValueExpression;
    xVal: ValueExpression;
}

abstract class WithAct {
    abstract get type(): string;
}

export class WithActSet extends WithAct {
    type: string = 'set';
    sets: { [name: string]: SetValue } = {};
    setsOnNew: { [name: string]: SetValue } = {};
}

export class WithActDel extends WithAct {
    type: string = 'del';
}

export class WithActTruncate extends WithAct {
    type: string = 'truncate';
}

export class WithStatement extends Statement {
    with: With;
    alias: string;
    act: WithAct;
    where: CompareExpression;

    get type(): string { return 'with'; }
    db(db: Builder): object {
        switch (this.act.type) {
            case 'truncate':
                return db.withTruncate(this);
            case 'del':
                switch (this.with.type) {
                    case 'id':
                        if ((this.with as WithID).idVal === undefined) {
                            return db.withIDDelOnKeys(this);
                        }
                        else {
                            return db.withIDDelOnId(this);
                        }
                    case 'idx': return db.withIDXDel(this);
                    case 'ix': return db.withIXDel(this);
                }
                break;
            case 'set':
                switch (this.with.type) {
                    case 'id':
                        if ((this.with as WithID).idVal === undefined) {
                            return db.withIDSetOnKeys(this);
                        }
                        else {
                            return db.withIDSetOnId(this);
                        }
                    case 'idx': return db.withIDXSet(this);
                    case 'ix': return db.withIXSet(this);
                }
                break;
        }
    }
    parser(context: PContext) { return new PWithStatement(this, context); }
}
