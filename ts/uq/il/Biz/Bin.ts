import { BBizEntity, DbContext } from "../../builder";
import { BBizBin } from "../../builder";
import { PBinPick, PBizBin, PBizBinAct, PContext, PElement } from "../../parser";
import { EnumSysTable } from "../EnumSysTable";
import { IElement } from "../element";
import { Field } from "../field";
import { ActionStatement, TableVar } from "../statement";
import { BizAtom, BizAtomSpec } from "./Atom";
import { BizBase, BizPhraseType, BudDataType } from "./Base";
import { Biz } from "./Biz";
import { BizBudValue, BizBud, BizBudAtom } from "./Bud";
import { BizEntity } from "./Entity";
import { BizQueryTable } from "./Query";
import { BizPend } from "./Sheet";
import { UI } from "../UI";

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
    single: boolean;
    constructor(bin: BizBin, name: string, ui: Partial<UI>) {
        super(bin.biz, name, ui);
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
        if (prop === undefined) return true;
        // || prop === 'id') return true;
        /*
        for (let atom of this.from) {
            let bud = atom.getBud(prop);
            if (bud !== undefined) return true;
        }
        */
        // 不支持atom的其它字段属性。只能用查询
        return ['id', 'no', 'ex'].includes(prop);
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
        let bud = this.from.getBud(prop);
        if (bud !== undefined) return true;
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
        return this.from.hasField(prop);
    }
}

export class BizBin extends BizEntity {
    protected readonly fields = ['id', 'i', 'x', 'pend', 'value', 'price', 'amount'];
    readonly bizPhraseType = BizPhraseType.bin;
    picks: Map<string, BinPick>;
    pend: BizPend;
    act: BizBinAct;
    i: BizBudAtom;
    x: BizBudAtom;
    value: BizBudValue;
    price: BizBudValue;
    amount: BizBudValue;

    showBuds: { [bud: string]: [BizEntity, BizBud] };

    parser(context: PContext): PElement<IElement> {
        return new PBizBin(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let pend: any;
        if (this.pend !== undefined) {
            let { ui, name } = this.pend;
            pend = {
                ui,
                entity: name,
                // search,
            }
        }
        let picks: any[] = [];
        if (this.picks !== undefined) {
            for (let [, value] of this.picks) {
                const { name, ui, pick, param, single } = value;
                picks.push({
                    name,
                    ui,
                    from: pick.fromSchema(),
                    param,
                    single,
                });
            }
        };
        let price = this.price?.buildSchema(res);
        this.schema = {
            ...ret,
            picks: picks.length === 0 ? undefined : picks,
            pend,
            i: this.i?.buildSchema(res),
            x: this.x?.buildSchema(res),
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price,
        }
        return this.schema;
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
    getPick(pickName: string) {
        if (this.picks === undefined) return;
        let pick = this.picks.get(pickName);
        return pick;
    }
    getBudProp(binBud: string, bud: string, prop: string): [BizEntity, BizBud] {
        let bizEntity: BizEntity;
        if (bud === 'i') {
            if (this.i === undefined) return;
            bizEntity = this.i.atom;
        }
        else if (bud === 'x') {
            if (this.x === undefined) return;
            bizEntity = this.x.atom;
        }
        else {
            let b = this.getBud(bud);
            if (b === undefined) return;
            switch (b.dataType) {
                default: return;
                case BudDataType.atom: break;
            }
            let { atom } = b as BizBudAtom;
            bizEntity = atom;
        }
        let bizBud = bizEntity.getBud(prop);
        if (bizBud === undefined) return;
        if (this.showBuds === undefined) this.showBuds = {};
        return this.showBuds[binBud] = [bizEntity, bizBud];
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
        return new PBizBinAct(this, context);
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
