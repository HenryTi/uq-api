import { BBizEntity, DbContext } from "../../builder";
import { BBizBin } from "../../builder";
import { PBinInputAtom, PBinInputSpec, PBinPick, PBizBin, PBizBinAct, PContext, PElement } from "../../parser";
import { EnumSysTable } from "../EnumSysTable";
import { IElement } from "../IElement";
import { Field } from "../field";
import { ActionStatement, TableVar } from "../statement";
import { BizAtom, BizSpec } from "./BizID";
import { BizBase } from "./Base";
import { Biz } from "./Biz";
import { BizBudValue, BizBud, BizBudID, BizBudDec } from "./Bud";
import { BizEntity } from "./Entity";
import { BizQueryTable } from "./Query";
import { BizPend, BizSheet } from "./Sheet";
import { UI } from "../UI";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { ValueExpression } from "../Exp";

export interface PickParam {
    name: string;
    bud: string;
    prop: string;       // prop of bud
}

export class BinPick extends BizBud {
    readonly bin: BizBin;
    readonly dataType = BudDataType.none;
    params: PickParam[];
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
export interface PickBase {
    get bizEntityTable(): EnumSysTable;
    fromSchema(): string[];
    hasParam(param: string): boolean;
    hasReturn(prop: string): boolean;
}
export class PickQuery implements PickBase {
    readonly bizEntityTable = undefined;
    query: BizQueryTable;
    constructor(query: BizQueryTable) {
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
export class PickAtom implements PickBase {
    readonly bizEntityTable = EnumSysTable.atom;
    readonly from: BizAtom[];
    constructor(from: BizAtom[]) {
        this.from = from;
    }
    fromSchema(): string[] { return this.from.map(v => v.name); }
    hasParam(param: string): boolean {
        return false;
    }
    hasReturn(prop: string): boolean {
        if (prop === undefined) return true;
        // 不支持atom的其它字段属性。只能用查询
        return ['id', 'no', 'ex'].includes(prop);
    }
}
export class PickSpec implements PickBase {
    readonly bizEntityTable = EnumSysTable.spec;
    from: BizSpec;
    constructor(from: BizSpec) {
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
export class PickPend implements PickBase {
    readonly bizEntityTable = EnumSysTable.pend;
    from: BizPend;
    constructor(from: BizPend) {
        this.from = from;
    }
    fromSchema(): string[] { return [this.from.name]; }
    hasParam(param: string): boolean {
        let { params } = this.from.pendQuery;
        return params.findIndex(v => v.name === param) >= 0;
    }
    hasReturn(prop: string): boolean {
        if (prop === undefined || prop === 'id') return true;
        return this.from.hasField(prop);
    }
}

export abstract class BinInput extends BizBud {
    readonly dataType: BudDataType = BudDataType.none;
    readonly bin: BizBin;
    constructor(bin: BizBin, name: string, ui: Partial<UI>) {
        super(bin.biz, name, ui);
        this.bin = bin;
    }
}

export class BinInputSpec extends BinInput {
    spec: BizSpec;
    baseValue: ValueExpression;
    private baseValueStr: string;

    parser(context: PContext): PElement<IElement> {
        return new PBinInputSpec(this, context);
    }

    override buildBudValue(expStringify: (value: ValueExpression) => string): void {
        super.buildBudValue(expStringify)
        this.baseValueStr = expStringify(this.baseValue);
    }

    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.spec = this.spec.id;
        ret.base = this.baseValueStr
        return ret;
    }
}

export class BinInputAtom extends BinInput {
    atom: BizAtom;
    parser(context: PContext): PElement<IElement> {
        return new PBinInputAtom(this, context);
    }
    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.atom = this.atom.id;
        return ret;
    }
}

// column: maybe I, Value, Amount, Price, I.base, I.base.base, Prop
export class BinDiv {
    readonly parent: BinDiv;
    readonly ui: Partial<UI>;
    readonly inputs: BinInput[] = [];
    readonly buds: BizBud[] = [];
    div: BinDiv;
    constructor(parent: BinDiv, ui: Partial<UI>) {
        this.parent = parent;
        this.ui = ui;
        if (parent !== undefined) {
            parent.div = this;
        }
    }

    buildSchema(res: { [phrase: string]: string }) {
        let inputs: any[] = [];
        if (this.inputs !== undefined) {
            for (let input of this.inputs) {
                let schema = input.buildSchema(res);
                inputs.push(schema);
            }
        }
        if (inputs.length === 0) inputs = undefined;
        let ret = {
            ui: this.ui,
            buds: this.buds.map(v => v.name),
            div: this.div?.buildSchema(res),
            inputs,
        };
        return ret;
    }
}

export class BizBin extends BizEntity {
    protected readonly fields = ['id', 'i', 'x', 'pend', 'value', 'price', 'amount'];
    readonly bizPhraseType = BizPhraseType.bin;
    readonly pickColl: { [name: string]: BinPick } = {};
    readonly inputColl: { [name: string]: BinInput } = {};
    readonly sheetArr: BizSheet[] = [];     // 被多少sheet引用了
    readonly div: BinDiv = new BinDiv(undefined, undefined);    // 输入和显示的层级结构
    pickArr: BinPick[];
    inputArr: BinInput[];
    pend: BizPend;
    act: BizBinAct;
    i: BizBudID;
    x: BizBudID;
    value: BizBudDec;
    price: BizBudDec;
    amount: BizBudDec;

    parser(context: PContext): PElement<IElement> {
        return new PBizBin(this, context);
    }

    setPick(pick: BinPick) {
        if (this.pickArr === undefined) {
            this.pickArr = [];
        }
        this.pickArr.push(pick);
        this.pickColl[pick.name] = pick;
    }

    setInput(input: BinInput) {
        if (this.inputArr === undefined) {
            this.inputArr = [];
        }
        this.inputArr.push(input);
        this.inputColl[input.name] = input;
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let picks: any[] = [];
        if (this.pickArr !== undefined) {
            for (let value of this.pickArr) {
                const { name, ui, pick, params, single } = value;
                picks.push({
                    name,
                    ui,
                    from: pick?.fromSchema(),
                    params,
                    single,
                });
            }
        };
        let inputs: any[] = [];
        if (this.inputArr !== undefined) {
            for (let input of this.inputArr) {
                let schema = input.buildSchema(res);
                inputs.push(schema);
            }
        }
        let price = this.price?.buildSchema(res);
        this.schema = {
            ...ret,
            picks: picks.length === 0 ? undefined : picks,
            inputs: inputs.length === 0 ? undefined : inputs,
            pend: this.pend?.id,
            i: this.i?.buildSchema(res),
            x: this.x?.buildSchema(res),
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price,
            div: this.div.buildSchema(res),
        }
        return this.schema;
    }

    getSheetProps() {
        let budArr: BizBudValue[] = [];
        for (let sheet of this.sheetArr) {
            let { main } = sheet;
            if (main === undefined) continue;
            for (let [, bud] of main.props) {
                budArr.push(bud);
            }
        }
        return budArr;
    }

    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        if (this.pickArr !== undefined) {
            for (let pick of this.pickArr) callback(pick);
        }
        if (this.inputArr !== undefined) {
            for (let input of this.inputArr) callback(input);
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
        if (this.i !== undefined) {
            if (this.i.name === 'i') return this.i;
        }
        if (this.x !== undefined) {
            if (this.x.name === 'x') return this.x;
        }
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
    getBinBudEntity(bud: string): BizEntity {
        let bizEntity: BizEntity;
        if (bud === 'i') {
            if (this.i === undefined) return;
            bizEntity = this.i.ID;
        }
        else if (bud === 'x') {
            if (this.x === undefined) return;
            bizEntity = this.x.ID;
        }
        else {
            let b = this.getBud(bud);
            if (b === undefined) return;
            switch (b.dataType) {
                default: return;
                case BudDataType.atom: break;
            }
            let { ID: atom } = b as BizBudID;
            bizEntity = atom;
        }
        return bizEntity;
    }
}

export class BizBinAct extends BizBase {
    readonly bizPhraseType = BizPhraseType.detailAct;
    readonly bizBin: BizBin;
    readonly tableVars: { [name: string]: TableVar } = {};

    idParam: Field;
    statement: ActionStatement;

    constructor(biz: Biz, bizBin: BizBin) {
        super(biz);
        this.bizBin = bizBin;
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
            detail: this.bizBin.name,
        };
    }
}
