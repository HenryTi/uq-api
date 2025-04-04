import { binAmount, binFieldArr, binPrice, binValue } from "../../../consts";
import {
    BizBin, BizBinAct, Field, Statements, Statement, BizBinActStatements
    , Uq, Entity, Table, Pointer, NamePointer
    , BizBudValue, bigIntField, BizEntity, BinPick, PickPend
    , DotVarPointer, EnumSysTable, BizBinActFieldSpace, BizBudDec, BudValue, BinInput
    , BinInputFork, BinInputAtom, BinDiv, BizBudIXBase, BizStatementBin
    , BizOut, UseOut, BinValue, UI, BinPivot, BizBudRadio, OptionsItem,
    BudValueSetType,
    BizFromEntity,
    BizFieldSpace,
    BizField,
    BizBudFork,
    BizBud,
    ValueExpression,
    BizBinBase,
    BizBinBaseAct
} from "../../../il";
import { BizPhraseType, BudDataType } from "../../../il/Biz/BizPhraseType";
import { PContext } from "../../pContext";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { PBizAct, PBizActStatements, PBizEntity } from "../Base";
import { BizEntitySpace } from "../Biz";
import { PBizBudValue } from "../Bud";

enum EnumIX {
    i, x
}

export abstract class PBizBinBase<T extends BizBinBase> extends PBizEntity<T> {
    protected parseAct = () => {
        const { act } = this.element;
        if (act !== undefined) {
            this.ts.error('ACT can only be defined once');
        }
        let bizBinAct = this.createBizBinBaseAct();
        this.element.act = bizBinAct;
        this.context.parseElement(bizBinAct);
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    protected abstract createBizBinBaseAct(): BizBinBaseAct<T>;
}

export class PBizBin extends PBizBinBase<BizBin> {
    private main: string;
    private pickPendPos: number;
    private div: BinDiv;
    private primeBuds: string[];

    constructor(element: BizBin, context: PContext) {
        super(element, context);
        this.div = element.div;
        if (this.div === undefined) debugger;
    }

    protected createBizBinBaseAct(): BizBinAct {
        return new BizBinAct(this.element.biz, this.element);
    }

    private parseMain = () => {
        this.main = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parsePick = () => {
        let name = this.ts.passVar();
        this.parsePickProp(name);
    }

    private parsePend = () => {
        this.parsePickProp('pend');
    }

    private parsePickProp(name: string) {
        let ui = this.parseUI();
        let pick = new BinPick(this.element, name, ui);
        this.context.parseElement(pick);
        this.element.setPick(pick);
    }

    private parseInput = () => {
        let name = this.ts.passVar();
        let ui = this.parseUI();
        let input: BinInput;
        if (this.ts.isKeywords('spec', 'fork') === true) {
            this.ts.readToken();
            input = new BinInputFork(this.element, name, ui);
        }
        else if (this.ts.isKeyword('atom') === true) {
            this.ts.readToken();
            input = new BinInputAtom(this.element, name, ui);
        }
        else {
            this.ts.expect('FORK', 'SPEC', 'ATOM');
        }
        this.context.parseElement(input);
        this.element.setInput(input);
        this.div.inputs.push(input);
    }

    private parseIXID(IX: EnumIX) {
        let bud = this.parseBudAtom(EnumIX[IX]);
        this.div.buds.push(bud);
        return bud;
    }

    private parseIXIDBase(IX: EnumIX) {
        this.ts.readToken();
        this.ts.passKey('base');
        let nameIX = EnumIX[IX];
        let bud = new BizBudIXBase(this.element, nameIX + 'base', undefined);
        this.context.parseElement(bud);
        const { value } = bud;
        if (value?.setType !== BudValueSetType.equ) {
            // 如果本来pend.id就是批次，也就不需要=
            // this.ts.error(`${nameIX}.BASE must set value`);
        }
        this.div.buds.push(bud);
        this.ts.passToken(Token.SEMICOLON);
        return bud;
    }

    private parseI = () => {
        if (this.ts.token === Token.DOT) {
            let budKeyID = this.parseIXIDBase(EnumIX.i);
            if (this.element.iBase !== undefined) {
                this.ts.error(`I.BASE can only be defined once in Biz Bin`);
            }
            this.element.iBase = budKeyID;
            return;
        }

        let budKeyID = this.parseIXID(EnumIX.i);
        if (this.element.i !== undefined) {
            this.ts.error(`I can only be defined once in Biz Bin`);
        }
        this.element.i = budKeyID;
    }

    private parseX = () => {
        if (this.ts.token === Token.DOT) {
            let budKeyID = this.parseIXIDBase(EnumIX.x);
            if (this.element.xBase !== undefined) {
                this.ts.error(`X.BASE can only be defined once in Biz Bin`);
            }
            this.element.xBase = budKeyID;
            return;
        }
        let budKeyID = this.parseIXID(EnumIX.x);
        if (this.element.x !== undefined) {
            this.ts.error(`X can only be defined once in Biz Bin`);
        }
        this.element.x = budKeyID;
    }

    private parseValueBud(bud: BizBudValue, budName: string, defaultType: string = 'dec') {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let ui = this.parseUI();
        let bizBud = this.parseBud(budName, ui, defaultType);
        if (this.ts.prevToken !== Token.RBRACE) {
            this.ts.passToken(Token.SEMICOLON);
        }
        return bizBud as BizBudDec;
    }

    private parseValue = () => {
        let bud = this.parseValueBud(this.element.value, binValue, 'binValue');
        this.element.value = bud as BinValue;
        this.div.buds.push(bud);
    }

    private parsePrice = () => {
        let bud = this.parseValueBud(this.element.price, binPrice);
        this.element.price = bud;
        this.div.buds.push(bud);
    }

    private parseAmount = () => {
        let bud = this.parseValueBud(this.element.amount, binAmount);
        this.element.amount = bud;
        this.div.buds.push(bud);
    }

    private parsePivot = () => {
        const keyParse: { [key: string]: () => void } = {
            key: this.parsePivotKey,
            prop: this.parseBinProp,
            value: this.parseValue,
            amount: this.parseAmount,
            format: this.parsePivotFormat,
        }
        this.parseDivOrPivot(keyParse, BinPivot);
        this.element.pivot = this.div;
    }

    private parseDiv = () => {
        const keyParse: { [key: string]: () => void } = {
            input: this.parseInput,
            div: this.parseDiv,
            pivot: this.parsePivot,
            prop: this.parseBinProp,
            i: this.parseI,
            x: this.parseX,
            value: this.parseValue,
            price: this.parsePrice,
            amount: this.parseAmount,
        }
        this.parseDivOrPivot(keyParse, BinDiv);
    }

    private parseDivOrPivot(keyParse: { [key: string]: () => void }, BinDivNew: new (binDiv: BinDiv, ui: Partial<UI>) => BinDiv) {
        if (this.div.div !== undefined) {
            this.ts.error(`duplicate DIV`);
        }
        if (this.div === this.element.pivot) {
            this.ts.error('can not define PIVOT or DIV in PIVOT');
        }
        let ui = this.parseUI();
        this.div = new BinDivNew(this.div, ui);
        this.ts.passToken(Token.LBRACE);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) {
                this.ts.readToken();
                this.div = this.div.parent;
                if (this.div === undefined) this.div = this.element.div;
                break;
            }
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let parse = keyParse[this.ts.lowerVar];
            if (parse === undefined) {
                this.ts.error(`Unknown ${this.ts._var}`);
            }
            this.ts.readToken();
            parse();
        }
    }

    private parseBinProp = () => {
        let { group, budArr } = this.parseProp();
        if (group !== undefined && group.name !== '-') {
            this.ts.error(`Bin prop group should not have name`);
        }
        this.div.buds.push(...budArr);
    }

    private parsePivotKey = () => {
        let { group, budArr } = this.parseProp();
        if (group !== undefined || budArr.length > 1) {
            this.ts.error(`Pivot only one KEY`);
        }
        let key = budArr[0] as BizBudValue;
        let { ui } = key;
        if (ui === undefined) {
            ui = { required: true };
        }
        else {
            ui.required = true;
        }
        key.required = true;
        this.div.buds.push(key);
        this.div.key = key;
    }

    private parsePivotFormat = () => {
        let pivotFormat = this.div.pivotFormat = [];
        for (; ;) {
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let bud = this.ts.lowerVar;
            this.ts.readToken();
            let withLabel: boolean;
            if (this.ts.token === Token.BITWISEAND) {
                withLabel = true;
                this.ts.readToken();
            }
            else {
                withLabel = false;
            }
            let exclude: string;
            if (this.ts.token === Token.Exclamation) {
                this.ts.readToken();
                if (this.ts.token !== Token.VAR as any) {
                    this.ts.expectToken(Token.VAR);
                }
                exclude = this.ts.lowerVar;
                this.ts.readToken();
            }
            pivotFormat.push([bud, withLabel, exclude]);
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token === Token.SEMICOLON) {
                this.ts.readToken();
                break;
            }
            this.ts.expectToken(Token.SEMICOLON, Token.COMMA);
        }
    }

    protected parseColonBuds = () => {
        this.parsePrimeBuds();
    }

    private parsePrimeBuds() {
        this.primeBuds = this.parseBudNameArr();
    }

    readonly keyColl = {
        ':': this.parseColonBuds,
        main: this.parseMain,
        pick: this.parsePick,
        pend: this.parsePend,
        input: this.parseInput,
        div: this.parseDiv,
        pivot: this.parsePivot,
        prop: this.parseBinProp,
        i: this.parseI,
        x: this.parseX,
        value: this.parseValue,
        price: this.parsePrice,
        amount: this.parseAmount,
        act: this.parseAct,
    };

    scan0(space: Space): boolean {
        let ok = super.scan0(space);
        const { pickArr, act } = this.element;
        this.element.buildPredefinedBuds();
        if (pickArr !== undefined) {
            for (let pick of pickArr) {
                if (pick.pelement.scan0(space) === false) {
                    ok = false;
                }
            }
            let { length } = pickArr;
            let end = length;
            if (end >= 1) {
                let { pick: pickBase } = pickArr[end - 1];
                if (pickBase !== undefined && pickBase.bizPhraseType === BizPhraseType.pend) {
                    let pend = (pickBase as PickPend).from;
                    if (pend === undefined) debugger;
                    this.element.pend = pend;
                    end--;
                }
            }
            this.pickPendPos = end;
        }
        if (act !== undefined) {
            if (act.pelement.scan0(space) === false) {
                ok = false;
            }
        }
        let binSpace = new BizBinSpace(space, this.element);
        if (this.main !== undefined) {
            let { bizEntityArr: [m] } = binSpace.getBizFromEntityArrFromName(this.main);
            if (m === undefined || m.bizPhraseType !== BizPhraseType.bin) {
                this.log(`${this.main} is not BIN`);
                ok = false;
            }
            else if (this.element.name === this.main) {
                this.log(`MAIN can not be self`);
                ok = false;
            }
            else {
                this.element.main = m as BizBin;
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { pend, main } = this.element;
        if (pend === undefined) {
            if (main !== undefined) {
                this.element.pend = main.pend;
            }
        }
        let binSpace = new BizBinSpace(space, this.element);

        const { iBase, xBase } = this.element;
        if (iBase !== undefined) {
            if (this.element.i === undefined) {
                this.log('i.base need I declare');
                ok = false;
            }
            if (this.scanBud(binSpace, iBase) === false) {
                ok = false;
            }
        }

        if (xBase !== undefined) {
            if (this.element.x === undefined) {
                this.log('x.base need X declare');
                ok = false;
            }
            if (this.scanBud(binSpace, xBase) === false) {
                ok = false;
            }
        }

        const { pickArr, inputArr, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (pickArr !== undefined) {
            let { length } = pickArr;
            for (let i = 0; i < length; i++) {
                let pick = pickArr[i];
                if (pick.name === undefined) pick.name = '$pick' + i;
                if (pick.pelement.scan(binSpace) === false) {
                    ok = false;
                }
                if (i < this.pickPendPos) {
                    if (pick.single !== undefined) {
                        this.log(`Only last PICK can set SINGLE propertity`);
                        ok = false;
                    }
                    const { pick: pickBase } = pick;
                    if (pickBase?.bizPhraseType === BizPhraseType.pend) {
                        this.log(`Only last PICK can be from PEND`);
                        ok = false;
                    }
                }
            }
        }
        if (inputArr !== undefined) {
            for (let input of inputArr) {
                if (input.pelement.scan(binSpace) === false) {
                    ok = false;
                }
            }
        }
        if (i !== undefined) {
            if (this.scanBud(binSpace, i) === false) {
                ok = false;
            }
        }
        if (x !== undefined) {
            if (this.scanBud(binSpace, x) === false) {
                ok = false;
            }
        }

        const scanBudValue = (bud: BizBudDec) => {
            if (bud === undefined) return;
            const { dataType } = bud;
            if (dataType !== BudDataType.dec && dataType !== BudDataType.none) {
                this.log(`${bud.getJName()} can only be DEC`);
                ok = false;
            }
            const { value, min, max } = bud;
            function scanValue(v: BudValue) {
                if (v === undefined) return;
                const { exp } = v;
                if (exp !== undefined) {
                    if (exp.pelement.scan(binSpace) === false) {
                        ok = false;
                    }
                }
            }
            scanValue(value);
            scanValue(min);
            scanValue(max);
        }

        scanBudValue(budValue);
        scanBudValue(budAmount);
        scanBudValue(budPrice);

        if (super.scan(binSpace) === false) ok = false;

        let { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan(binSpace) === false) {
                ok = false;
            }
        }
        Object.assign(this.element.outs, binSpace.bizOuts);
        this.scanPrimeBuds();
        return ok;
    }

    private scanPrimeBuds() {
        let ok = true;
        if (this.primeBuds !== undefined) {
            let ret = this.scanBudNameArr(this.primeBuds);
            if (ret === null) {
                ok = false;
            }
            else if (ret !== undefined) {
                let primeBuds = this.element.primeBuds = ret;
                for (let bud of primeBuds) bud.show = true;
                return ret;
            }
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (super.scan2(uq) === false) {
            ok = false;
        }
        let { div, i, x, iBase, xBase, pickArr } = this.element;
        for (; div !== undefined; div = div.div) {
            let { pivotFormat: format } = div;
            if (format === undefined) continue;
            let nf: any[] = [];
            for (let [budName, withLabel, exclude] of format) {
                let bud = this.element.getBud(budName);
                if (bud === undefined) {
                    ok = false;
                    this.log(`FORMAT ${bud} not exists`);
                    continue;
                }
                let itemExclude: OptionsItem;
                if (bud.dataType === BudDataType.radio && exclude !== undefined) {
                    let { options } = bud as BizBudRadio;
                    itemExclude = options.items.find(v => v.name === exclude || v.itemValue === exclude);
                    if (itemExclude === undefined) {
                        ok = false;
                        this.log(`FORMAT !${exclude} not exists`);
                    }
                }
                nf.push([bud, withLabel, itemExclude]);
            }
            div.pivotFormat = nf;
        }
        if (i !== undefined) {
            const { ID } = i;
            if (ID !== undefined) {
                if (ID.bizPhraseType === BizPhraseType.fork) {
                    if (iBase === undefined) {
                        // 不一定需要I.Base
                        // ok = false;
                        // this.log('I Spec need I.base');
                    }
                }
            }
        }
        if (x !== undefined) {
            const { ID } = x;
            if (ID !== undefined) {
                if (ID.bizPhraseType === BizPhraseType.fork) {
                    if (xBase === undefined) {
                        // ok = false;
                        // this.log('X Spec need X.base');
                    }
                }
            }
        }
        if (pickArr !== undefined) {
            for (let pick of pickArr) {
                if (pick.pelement.scan2(uq) === false) {
                    ok = false;
                }
            }
        }

        // check bud fork and query bound
        let budBound: BizBud;
        for (let [, bud] of this.element.props) {
            const { dataType, value } = bud;
            if (value?.setType === BudValueSetType.bound) {
                if (budBound !== undefined) {
                    ok = false;
                    this.log(`QUERY bound :: 只能有一个`);
                }
                else {
                    if (this.scanBudBound(bud) === false) ok = false;
                }
                budBound = bud;
            }
            if (dataType !== BudDataType.fork) continue;
            let budFork = bud as BizBudFork;
            const { baseBudName } = budFork;
            if (baseBudName !== undefined) {
                let baseBud: BizBud;
                switch (baseBudName) {
                    default: baseBud = this.element.props.get(baseBudName); break;
                    case 'i': baseBud = this.element.i; break;
                    case 'x': baseBud = this.element.x; break;
                }
                if (baseBud === undefined) {
                    ok = false;
                    this.log(`FORK BASE ${baseBudName} not defined`);
                }
                else {
                    budFork.baseBud = baseBud;
                }
            }
        }
        return ok;
    }

    private scanBudBound(bud: BizBud): boolean {
        const { dataType } = bud;
        let jName = bud.getJName();
        switch (dataType) {
            case BudDataType.atom:
            case BudDataType.ID:
            case BudDataType.bin:
                break;
            default:
                this.log(`${jName} 不是ID字段，不能::bound`);
                return false;
        }
        const { value } = bud;
        if (value !== undefined) {
            //let {scalarValue} = value.exp;//.getBud();
            let vBud = this.getBoundBud(value.exp);
            if (vBud === undefined) {
                this.log(`${jName} 只能bound Pick 的ID字段`);
                return false;
            }
        }
        return true;
    }

    private getBoundBud(exp: ValueExpression) {
        const { scalarValue } = exp;
        if (scalarValue === undefined) return undefined;
        if (Array.isArray(scalarValue) === false) return undefined;
        if (scalarValue.length !== 2) return undefined;
        const [pickName, fieldName] = scalarValue;
        const { pickArr } = this.element;
        if (pickArr === undefined) return undefined;
        let rearPick = pickArr[pickArr.length - 1];
        if (pickName !== rearPick.name) return undefined;
        let pBud = rearPick.pick.getBud(fieldName);
        if (pBud === undefined) return undefined;
        switch (pBud.dataType) {
            default: return undefined;
            case BudDataType.atom:
            case BudDataType.ID:
            case BudDataType.bin:
                return pBud;
        }
    }

    bizEntityScan2(bizEntity: BizEntity): boolean {
        let ok = super.bizEntityScan2(bizEntity);
        let { i, x, iBase, xBase } = this.element;
        function check2(bizBud: BizBudValue) {
            if (bizBud === undefined) return;
            let { pelement } = bizBud;
            if (pelement !== undefined) {
                if ((pelement as PBizBudValue<any>).bizEntityScan2(bizEntity) === false) ok = false;
            }
        }
        check2(i);
        check2(iBase);
        check2(x);
        check2(xBase);
        return ok;
    }
}

export const binPreDefined = [
    '$site', '$user'
    , 'bin',
    , 's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
    , ...binFieldArr
];
export class BizBinSpace extends BizEntitySpace<BizBin> {
    protected readonly bizFieldSpace: BizFieldSpace;
    readonly bizOuts: { [name: string]: UseOut; } = {};

    constructor(outer: Space, bizBin: BizBin) {
        super(outer, bizBin);
        this.bizFieldSpace = new BizBinActFieldSpace(bizBin);
    }

    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (binPreDefined.indexOf(name) >= 0) {
            switch (name) {
                default: break;
                case 'ibase': if (this.bizEntity.iBase === undefined) return; break;
                case 'xbase': if (this.bizEntity.xBase === undefined) return; break;
            }
            return new NamePointer(name);
        }
        if (this.bizEntity.props.has(name) === true) {
            return new NamePointer(name);
        }
        let pick = this.bizEntity.pickColl[name];
        if (pick !== undefined) {
            return new NamePointer(name);
        }
        else {
            let input = this.bizEntity.inputColl[name];
            if (input !== undefined) {
                return new NamePointer(name);
            }
        }
    }

    protected _varsPointer(names: string[]): [Pointer, string] {
        let [pickName, pickProp] = names;
        let pick = this.bizEntity.pickColl[pickName];
        if (pick === undefined) {
            return;
        }
        const { pick: pickBase } = pick;
        if (pickBase !== undefined && pickBase.hasReturn(pickProp) === false) {
            return [undefined, `Pick '${pickName}' has no return '${pickProp}'`];
        }
        let bud = pickBase.getBud(pickProp);
        if (bud === undefined) {
            //bud = pickBase.getBud(pickProp);
            //return [undefined, `Pick '${pickName}' has no PROP '${pickProp}'`];
        }
        return [new DotVarPointer(bud), undefined];
    }

    protected override _getBizFromEntityFromAlias(name: string): BizFromEntity {
        switch (name) {
            default:
                return super._getBizFromEntityFromAlias(name);
            case 'pend':
                let { pend } = this.bizEntity;
                if (pend === undefined) return;
                let fe = new BizFromEntity(undefined);
                fe.bizEntityArr = [pend];
                fe.bizPhraseType = BizPhraseType.pend;
                fe.bizEntityTable = EnumSysTable.pend;
                return fe;
        }
    }

    protected override _getBizField(names: string[]): BizField {
        return this.bizFieldSpace.getBizField(names);
    }

    protected _regUseBizOut(out: BizOut, to: boolean): UseOut {
        let { name } = out;
        let bo = this.bizOuts[name];
        if (bo !== undefined && bo.to === true) to = true;
        let useOut = new UseOut(out, to);
        this.bizOuts[name] = useOut;
        return useOut;
    }
}

class BizBinActSpace extends BizEntitySpace<BizBin> { // BizBinSpace {
    private varNo: number = 1;
    private readonly bizFieldSpace: BizFieldSpace;

    constructor(outer: Space, bizBin: BizBin) {
        super(outer, bizBin);
        this.bizFieldSpace = new BizBinActFieldSpace(this.bizEntity);
    }

    protected _varPointer(name: string, isField: boolean): Pointer {
        if (binPreDefined.indexOf(name) >= 0) {
            return new NamePointer(name);
        }
    }

    protected _varsPointer(names: string[]): [Pointer, string] {
        return undefined;
    }

    getVarNo() { return this.varNo; }
    setVarNo(value: number) { this.varNo = value; }

    protected override _getBizFromEntityFromAlias(name: string) {
        switch (name) {
            default:
                return super._getBizFromEntityFromAlias(name);
            case 'pend':
                return;
        }
    }

    protected override _getBizField(names: string[]): BizField {
        return this.bizFieldSpace.getBizField(names);
    }
}

export class PBizBinAct extends PBizAct<BizBinAct> {
    protected override parseParam(): void {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.passToken(Token.LPARENTHESE);
            let field = new Field();
            field.parser(this.context).parse();
            this.element.idParam = field;
            if (field.dataType.type !== 'id') {
                this.ts.error(`${field.name} datatype must be ID`);
            }
            this.ts.passToken(Token.RPARENTHESE);
        }
        else {
            let field = bigIntField('detailid');
            this.element.idParam = field;
        }
    }

    protected override createBizActStatements(): Statements {
        return new BizBinActStatements(undefined, this.element);
    }

    protected override createBizActSpace(space: Space): Space {
        return new BizBinActSpace(space, this.element.bizBin);
    }
}

export class PBizBinActStatements extends PBizActStatements<BizBinAct> {
    protected override createBizActStatement(parent: Statement): Statement {
        return new BizStatementBin(parent, this.bizAct);
    }
}
