import {
    BizBin, BizBinAct, BizPend, Field
    , Statements, Statement, BizBinActStatements, BizBinActStatement
    , Uq, Entity, Table, Pointer, VarPointer
    , BizBudValue
    , bigIntField, BizEntity, BinPick, PickBase, PickAtom, BizAtom, PickSpec, BizAtomSpec, PickPend, BizQuery, PickQuery, BizQueryTable, BizBudAtom, DotVarPointer, EnumSysTable, BizBud, PendQuery, BizQueryTableStatements, BizQueryTableInPendStatements, FromStatementInPend, BizBinActFieldSpace
} from "../../il";
import { BizPhraseType, BudDataType } from "../../il";
import { PElement } from "../element";
import { PContext } from "../pContext";
import { Space } from "../space";
import { PStatements } from "../statement";
import { Token } from "../tokens";
import { PBizBase, PBizEntity } from "./Base";
import { BizEntitySpace } from "./Biz";
import { PBizBudValue } from "./Bud";
import { PBizQueryTable, PBizQueryTableStatements } from "./Query";

export class PBizBin extends PBizEntity<BizBin> {
    private parsePick = () => {
        let { picks } = this.element;
        if (picks === undefined) {
            picks = new Map();
            this.element.picks = picks;
        }
        let name = this.ts.passVar();
        let ui = this.parseUI();
        let pick = new BinPick(this.element, name, ui);
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
        let ui = this.parseUI();
        let bud = new BizBudAtom(this.element.biz, itemName, ui);
        if (this.ts.isKeyword('pick') === true) {
            this.ts.readToken();
        }
        this.context.parseElement(bud);
        // this.parseBudEqu(bud);
        this.ts.passToken(Token.SEMICOLON);
        return bud;
    }

    private parseValueBud(bud: BizBudValue, budName: string) {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let ui = this.parseUI();
        let bizBud = this.parseBud(budName, ui);
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
    };

    scan0(space: Space): boolean {
        let ok = true;
        const { picks, act } = this.element;
        for (let [, pick] of picks) {
            if (pick.pelement.scan0(space) === false) {
                ok = false;
            }
        }
        if (picks !== undefined) {
            let { size } = picks;
            let i = 0;
            for (let [, pick] of picks) {
                if (i < size - 1) {
                    i++;
                    continue;
                }
                if (pick.pick.bizEntityTable === EnumSysTable.pend) {
                    let pend = (pick.pick as PickPend).from;
                    if (pend === undefined) debugger;
                    this.element.pend = pend;
                }
                break;
            }
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
        space = new BizBinSpace(space, this.element);

        const { picks, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
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
                /*
                else {
                    if (pick.pick.bizEntityTable === EnumSysTable.pend) {
                        this.element.pend = (pick.pick as PickPend).from;
                    }
                }
                */
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
                this.log(`${bud.getJName()} can only be DEC`);
                ok = false;
            }
            const { value } = bud;
            if (value !== undefined) {
                const { exp } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
        }

        scanBudValue(budValue);
        scanBudValue(budAmount);
        scanBudValue(budPrice);

        if (super.scan(space) === false) ok = false;

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

export class PBinPick extends PElement<BinPick> {
    private from: string[] = [];
    protected _parse(): void {
        this.ts.passKey('from');
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
                    let bud: string;
                    if (this.ts.token === Token.MOD as any) {
                        this.ts.readToken();
                        bud = '%' + this.ts.passVar();
                    }
                    else {
                        bud = this.ts.passVar();
                    }
                    let prop: string;
                    if (this.ts.token === Token.DOT as any) {
                        this.ts.readToken();
                        prop = this.ts.passVar();
                    }
                    let { params } = this.element;
                    if (params === undefined) {
                        params = this.element.params = [];
                    }
                    params.push({
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

    scan0(space: Space): boolean {
        let ok = true;
        const { biz } = space.uq;
        const { entityArr, logs, ok: retOk, bizPhraseType, }
            = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let pickBase: PickBase;
            let multipleEntity = false;
            const bizEntity0 = entityArr[0];
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
            this.element.pick = pickBase;
            if (multipleEntity === false && entityArr.length > 1) {
                this.log('from only one object');
                ok = false;
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { biz } = space.uq;
        const { logs, ok: retOk }
            = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let { params, bin, pick: pickBase } = this.element;
            if (params !== undefined) {
                for (let p of params) {
                    const { name, bud, prop } = p;
                    if (pickBase.hasParam(name) === false) {
                        this.log(`PARAM ${name} is not defined`);
                        ok = false;
                    }
                    if (bud === '%sheet') {
                        const sheetProps = ['i', 'x', 'value', 'price', 'amount'];
                        if (prop === undefined || sheetProps.includes(prop) === true) {
                        }
                        else {
                            this.log(`%sheet. can be one of${sheetProps.join(',')}`);
                            ok = false;
                        }
                    }
                    else {
                        let pick = bin.getPick(bud);
                        if (pick === undefined) {
                            this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${bud} is not defined`);
                            ok = false;
                        }
                        else if (pick.pick.hasReturn(prop) === false) {
                            this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${prop} is not defined`);
                            ok = false;
                        }
                    }
                }
            }
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
        bud.ui = { caption: caption ?? name };
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseQuery = () => {
        this.element.pendQuery = new PendQuery(this.element);
        let { pendQuery } = this.element;
        this.context.parseElement(pendQuery);
    }

    readonly keyColl: { [key: string]: () => void } = (() => {
        let ret: { [key: string]: () => void } = {
            prop: this.parseProp,
            query: this.parseQuery,
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
        let { props, pendQuery } = this.element;
        const predefines = [...BizPend.predefinedId, ...BizPend.predefinedValue];
        for (let [, bud] of props) {
            if (predefines.includes(bud.name) === true) {
                this.log(`Pend Prop name can not be one of these: ${predefines.join(', ')}`);
                ok = false;
            }
        }
        if (pendQuery !== undefined) {
            if (pendQuery.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

export class PPendQuery extends PBizQueryTable<PendQuery> {
    override parseHeader() {
    }

    protected createStatements(): BizQueryTableStatements {
        return new BizQueryTableInPendStatements(this.element);
    }
}

export class PBizQueryTableInPendStatements extends PBizQueryTableStatements {
    protected statementFromKey(parent: Statement, key: string): Statement {
        let bizQueryTableInPendStatements = this.element as BizQueryTableInPendStatements;
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'from': return new FromStatementInPend(parent, bizQueryTableInPendStatements.pendQuery);
        }
    }
}

export const detailPreDefined = [
    '$site', '$user'
    , 'bin', 'i', 'x'
    , 'value', 'amount', 'price'
    , 's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
];
class BizBinSpace extends BizEntitySpace<BizBin> {
    private readonly useColl: { [name: string]: { statementNo: number; obj: any; } } = {};  // useStatement no
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (detailPreDefined.indexOf(name) >= 0) {
            return new VarPointer();
        }
        if (this.bizEntity !== undefined) {
            let pick = this.bizEntity.picks?.get(name);
            if (pick !== undefined) {
                return new VarPointer();
            }
        }
    }

    protected _varsPointer(names: string[]): [Pointer, string] {
        if (this.bizEntity !== undefined) {
            let [pickName, pickProp] = names;
            let pick = this.bizEntity.getPick(pickName);
            if (pick === undefined) {
                return undefined;
            }
            if (pick.pick.hasReturn(pickProp) === false) {
                return [undefined, `Pick '${pickName}' has no return '${pickProp}'`];
            }
            return [new DotVarPointer(), undefined];
        }
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

    override getBizFieldSpace() {
        return new BizBinActFieldSpace(this.bizEntity);
    }
}

export class PBizBinAct extends PBizBase<BizBinAct> {
    _parse(): void {
        this.element.name = '$';

        this.element.ui = this.parseUI();
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

    scan0(space: Space): boolean {
        let ok = true;
        let { pelement } = this.element.statement;
        if (pelement.scan0(space) === false) {
            ok = false;
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        //  will be removed
        let actSpace = new BizBinSpace(space, this.element.bizBin);
        let { pelement } = this.element.statement;
        if (pelement.preScan(actSpace) === false) ok = false;
        if (pelement.scan(actSpace) === false) ok = false;
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
    scan0(space: Space): boolean {
        return super.scan0(space);
    }
    protected statementFromKey(parent: Statement, key: string): Statement {
        let ret: Statement;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'biz':
                ret = new BizBinActStatement(parent, this.bizDetailAct);
                break;
        }
        if (ret !== undefined) ret.inSheet = true;
        return ret;
    }
}
