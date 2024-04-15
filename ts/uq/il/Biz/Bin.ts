import { BBizEntity, DbContext } from "../../builder";
import { BBizBin } from "../../builder";
import { PBinInputAtom, PBinInputSpec, PBinPick, PBizBin, PBizBinAct, PContext, PElement } from "../../parser";
import { EnumSysTable } from "../EnumSysTable";
import { IElement } from "../IElement";
import { Field } from "../field";
import { BizAtom, BizSpec } from "./BizID";
import { BizAct } from "./Base";
import { Biz } from "./Biz";
import { BizBudValue, BizBud, BizBudID, BizBudDec, BinValue, BizBudIXBase } from "./Bud";
import { BizEntity } from "./Entity";
import { BizQueryTable } from "./Query";
import { BizPend, BizSheet } from "./Sheet";
import { UI } from "../UI";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { ValueExpression } from "../Exp";
import { binFieldArr } from "../../consts";
import { UseOut } from "./InOut";

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
    hiddenBuds: BizBud[];
    constructor(bin: BizBin, name: string, ui: Partial<UI>) {
        super(bin, name, ui);
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
    getBud(name: string): BizBud;
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
    getBud(name: string): BizBud { return; }
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
    getBud(name: string): BizBud { return; }
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
    getBud(name: string): BizBud { return; }
}
export class PickPend implements PickBase {
    readonly bizEntityTable = EnumSysTable.pend;
    from: BizPend;
    hide: BizBud[];
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
    getBud(name: string): BizBud { return this.from.getBud(name); }
}

export abstract class BinInput extends BizBud {
    readonly dataType: BudDataType = BudDataType.none;
    readonly bin: BizBin;
    constructor(bin: BizBin, name: string, ui: Partial<UI>) {
        super(bin, name, ui);
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
    readonly fields = [];
    readonly buds: BizBud[] = [];
    readonly ui: Partial<UI>;
    readonly inputs: BinInput[] = [];

    div: BinDiv;
    level: number;
    key: BizBudValue;        // only used in Pivot
    format: any;

    constructor(parent: BinDiv, ui: Partial<UI>) {
        this.ui = ui;
        if (parent !== undefined) {
            parent.div = this;
            this.parent = parent;
        }
        this.level = this.parent === undefined ? 1 : this.parent.level + 1;
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

export class BinPivot extends BinDiv {
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.key = this.key.id;
        if (this.format !== undefined) {
            ret.format = this.format.map(([bud, withLabel, exclude]) => {
                return [bud.id, withLabel === true ? 1 : 0, exclude?.id]
            });
        }
        return ret;
    }
}

export class BizBin extends BizEntity {
    protected readonly fields = ['id', 'pend', ...binFieldArr];
    readonly bizPhraseType = BizPhraseType.bin;
    readonly pickColl: { [name: string]: BinPick } = {};
    readonly inputColl: { [name: string]: BinInput } = {};
    readonly sheetArr: BizSheet[] = [];     // 被多少sheet引用了
    readonly div: BinDiv;    // 输入和显示的层级结构
    readonly outs: { [name: string]: UseOut } = {};
    readonly predefinedBuds: BizBud[] = [];
    main: BizBin;           // 只有指定main的bin，才能引用%sheet.prop
    pickArr: BinPick[];
    inputArr: BinInput[];
    pend: BizPend;
    act: BizBinAct;
    i: BizBudID;
    x: BizBudID;
    iBase: BizBudIXBase;
    xBase: BizBudIXBase;
    value: BinValue;
    price: BizBudDec;
    amount: BizBudDec;
    pivot: BinPivot;

    constructor(biz: Biz) {
        super(biz);
        this.div = new BinDiv(undefined, undefined);    // 输入和显示的层级结构
    }

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
                const { name, ui, pick, params, single, hiddenBuds } = value;
                let from: any;
                if (pick !== undefined) {
                    from = pick.fromSchema();
                }
                picks.push({
                    name,
                    ui,
                    from,
                    hidden: hiddenBuds?.map(v => v.id),
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
        let pivot: boolean;
        if (this.pivot !== undefined) pivot = true;
        this.schema = {
            ...ret,
            main: this.main?.id,
            picks: picks.length === 0 ? undefined : picks,
            inputs: inputs.length === 0 ? undefined : inputs,
            pend: this.pend?.id,
            i: this.i?.buildSchema(res),
            iBase: this.iBase?.buildSchema(res),
            x: this.x?.buildSchema(res),
            xBase: this.xBase?.buildSchema(res),
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price,
            div: this.div.buildSchema(res),
            pivot,
        }
        return this.schema;
    }

    getSheetProps() {
        let budArr: BizBud[] = [];
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
        this.predefinedBuds.forEach(v => callback(v));
    }
    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        for (let bud of this.predefinedBuds) {
            if (bud.name === name) return bud;
        }
        return undefined;
    }
    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizBin(dbContext, this);
    }
    getDivFromBud(bud: BizBud): BinDiv {
        for (let p = this.div; p !== undefined; p = p.div) {
            let b = p.buds.find(v => v.name === bud.name);
            if (b !== undefined) {
                if (b !== bud) debugger;
                return p;
            }
        }
        return undefined;
    }
}

export class BizBinAct extends BizAct {
    readonly bizBin: BizBin;
    idParam: Field;

    constructor(biz: Biz, bizBin: BizBin) {
        super(biz);
        this.bizBin = bizBin;
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizBinAct(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            bin: this.bizBin.name,
        };
    }
}
