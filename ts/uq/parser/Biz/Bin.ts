import {
    BizBin, BizBinAct, BizPend, Field
    , Statements, Statement, BizBinActStatements, BizDetailActStatement
    , Uq, Entity, Table, Pointer, VarPointer
    , BizBudValue, BudDataType, BizPhraseType
    , bigIntField, BizEntity, BizBudPickable, PickParam, BinPick, PickBase, PickAtom, BizAtom, PickSpec, BizAtomSpec, PickPend, BizQuery, PickQuery, BizQueryTable, BizBudAtom, DotVarPointer, EnumSysTable
} from "../../il";
import { PElement } from "../element";
import { PContext } from "../pContext";
import { Space } from "../space";
import { PStatements } from "../statement";
import { Token } from "../tokens";
import { PBizBase, PBizEntity } from "./Base";

export class PBizBin extends PBizEntity<BizBin> {
    private pend: string;
    private pendCaption: string;
    private pendSearch: string[];

    private parsePend = () => {
        if (this.pend !== undefined) {
            this.ts.error(`PEND can only be defined once in Biz Bin`);
        }
        this.pend = this.ts.passVar();
        this.pendCaption = this.ts.mayPassString();
        this.ts.passToken(Token.LBRACE);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) {
                this.ts.readToken();
                break;
            }
            let key = this.ts.passKey();
            if (key === 'search') {
                if (this.ts.token === Token.LPARENTHESE) {
                    this.pendSearch = [];
                    for (; ;) {
                        let sKey = this.ts.passKey();
                        this.pendSearch.push(sKey);
                        if (this.ts.token === Token.RPARENTHESE as any) {
                            this.ts.readToken();
                            break;
                        }
                        if (this.ts.token === Token.COMMA as any) {
                            this.ts.readToken();
                            continue;
                        }
                        this.ts.expectToken(Token.RPARENTHESE, Token.COMMA);
                    }
                }
                else {
                    let sKey = this.ts.passKey();
                    this.pendSearch = [sKey];
                }
                this.ts.passToken(Token.SEMICOLON);
            }
            else {
                this.ts.expect('search');
                break;
            }
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    private parsePick = () => {
        let { picks } = this.element;
        if (picks === undefined) {
            picks = new Map();
            this.element.picks = picks;
        }
        let name = this.ts.passVar();
        let caption = this.ts.mayPassString();
        let pick = new BinPick(this.element, name, caption);
        this.context.parseElement(pick);
        picks.set(pick.name, pick);
    }

    private parseI = () => {
        if (this.element.i !== undefined) {
            this.ts.error(`I can only be defined once in Biz Bin`);
        }
        this.element.i = this.parseBudAtom('i');
    }

    private parseX = () => {
        if (this.element.x !== undefined) {
            this.ts.error(`X can only be defined once in Biz Bin`);
        }
        this.element.x = this.parseBudAtom('x');
    }

    private parseBudAtom(itemName: string) {
        let caption = this.ts.mayPassString();
        let bud = new BizBudAtom(this.element.biz, itemName, caption);
        if (this.ts.isKeyword('pick') === true) {
            this.ts.readToken();
        }
        this.context.parseElement(bud);
        this.parseBudEqu(bud);
        this.ts.passToken(Token.SEMICOLON);
        return bud;
    }

    private parseValueBud(bud: BizBudValue, budName: string) {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud(budName, caption);
        if (this.ts.prevToken !== Token.RBRACE) {
            this.ts.passToken(Token.SEMICOLON);
        }
        return bizBud;
    }

    private parseValue = () => {
        this.element.value = this.parseValueBud(this.element.value, 'value');
    }

    private parsePrice = () => {
        this.element.price = this.parseValueBud(this.element.price, 'price');
    }

    private parseAmount = () => {
        this.element.amount = this.parseValueBud(this.element.amount, 'amount');
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
        pick: this.parsePick,
        prop: this.parseProp,
        i: this.parseI,
        x: this.parseX,
        value: this.parseValue,
        price: this.parsePrice,
        amount: this.parseAmount,
        act: this.parseAct,
        pend: this.parsePend,
    };

    scan(space: Space): boolean {
        let ok = true;
        // let binSpace = new BinSpace(space, this.element);
        space = new BizBinSpace(space, this.element);
        if (super.scan(space) === false) ok = false;

        const { picks, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        /*
        if (this.pend !== undefined) {
            let pend = this.getBizEntity<BizPend>(space, this.pend, BizPhraseType.pend);
            if (pend === undefined) {
                this.log(`PEND '${this.pend}' is not defined`)
                ok = false;
            }
            else {
                if (this.pendSearch === undefined || this.pendSearch.length === 0) {
                    this.log(`Search keys must be defined`);
                    ok = false;
                }
                else {
                    let { predefinedId } = BizPend;
                    for (let i of this.pendSearch) {
                        if (predefinedId.includes(i) === false) {
                            this.log(`Pend ${pend.jName} has not ${i}`);
                            ok = false;
                        }
                    }
                }
                this.element.pend = {
                    caption: this.pendCaption,
                    entity: pend,
                    search: this.pendSearch,
                };
            }
        }
        */
        if (picks !== undefined) {
            let { size } = picks;
            let i = 0;
            for (let [, pick] of picks) {
                if (pick.pelement.scan(space) === false) {
                    ok = false;
                }
                if (i < size - 1) {
                    if (pick.single !== undefined) {
                        this.log(`Only last PICK can set SINGLE propertity`);
                        ok = false;
                    }
                    if (pick.pick.bizEntityTable === EnumSysTable.pend) {
                        this.log(`Only last PICK can be from PEND`);
                        ok = false;
                    }
                }
                else {
                    if (pick.pick.bizEntityTable === EnumSysTable.pend) {
                        this.element.pend = (pick.pick as PickPend).from;
                    }
                }
                i++;
            }
        }

        if (i !== undefined) {
            if (this.scanBud(space, i) === false) {
                ok = false;
            }
        }
        if (x !== undefined) {
            if (this.scanBud(space, x) === false) {
                ok = false;
            }
        }

        const scanBudValue = (bud: BizBudValue) => {
            if (bud === undefined) return;
            const { dataType } = bud;
            if (dataType !== BudDataType.dec && dataType !== BudDataType.none) {
                this.log(`${bud.jName} can only be DEC`);
                ok = false;
            }
            const { value } = bud;
            if (value !== undefined) {
                const { exp, query } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                else if (query !== undefined) {
                    if (query.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
        }

        scanBudValue(budValue);
        scanBudValue(budAmount);
        scanBudValue(budPrice);

        let { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        // const { item, value: budValue, amount: budAmount, price: budPrice } = this.element;
        /*
        if (item !== undefined) return ok;
        const itemBud: BizBudAtom = item as BizBudAtom;
        let { atom } = itemBud;
        if (atom !== undefined) {
            const { uom } = atom as BizAtom;
            if (uom === undefined) {
                this.log(`ATOM '${atom.name}' does not define UOM, can not be used in DETAIL`);
                ok = false;
            }
        }
        */
        return ok;
    }
}

export class PBinPick extends PElement<BinPick> {
    private from: string[] = [];
    protected _parse(): void {
        this.ts.passKey('from');
        let param: PickParam[] = [];
        this.element.param = param;
        for (; ;) {
            this.from.push(this.ts.passVar());
            if (this.ts.token !== Token.BITWISEOR) break;
            this.ts.readToken();
        }
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('param') === true) {
                    this.ts.readToken();
                    let name = this.ts.passVar();
                    this.ts.passToken(Token.EQU);
                    let bud = this.ts.passVar();
                    let prop: string;
                    if (this.ts.token === Token.DOT as any) {
                        this.ts.readToken();
                        prop = this.ts.passVar();
                    }
                    param.push({
                        name,
                        bud,
                        prop,
                    });
                }
                else {
                    this.ts.expect('param');
                }
                this.ts.passToken(Token.SEMICOLON);
            }
        }
        if (this.ts.isKeyword('single') === true) {
            this.element.single = true;
            this.ts.readToken();
        }
        if (this.ts.prevToken !== Token.RBRACE) {
            this.ts.passToken(Token.SEMICOLON);
        }
        else {
            this.ts.mayPassToken(Token.SEMICOLON);
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        const { biz } = space.uq;
        const { entityArr, logs, bizEntity0, ok: retOk, bizPhraseType, }
            = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let pickBase: PickBase;
            let multipleEntity = false;
            switch (bizPhraseType) {
                case BizPhraseType.atom:
                    pickBase = new PickAtom(entityArr as BizAtom[]);
                    multipleEntity = true;
                    break;
                case BizPhraseType.spec:
                    pickBase = new PickSpec(bizEntity0 as BizAtomSpec);
                    break;
                case BizPhraseType.pend:
                    pickBase = new PickPend(bizEntity0 as BizPend);
                    break;
                case BizPhraseType.query:
                    pickBase = new PickQuery(bizEntity0 as BizQueryTable);
                    break;
            }
            if (multipleEntity === false && entityArr.length > 1) {
                this.log('from only one object');
                ok = false;
            }
            let { param } = this.element;
            for (let p of param) {
                const { name, bud, prop } = p;
                if (pickBase.hasParam(name) === false) {
                    this.log(`PARAM ${name} is not defined`);
                    ok = false;
                }
                if (this.element.bin.isValidPickProp(bud, prop) === false) {
                    this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} is not valid`);
                    ok = false;
                }
            }
            this.element.pick = pickBase;
        }
        return ok;
    }
}

export class PBizPend extends PBizEntity<BizPend> {
    private parsePredefined(name: string) {
        let caption = this.ts.mayPassString();
        let bud = this.element.predefinedBuds[name];
        if (bud === undefined) debugger;
        // 有caption值，才会显示
        bud.caption = caption ?? name;
        this.ts.passToken(Token.SEMICOLON);
    }

    readonly keyColl: { [key: string]: () => void } = (() => {
        let ret: { [key: string]: () => void } = {
            prop: this.parseProp,
        };
        const setRet = (n: string) => {
            ret[n] = () => this.parsePredefined(n);
        }
        BizPend.predefinedId.forEach(setRet);
        BizPend.predefinedValue.forEach(setRet);
        return ret;
    })();

    protected override parseContent(): void {
        super.parseContent();
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        let { props } = this.element;
        const predefines = [...BizPend.predefinedId, ...BizPend.predefinedValue];
        for (let [, bud] of props) {
            if (predefines.includes(bud.name) === true) {
                this.log(`Pend Prop name can not be one of these: ${predefines.join(', ')}`);
                ok = false;
            }
        }
        return ok;
    }
}

export const detailPreDefined = [
    '$site', '$user'
    , 'bin', 'i', 'x'
    , 'value', 'amount', 'price'
    , 's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
];
class BizBinSpace extends Space {
    private readonly bin: BizBin;
    private readonly useColl: { [name: string]: { statementNo: number; obj: any; } } = {};  // useStatement no
    constructor(outer: Space, bin: BizBin) {
        super(outer);
        this.bin = bin;
    }
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (detailPreDefined.indexOf(name) >= 0) {
            return new VarPointer();
        }
        if (this.bin !== undefined) {
            let pick = this.bin.picks?.get(name);
            if (pick !== undefined) {
                return new VarPointer();
            }
        }
    }

    protected _varsPointer(names: string[]): Pointer {
        if (this.bin !== undefined) {
            if (this.bin.isValidPickProp(names[0], names[1]) === true) {
                return new DotVarPointer();
            }
        }
    }

    protected override _getBizEntity(name: string): BizEntity {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                const { pend } = this.bin;
                return pend;
        }
    }

    protected _getUse(name: string): { statementNo: number; obj: any; } {
        return this.useColl[name];
    }

    protected _addUse(name: string, statementNo: number, obj: any): boolean {
        let v = this.useColl[name];
        if (v !== undefined) return false;
        this.useColl[name] = {
            statementNo,
            obj,
        }
        return true;
    }
}


export class PBizBinAct extends PBizBase<BizBinAct> {
    _parse(): void {
        this.element.name = '$';

        this.element.caption = this.ts.mayPassString();
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

        let statement = new BizBinActStatements(undefined, this.element);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
        this.element.statement = statement;
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        //  will be removed
        let actSpace = new BizBinSpace(space, undefined);
        let { pelement } = this.element.statement;
        if (pelement.preScan(actSpace) === false) ok = false;
        if (pelement.scan(actSpace) === false) ok = false;
        /*
        if (this.fromPend !== undefined) {
            let pend = this.getBizEntity<BizPend>(space, this.fromPend, 'pend');
            if (pend === undefined) {
                ok = false;
            }
            else {
                this.element.fromPend = pend;
            }
        }
        */
        return ok;
    }

    scan2(uq: Uq): boolean {
        if (this.element.statement.pelement.scan2(uq) === false) {
            return false;
        }
        return true;
    }
}

export class PBizBinActStatements extends PStatements {
    private readonly bizDetailAct: BizBinAct;

    constructor(statements: Statements, context: PContext, bizDetailAct: BizBinAct) {
        super(statements, context);
        this.bizDetailAct = bizDetailAct;
    }
    protected statementFromKey(parent: Statement, key: string): Statement {
        let ret: Statement;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'biz':
                ret = new BizDetailActStatement(parent, this.bizDetailAct);
                break;
        }
        if (ret !== undefined) ret.inSheet = true;
        return ret;
    }
}