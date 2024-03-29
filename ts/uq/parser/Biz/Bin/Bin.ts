import { binAmount, binFieldArr, binPrice, binValue } from "../../../consts";
import {
    BizBin, BizBinAct, Field, Statements, Statement, BizBinActStatements //, BizBinActStatement
    , Uq, Entity, Table, Pointer, VarPointer, BudDataType
    , BizBudValue, bigIntField, BizEntity, BinPick, PickPend
    , DotVarPointer, EnumSysTable, BizBinActFieldSpace, BizBudDec, BudValue, BinInput, BinInputSpec, BinInputAtom, BinDiv, BizBudIDBase, BizPhraseType, BizStatement, BizStatementBin, BizOut, BizIOSite, BizIOApp, UseOut, IOAppOut, BinValue
} from "../../../il";
import { PContext } from "../../pContext";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { PBizAct, PBizActStatements, PBizBase, PBizEntity } from "../Base";
import { BizEntitySpace } from "../Biz";
import { PBizBud, PBizBudDec, PBizBudValue } from "../Bud";

export class PBizBin extends PBizEntity<BizBin> {
    private main: string;
    private pickPendPos: number;
    private div: BinDiv;
    private iBase: BizBudIDBase;
    private xBase: BizBudIDBase;
    constructor(element: BizBin, context: PContext) {
        super(element, context);
        this.div = element.div;
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
        if (this.ts.isKeyword('spec') === true) {
            this.ts.readToken();
            input = new BinInputSpec(this.element, name, ui);
        }
        else if (this.ts.isKeyword('atom') === true) {
            this.ts.readToken();
            input = new BinInputAtom(this.element, name, ui);
        }
        else {
            this.ts.expect('SPEC', 'ATOM');
        }
        this.context.parseElement(input);
        this.element.setInput(input);
        this.div.inputs.push(input);
    }

    private parseKeyID(keyID: 'i' | 'x') {
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.ts.passKey('base');
            let bud = new BizBudIDBase(this.element.biz, '.' + keyID, undefined);
            this.div.buds.push(bud);
            this.ts.passToken(Token.SEMICOLON);
            return bud;
        }
        else {
            let bud = this.parseBudAtom(keyID);
            this.div.buds.push(bud);
            return bud;
        }
    }

    private parseI = () => {
        let budKeyID = this.parseKeyID('i');
        if (budKeyID.dataType === BudDataType.none) {
            this.iBase = budKeyID;
            return;
        }
        if (this.element.i !== undefined) {
            this.ts.error(`I can only be defined once in Biz Bin`);
        }
        this.element.i = budKeyID;
    }

    private parseX = () => {
        let budKeyID = this.parseKeyID('x');
        if (budKeyID.dataType === BudDataType.none) {
            this.xBase = budKeyID;
            return;
        }
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

    private parseDiv = () => {
        if (this.div.div !== undefined) {
            this.ts.error(`duplicate DIV`);
        }
        const keyParse: { [key: string]: () => void } = {
            input: this.parseInput,
            div: this.parseDiv,
            prop: this.parseBinProp,
            i: this.parseI,
            x: this.parseX,
            value: this.parseValue,
            price: this.parsePrice,
            amount: this.parseAmount,
        }
        let ui = this.parseUI();
        this.div = new BinDiv(this.div, ui);
        this.ts.passToken(Token.LBRACE);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) {
                this.ts.readToken();
                this.div = this.div.parent;
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

    private parseAct = () => {
        const { act } = this.element;
        if (act !== undefined) {
            this.ts.error('ACT can only be defined once');
        }
        let bizBinAct = new BizBinAct(this.element.biz, this.element);
        this.element.act = bizBinAct;
        this.context.parseElement(bizBinAct);
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    readonly keyColl = {
        main: this.parseMain,
        pick: this.parsePick,
        pend: this.parsePend,
        input: this.parseInput,
        div: this.parseDiv,
        prop: this.parseBinProp,
        i: this.parseI,
        x: this.parseX,
        value: this.parseValue,
        price: this.parsePrice,
        amount: this.parseAmount,
        act: this.parseAct,
    };

    scan0(space: Space): boolean {
        let ok = true;
        const { pickArr, inputArr, act } = this.element;
        if (pickArr !== undefined) {
            for (let pick of pickArr) {
                if (pick.pelement.scan0(space) === false) {
                    ok = false;
                }
            }
            let { length } = pickArr;
            let end = length - 1;
            if (end >= 0) {
                let { pick: pickBase } = pickArr[end];
                if (pickBase !== undefined && pickBase.bizEntityTable === EnumSysTable.pend) {
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
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let binSpace = new BizBinSpace(space, this.element);

        if (this.main !== undefined) {
            let m = binSpace.getBizEntity(this.main);
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
        if (this.iBase !== undefined) {
            if (this.element.i === undefined) {
                this.log('i.base need I declare');
                ok = false;
            }
        }

        if (this.xBase !== undefined) {
            if (this.element.x === undefined) {
                this.log('x.base need X declare');
                ok = false;
            }
        }

        const { pickArr, inputArr, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (pickArr !== undefined) {
            let { length } = pickArr;
            for (let i = 0; i < length; i++) {
                let pick = pickArr[i];
                if (pick.pelement.scan(binSpace) === false) {
                    ok = false;
                }
                if (i < this.pickPendPos) {
                    if (pick.single !== undefined) {
                        this.log(`Only last PICK can set SINGLE propertity`);
                        ok = false;
                    }
                    const { pick: pickBase } = pick;
                    if (pickBase?.bizEntityTable === EnumSysTable.pend) {
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
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (super.scan2(uq) === false) {
            ok = false;
        }
        return ok;
    }

    bizEntityScan2(bizEntity: BizEntity): boolean {
        let ok = super.bizEntityScan2(bizEntity);
        let { i, x } = this.element;
        function check2(bizBud: BizBudValue) {
            if (bizBud === undefined) return;
            let { pelement } = bizBud;
            if (pelement !== undefined) {
                if ((pelement as PBizBudValue<any>).bizEntityScan2(bizEntity) === false) ok = false;
            }
        }
        check2(i);
        check2(x);
        return ok;
    }
}

export const binPreDefined = [
    '$site', '$user'
    , 'bin',
    , 's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
    , ...binFieldArr
];
class BizBinSpace extends BizEntitySpace<BizBin> {
    readonly bizOuts: { [name: string]: UseOut; } = {};
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (binPreDefined.indexOf(name) >= 0) {
            return new VarPointer(name);
        }
        if (this.bizEntity.props.has(name) === true) {
            return new VarPointer(name);
        }
        let pick = this.bizEntity.pickColl[name];
        if (pick !== undefined) {
            return new VarPointer(name);
        }
        else {
            let input = this.bizEntity.inputColl[name];
            if (input !== undefined) {
                return new VarPointer(name);
            }
        }
    }

    protected _varsPointer(names: string[]): [Pointer, string] {
        let [pickName, pickProp] = names;
        let pick = this.bizEntity.pickColl[pickName];
        if (pick === undefined) {
            /*
            input only scalar
            let input = this.bizEntity.inputColl[pickName];
            if (input === undefined) {
                return undefined;
            }
            */
            return;
        }
        const { pick: pickBase } = pick;
        if (pickBase !== undefined && pickBase.hasReturn(pickProp) === false) {
            return [undefined, `Pick '${pickName}' has no return '${pickProp}'`];
        }
        return [new DotVarPointer(), undefined];
    }

    protected override _getBizEntity(name: string): BizEntity {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                const { pend } = this.bizEntity;
                return pend;
        }
    }

    override getBizFieldSpace() {
        return new BizBinActFieldSpace(this.bizEntity);
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
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (binPreDefined.indexOf(name) >= 0) {
            return new VarPointer(name);
        }
    }

    protected _varsPointer(names: string[]): [Pointer, string] {
        return undefined;
    }

    protected override _getBizEntity(name: string): BizEntity {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                return;
        }
    }

    override getBizFieldSpace() {
        return new BizBinActFieldSpace(this.bizEntity);
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
