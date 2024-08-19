import { BBizEntity, DbContext } from "../../builder";
import { BBizBin } from "../../builder";
import { PBinInputAtom, PBinInputFork, PBinPick, PBizBin, PBizBinAct, PContext, PElement, PPickParam } from "../../parser";
import { EnumSysTable } from "../EnumSysTable";
import { IElement } from "../IElement";
import { Field } from "../field";
import { BizAtom, BizFork } from "./BizID";
import { BizAct } from "./Base";
import { Biz } from "./Biz";
import { BizBudValue, BizBud, BizBudID, BizBudDec, BinValue, BizBudIXBase, BudValueSetType } from "./Bud";
import { BizEntity, BizID } from "./Entity";
import { BizQueryTable } from "./Query";
import { BizSheet } from "./Sheet";
import { UI } from "../UI";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { ValueExpression } from "../Exp";
import { binFieldArr } from "../../consts";
import { UseOut } from "./InOut";
import { BizPend } from "./Pend";

export class PickParam extends BizBudValue {
    readonly canIndex = false;
    readonly dataType = BudDataType.none;
    override parser(context: PContext): PElement<IElement> {
        return new PPickParam(this, context);
    }
    override buildSchema(res: { [phrase: string]: string; }) {
        return super.buildSchema(res);
    }
}

export class BinPick extends BizBud {
    readonly bin: BizBin;
    readonly dataType = BudDataType.none;
    params: BizBudValue[];
    pick: PickBase;
    single: boolean;
    hiddenBuds: BizBud[];
    on: BizBud;
    constructor(bin: BizBin, name: string, ui: Partial<UI>) {
        super(bin, name, ui);
        this.bin = bin;
    }
    parser(context: PContext): PElement<IElement> {
        return new PBinPick(this, context);
    }
    override buildBudValue(expStringify: (value: ValueExpression) => string) {
        if (this.params === undefined) return;
        for (let param of this.params) {
            param.buildBudValue(expStringify);
        }
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
    from: BizFork;
    constructor(from: BizFork) {
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

export class BinInputFork extends BinInput {
    fork: BizFork;
    baseValue: ValueExpression;
    readonly params: [BizBud, ValueExpression, BudValueSetType][] = [];
    private baseValueStr: string;
    paramsArr: [number, string, string][];

    parser(context: PContext): PElement<IElement> {
        return new PBinInputFork(this, context);
    }

    override buildBudValue(expStringify: (value: ValueExpression) => string): void {
        super.buildBudValue(expStringify)
        this.baseValueStr = expStringify(this.baseValue);
        this.paramsArr = this.params.map(([bud, val, valueSetType]) => {
            return [bud?.id, expStringify(val), valueSetType === BudValueSetType.equ ? '=' : ':='];
        });
    }

    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.spec = this.fork?.id;
        ret.base = this.baseValueStr;
        ret.params = this.paramsArr;
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

export class BizBin extends BizID {
    protected readonly fields = ['id', 'pend', ...binFieldArr];
    readonly bizPhraseType = BizPhraseType.bin;
    readonly pickColl: { [name: string]: BinPick } = {};
    readonly inputColl: { [name: string]: BinInput } = {};
    readonly sheetArr: BizSheet[] = [];     // 被多少sheet引用了
    readonly div: BinDiv;    // 输入和显示的层级结构
    readonly outs: { [name: string]: UseOut } = {};
    readonly predefinedBuds: { [name: string]: BizBud } = {};
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

    buildPredefinedBuds() {
        [this.i, this.iBase, this.x, this.xBase, this.price, this.amount, this.value].forEach(v => {
            if (v === undefined) return;
            this.predefinedBuds[v.name] = v;
        })
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let picks: any[] = [];
        if (this.pickArr !== undefined) {
            for (let value of this.pickArr) {
                const { name, ui, pick, params, single, hiddenBuds, on } = value;
                let from: any;
                if (pick !== undefined) {
                    from = pick.fromSchema();
                }
                picks.push({
                    name,
                    ui,
                    from,
                    hidden: hiddenBuds?.map(v => v.id),
                    params: params?.map(v => v.buildSchema(res)),
                    single,
                    on: on?.id,
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

    getSheetMainBud(name: string): BizBud {
        /*
        for (let sheet of this.sheetArr) {
            let { main } = sheet;
            if (main === undefined) continue;
            let bud = main.getBud(name);
            if (bud !== undefined) return bud;
        }
        */
        if (this.main === undefined) return;
        let bud = this.main.getBud(name);
        if (bud !== undefined) return bud;
    }

    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        if (this.pickArr !== undefined) {
            for (let pick of this.pickArr) callback(pick);
        }
        if (this.inputArr !== undefined) {
            for (let input of this.inputArr) callback(input);
        }
        for (let i in this.predefinedBuds) {
            callback(this.predefinedBuds[i]);
        }
    }
    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        bud = this.predefinedBuds[name];
        return bud;
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

    checkUserDefault(prop: string) {
        for (let sheet of this.sheetArr) {
            if (sheet.checkUserDefault(prop) === true) {
                return true;
            }
        }
        return false;
    }
}

export class BizBinAct extends BizAct {
    readonly bizBin: BizBin;
    idParam: Field;

    constructor(biz: Biz, bizBin: BizBin) {
        super(biz);
        this.bizBin = bizBin;
    }

    get spaceEntity(): BizEntity { return this.bizBin; }

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
