import {
    PBizBudID, PBizBudChar as PBizBudCharBase, PBizBudCheck, PBizBudDate
    , PBizBudDec, PBizBudInt
    , PBizBudAny, PBizBudPickable, PBizBudRadio, PContext, PElement
    , PBizBudIXBase, PBizBudIDIO, PBizBudArr, PBinValue, PBizUser,
    PBizBudBin,
    PBizBudFork as PBizBudFork
} from "../../parser";
import { IElement } from "../IElement";
import { BizBase } from "./Base";
import { BizOptions, OptionsItemValueType } from "./Options";
import { BizEntity, BizID, BudIndex } from "./Entity";
import { ValueExpression } from "../Exp";
import { Biz } from "./Biz";
import { UI } from "../UI";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { BigInt, Char, DataType, Dec, JsonDataType } from "../datatype";
import { Field } from "../field";
import { BizBin } from "./Bin";
import { BizIDWithShowBuds } from "./BizID";
import { BizTie } from "./Tie";

export enum BudValueSetType {
    equ = 1,            // 设置不可修改. 这是默认
    init = 2,           // 只提供初值，可修改
    show = 3,           // 只显示，不保存
    bound = 4,          // Bin 字段跟pick字段的绑定，功能是equ
}

export type FieldShowItem = BizBud; // | (BizBud[]);

export type FieldShow = FieldShowItem[];

export const bizDecType = new Dec(18, 6);

export interface BudValue {
    exp: ValueExpression;
    str?: [string, BudValueSetType?];           // 传到前台的schema: init, equ, show
}

export interface BudValueSet extends BudValue {
    setType: BudValueSetType;
}

export class BudGroup extends BizBase {
    readonly bizPhraseType = BizPhraseType.budGroup;
    readonly buds: BizBud[] = [];

    constructor(biz: Biz, name: string) {
        super(biz);
        this.name = name;
    }
    parser(context: PContext): PElement<IElement> {
        return;
    }
    buildSchema(res: { [phrase: string]: string }): any {
        if (typeof this.id === 'object') debugger;
        let ret = super.buildSchema(res);
        if (this.buds.length > 0) {
            ret.buds = this.buds.map(v => v.id);
        }
        return ret;
    }
}

export abstract class BizBud extends BizBase {
    readonly entity: BizEntity;
    get bizPhraseType() { return BizPhraseType.bud; }
    abstract get dataType(): BudDataType;
    value: BudValueSet;
    show: boolean;              // 如果是必须显示true
    get objName(): string { return undefined; }
    flag: BudIndex = BudIndex.none;
    getFieldShows(): FieldShow[][] { return undefined }
    get IDEntity(): BizID { return undefined; }
    constructor(entity: BizEntity, name: string, ui: Partial<UI>) {
        super(entity?.biz);
        this.entity = entity;
        this.name = name;
        Object.assign(this.ui, ui);
    }
    abstract clone(entity: BizEntity, name: string, ui: Partial<UI>): BizBud;
    buildBudValue(expStringify: (value: ValueExpression) => string) { }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.dataType = this.dataType;
        ret.value = this.value?.str;
        return ret;
    }
    override get theEntity(): BizEntity {
        return this.entity;
    }
    createDataType(): DataType { return new BigInt(); }
    createField(): Field {
        let ret = new Field();
        ret.name = String(this.id); // this.name;
        ret.dataType = this.createDataType();
        ret.nullable = true;
        return ret;
    }
}

export enum SetType {
    assign,
    balance,
    cumulate,
}

export abstract class BizBudValue extends BizBud {
    abstract get canIndex(): boolean;
    hasHistory: boolean;
    setType: SetType;
    required: boolean;
    get optionsItemType(): OptionsItemValueType { return; }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.history = this.hasHistory === true ? true : undefined;
        ret.setType = this.setType ?? SetType.assign;
        return ret;
    }
    override buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        super.buildPhrases(phrases, prefix);
    }
    buildBudValue(expStringify: (value: ValueExpression) => string) {
        if (this.value === undefined) return;
        let { exp, str, setType } = this.value;
        if (str !== undefined) return;
        this.value.str = [expStringify(exp), setType];
    }
}

// 存放fork的原始值。json多个属性
export class BizBudFork extends BizBudValue {
    readonly dataType = BudDataType.fork;
    readonly canIndex = false;
    baseBudName: string;
    baseBud: BizBud;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudFork(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudFork(this, context);
    }
    createDataType(): DataType { return new JsonDataType(); }
    buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        if (this.baseBud !== undefined) {
            ret.base = this.baseBud.id;
        }
        return ret;
    }
}

export class BizBudArr extends BizBudValue {
    readonly dataType = BudDataType.arr;
    readonly canIndex = false;
    readonly props: Map<string, BizBudValue> = new Map();
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudArr(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudArr(this, context);
    }
    buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        if (this.props.size > 0) {
            let props = [];
            for (let [, value] of this.props) {
                props.push(value.buildSchema(res));
            }
            Object.assign(ret, { props });
        }
        return ret;
    }
    createDataType(): DataType { return new JsonDataType(); }
}

export class BizUser extends BizBud {
    readonly dataType = BudDataType.user;
    readonly defaults: BizBudValue[] = [];
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizUser(entity, name, ui);
    }
    override parser(context: PContext): PElement<IElement> {
        return new PBizUser(this, context);
    }
    override buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        super.buildPhrases(phrases, prefix);
    }
}

export class BizBudPickable extends BizBudValue {
    readonly dataType = BudDataType.atom;
    readonly canIndex = false;
    pick: string;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudPickable(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudPickable(this, context);
    }
    buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.pick = this.pick;
        return ret;
    }
}

// 有值，但无法确定
export class BizBudAny extends BizBudValue {
    readonly dataType = BudDataType.any;
    readonly canIndex = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudAny(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudAny(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
    createDataType(): DataType { return new Char(200); }
}

export class BizBudJson extends BizBudAny {
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudJson(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return; // new PBizBudJson(this, context);
    }
    createDataType(): DataType { return new JsonDataType(); }
}

export abstract class BizBudValueWithRange extends BizBudValue {
    min: BudValue;
    max: BudValue;
    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        if (this.min !== undefined) {
            ret.min = this.min.str;
        }
        if (this.max !== undefined) {
            ret.max = this.max.str;
        }
        return ret;
    }
    override buildBudValue(expStringify: (value: ValueExpression) => string): void {
        super.buildBudValue(expStringify);
        if (this.min !== undefined) {
            this.min.str = [expStringify(this.min.exp)];
        }
        if (this.max !== undefined) {
            this.max.str = [expStringify(this.max.exp)];
        }
    }
}

export class BizBudInt extends BizBudValueWithRange {
    readonly dataType = BudDataType.int;
    readonly canIndex = true;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudInt(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudInt(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudDec extends BizBudValueWithRange {
    readonly dataType = BudDataType.dec;
    readonly canIndex = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudDec(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDec(this, context);
    }
    createDataType(): DataType { return bizDecType; }
}

export class BinValue extends BizBudDec {
    readonly values: BizBudDec[] = [];
    override parser(context: PContext): PElement<IElement> {
        return new PBinValue(this, context);
    }
    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.values = this.values.map(v => v.buildSchema(res));
        return ret;
    }
    override buildBudValue(expStringify: (value: ValueExpression) => string): void {
        super.buildBudValue(expStringify);
        for (let v of this.values) {
            v.buildBudValue(expStringify);
        }
    }
}

export class BizBudChar extends BizBudValueWithRange {
    readonly dataType = BudDataType.char;
    readonly canIndex = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudChar(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudCharBase(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
    createDataType(): DataType { return new Char(200); }
}

export class BizBudNO extends BizBudChar {
    createDataType(): DataType { return new Char(30); }
}

export class BizBudDate extends BizBudValueWithRange {
    readonly dataType = BudDataType.date;
    readonly canIndex = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudDate(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDate(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

// 可以用tie限定，包括ID或options
export abstract class BizBudTieable extends BizBudValue {
    tie: BizTie | BizBud;  // tie or by a indexed bud
    // bud: BizBud;            // or tied by a bud
    tieOn: ValueExpression;
    private tieOnStr: string;
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.tie !== undefined) {
            ret.tie = {
                id: this.tie.id,
                on: this.tieOnStr,
            }
        }
        return ret;
    }
    buildBudValue(expStringify: (value: ValueExpression) => string) {
        super.buildBudValue(expStringify);
        if (this.tieOn !== undefined) {
            this.tieOnStr = expStringify(this.tieOn);
        }
    }
}

export abstract class BizBudIDBase extends BizBudTieable {
    readonly dataType = BudDataType.atom;
    readonly canIndex = true;
    ID: BizIDWithShowBuds;
    fieldShows: FieldShow[];
    abstract get isIxBase(): boolean;
    get IDEntity(): BizID { return this.ID; }
    getFieldShows(): FieldShow[][] {
        let ret = [];
        if (this.fieldShows !== undefined) ret.push(this.fieldShows);
        const has = (bud: BizBud) => {
            let { id } = bud;
            for (let arr of ret) {
                for (let fs of arr) {
                    if (fs.length !== 2) return false;
                    if (fs[0].id === this.id && fs[1].id === id) return true;
                }
            }
            return false;
        }
        const push = (buds: BizBud[]) => {
            if (buds === undefined) return;
            let retBuds: FieldShow[] = [];
            for (let bud of buds) {
                if (has(bud) === true) {
                    continue;
                }
                retBuds.push([this, bud]);
            }
            ret.push(retBuds);
        }
        if (this.ID !== undefined) {
            // 有些 ID 字段，没有申明类型
            let { titleBuds, primeBuds } = this.ID;
            push(titleBuds);
            push(primeBuds);
        }
        return ret;
    }
    readonly params: { [param: string]: BudValueSet; } = {};        // 仅仅针对Spec，可能有多级的base
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.atom = this.ID?.id;
        let hasParams: boolean = false;
        let params = {} as any;
        for (let i in this.params) {
            params[i] = this.params[i].str;
            hasParams = true;
        }
        if (hasParams === true) {
            ret.params = params;
        }
        if (this.fieldShows !== undefined) {
            ret.fieldShows = this.fieldShows.map(v => {
                return v.map(i => i.id);
            });
        }
        return ret;
    }
    get objName(): string { return this.ID?.phrase; }
    buildBudValue(expStringify: (value: ValueExpression) => string) {
        super.buildBudValue(expStringify);
        for (let i in this.params) {
            let param = this.params[i];
            let { exp } = param;
            param.str = [expStringify(exp)];
        }
    }
}

export class BizBudID extends BizBudIDBase {
    readonly isIxBase = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudID(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudID(this, context);
    }
}

// Base here is I.base or X.base
export class BizBudIXBase extends BizBudIDBase {
    readonly isIxBase = true;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudIXBase(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudIXBase(this, context);
    }
}

// ID的属性定义，ID表示需要转换
// 后面仅仅可以Atom
export class BizBudIDIO extends BizBudValue {
    readonly dataType = BudDataType.ID;
    readonly canIndex = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudIDIO(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudIDIO(this, context);
    }
}

export enum EnumSysBud {
    id = 1,
    sheetNo = 2,
    sheetOperator = 3,
    sheetDate = 4,
    atomNo = 5,
    atomEx = 6,
}
export class BizBudBin extends BizBudValue {
    readonly dataType = BudDataType.bin;
    readonly canIndex = false;
    bin: BizBin;
    get IDEntity(): BizID { return this.bin; }
    sysNO: boolean;
    sysBuds: EnumSysBud[];
    showBuds: BizBud[][];
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudBin(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudBin(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.bin = this.bin.id;
        ret.sysBuds = this.sysBuds;
        ret.showBuds = this.showBuds?.map(v => {
            return v.map(vi => vi?.id);
        });
        return ret;
    }
    getFieldShows(): FieldShow[][] {
        if (this.showBuds === undefined) return;
        return [this.showBuds.map(v => {
            return ([this, ...v]);
        })];
    }
}

export abstract class BizBudOptions extends BizBudTieable {
    options: BizOptions;
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.options === undefined) {
            // 如果是查询字段，有可能没有options定义
            // debugger;
        }
        else {
            ret.options = this.options.id;
        }
        return ret;
    }
    get objName(): string {
        if (this.options === undefined) return;
        return this.options.phrase;
    }
}

export class BizBudRadio extends BizBudOptions {
    readonly dataType = BudDataType.radio;
    readonly canIndex = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudRadio(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudRadio(this, context);
    }
}

export class BizBudCheck extends BizBudOptions {
    readonly dataType = BudDataType.check;
    readonly canIndex = false;
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new BizBudCheck(entity, name, ui);
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudCheck(this, context);
    }
    createDataType(): DataType { return new JsonDataType(); }
}

export const budClassesIn: { [key: string]: new (entity: BizEntity, name: string, ui: Partial<UI>) => BizBudValue } = {
    int: BizBudInt,
    dec: BizBudDec,
    no: BizBudNO,
    char: BizBudChar,
    date: BizBudDate,
    id: BizBudIDIO,
    bin: BizBudBin,
    fork: BizBudFork,
    $arr: BizBudArr,
}
export const budClasses: { [key: string]: new (entity: BizEntity, name: string, ui: Partial<UI>) => BizBudValue } = {
    ...budClassesIn,
    none: BizBudAny,
    atom: BizBudID,
    id: BizBudID,
    radio: BizBudRadio,
    check: BizBudCheck,
    binValue: BinValue
}
export const budClassesUser: { [key: string]: new (entity: BizEntity, name: string, ui: Partial<UI>) => BizBudValue } = {
    int: BizBudInt,
    dec: BizBudDec,
    char: BizBudChar,
    date: BizBudDate,
    atom: BizBudID,
    id: BizBudID,
    radio: BizBudRadio,
}
export const budClassKeys = Object.keys(budClasses);
export const budClassKeysIn = Object.keys(budClassesIn);
export const budClassesOut: { [key: string]: new (entity: BizEntity, name: string, ui: Partial<UI>) => BizBudValue } = {
    ...budClassesIn,
}
export const budClassKeysOut = Object.keys(budClassesOut);
