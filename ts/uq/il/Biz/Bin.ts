import { BBizEntity, DbContext } from "../../builder";
import { BBizBin } from "../../builder";
import { PBinPick, PBizBin, PBizDetailAct, PContext, PElement } from "../../parser";
import { EnumSysTable } from "../EnumSysTable";
import { IElement } from "../element";
import { Field } from "../field";
import { ActionStatement, TableVar } from "../statement";
import { BizAtom, BizAtomSpec } from "./Atom";
import { BizBase, BizPhraseType, BudDataType } from "./Base";
import { Biz } from "./Biz";
import { BizBudValue, BizBudPickable, BizBud, BizBudAtom } from "./Bud";
import { BizEntity } from "./Entity";
import { BizQuery, BizQueryTable } from "./Query";
import { BizPend } from "./Sheet";

export interface PropPend {
    caption: string;
    entity: BizPend;
    search: string[];
}

export interface PickParam {
    name: string;
    bud: string;
    prop: string;       // prop of bud
}
export class BinPick extends BizBud {
    readonly bin: BizBin;
    readonly dataType = BudDataType.none;
    param: PickParam[];
    pick: PickBase;
    constructor(bin: BizBin, name: string, caption: string) {
        super(bin.biz, name, caption);
        this.bin = bin;
    }
    parser(context: PContext): PElement<IElement> {
        return new PBinPick(this, context);
    }
}
export abstract class PickBase {
    abstract get bizEntityTable(): EnumSysTable;
    abstract fromSchema(): string[];
    abstract hasParam(param: string): boolean;
    abstract hasReturn(prop: string): boolean;
}
export class PickQuery extends PickBase {
    readonly bizEntityTable = undefined;
    query: BizQueryTable;
    constructor(query: BizQueryTable) {
        super();
        this.query = query;
    }
    fromSchema(): string[] { return [this.query.name]; }
    hasParam(param: string): boolean {
        return this.query.hasParam(param);
    }
    hasReturn(prop: string): boolean {
        if (prop === undefined || prop === 'id') return true;
        return this.query.hasReturn(prop);
    }
}
export class PickAtom extends PickBase {
    readonly bizEntityTable = EnumSysTable.atom;
    readonly from: BizAtom[];
    constructor(from: BizAtom[]) {
        super();
        this.from = from;
    }
    fromSchema(): string[] { return this.from.map(v => v.name); }
    hasParam(param: string): boolean {
        return false;
    }
    hasReturn(prop: string): boolean {
        if (prop === undefined || prop === 'id') return true;
        return false;
    }
}
export class PickSpec extends PickBase {
    readonly bizEntityTable = EnumSysTable.spec;
    from: BizAtomSpec;
    constructor(from: BizAtomSpec) {
        super();
        this.from = from;
    }
    fromSchema(): string[] { return [this.from.name]; }
    hasParam(param: string): boolean {
        return param === 'base';
    }
    hasReturn(prop: string): boolean {
        if (prop === undefined || prop === 'id') return true;
        return false;
    }
}
export class PickPend extends PickBase {
    readonly bizEntityTable = EnumSysTable.pend;
    from: BizPend;
    constructor(from: BizPend) {
        super();
        this.from = from;
    }
    fromSchema(): string[] { return [this.from.name]; }
    hasParam(param: string): boolean {
        return false;
    }
    hasReturn(prop: string): boolean {
        if (prop === undefined || prop === 'id') return true;
        return false;
    }
}

export class BizBin extends BizEntity {
    protected readonly fields = ['id', 'i', 'x', 'pend', 'value', 'price', 'amount'];
    readonly bizPhraseType = BizPhraseType.bin;
    picks: Map<string, BinPick>;
    act: BizBinAct;
    i: BizBudAtom;
    x: BizBudAtom;
    pend: PropPend;
    value: BizBudValue;
    price: BizBudValue;
    amount: BizBudValue;

    parser(context: PContext): PElement<IElement> {
        return new PBizBin(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let pend: any;
        if (this.pend !== undefined) {
            let { caption, entity, search } = this.pend;
            pend = {
                caption,
                entity: entity.name,
                search,
            }
        }
        let picks: any[] = [];
        if (this.picks !== undefined) {
            for (let [, value] of this.picks) {
                const { name, caption, pick, param } = value;
                picks.push({
                    name,
                    caption,
                    from: pick.fromSchema(),
                    param,
                });
            }
        };
        return {
            ...ret,
            picks: picks.length === 0 ? undefined : picks,
            pend,
            i: this.i?.buildSchema(res),
            x: this.x?.buildSchema(res),
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price: this.price?.buildSchema(res),
        }
    }
    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        if (this.picks !== undefined) {
            for (let [, pick] of this.picks) callback(pick);
        }
        if (this.i !== undefined) callback(this.i);
        if (this.x !== undefined) callback(this.x);
        if (this.value !== undefined) callback(this.value);
        if (this.price !== undefined) callback(this.price);
        if (this.amount !== undefined) callback(this.amount);
    }
    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        if (this.value !== undefined) {
            if (this.value.name === name) return this.value;
        }
        if (this.price !== undefined) {
            if (this.price.name === name) return this.price;
        }
        if (this.amount !== undefined) {
            if (this.amount.name === name) return this.amount;
        }
        return undefined;
    }
    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizBin(dbContext, this);
    }
    isValidPickProp(pickName: string, prop: string): boolean {
        if (this.picks === undefined) return false;
        let pick = this.picks.get(pickName);
        if (pick === undefined) return false;
        if (prop === undefined) return true;
        return pick.pick.hasReturn(prop);
    }
}

export class BizBinAct extends BizBase {
    readonly bizPhraseType = BizPhraseType.detailAct;
    readonly bizDetail: BizBin;
    readonly tableVars: { [name: string]: TableVar } = {};

    idParam: Field;
    statement: ActionStatement;

    constructor(biz: Biz, bizDetail: BizBin) {
        super(biz);
        this.bizDetail = bizDetail;
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizDetailAct(this, context);
    }

    addTableVar(tableVar: TableVar): boolean {
        let name = tableVar.name;
        let t = this.tableVars[name];
        if (t !== undefined) return false;
        this.tableVars[name] = tableVar;
        return true;
    }

    getTableVar(name: string): TableVar { return this.tableVars[name] }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            detail: this.bizDetail.name,
        };
    }
}
