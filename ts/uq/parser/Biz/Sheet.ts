import {
    BizBin, BizBinAct, BizPend, BizSheet, Field
    , Statements, Statement, BizDetailActStatements, BizDetailActStatement
    , Uq, Entity, Table, Pointer, VarPointer
    , BizBudAtom, BizBudValue, BudDataType, BizPhraseType
    , bigIntField, ValueExpression, BudValueAct, BizEntity, BizBudDec, BizBudPickable
} from "../../il";
import { PContext } from "../pContext";
import { Space } from "../space";
import { PStatements } from "../statement";
import { Token } from "../tokens";
import { PBizBase, PBizEntity } from "./Base";

export class PBizSheet extends PBizEntity<BizSheet> {
    private main: string;
    private details: { name: string, caption: string }[] = [];

    /*
    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            main: this.parseMain,
            detail: this.parseDetail,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
    }
    */

    private parseMain = () => {
        if (this.main !== undefined) {
            this.ts.error(`main can only be defined once in Biz Sheet`);
        }
        this.main = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseDetail = () => {
        let name = this.ts.passVar();
        let caption = this.ts.mayPassString();
        this.details.push({ name, caption });
        this.ts.passToken(Token.SEMICOLON);
    }

    private parsePermit = () => {
        this.parsePermission('crud');
    }

    readonly keyColl = {
        prop: this.parseProp,
        main: this.parseMain,
        detail: this.parseDetail,
        permit: this.parsePermit,
    };

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        if (this.main === undefined) {
            this.log(`Biz Sheet must define main`);
            ok = false;
        }
        let main = this.getBizEntity<BizBin>(space, this.main, BizPhraseType.bin);
        if (main === undefined) {
            this.log(`MAIN ${this.main} is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        for (let { name, caption } of this.details) {
            let detail = this.getBizEntity<BizBin>(space, name, BizPhraseType.bin);
            if (detail === undefined) {
                ok = false;
                continue;
            }
            this.element.details.push({ detail, caption });
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        return ok;
    }
}

export class PBizBin extends PBizEntity<BizBin> {
    // private main: string;
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

    private parseI = () => {
        if (this.element.i !== undefined) {
            this.ts.error(`I can only be defined once in Biz Bin`);
        }
        this.element.i = this.parseBudPickable('i');
    }

    private parseX = () => {
        if (this.element.x !== undefined) {
            this.ts.error(`X can only be defined once in Biz Bin`);
        }
        this.element.x = this.parseBudPickable('x');
    }

    private parseBudPickable(itemName: string) {
        let caption = this.ts.mayPassString();
        let bud = new BizBudPickable(itemName, caption);
        this.context.parseElement(bud);
        this.ts.passToken(Token.SEMICOLON);
        return bud;
    }

    private parseValueBud(bud: BizBudValue, budName: string) {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud(budName, caption);
        this.ts.passToken(Token.SEMICOLON);
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
        let bizBinAct = new BizBinAct(this.element);
        this.element.act = bizBinAct;
        this.context.parseElement(bizBinAct);
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    readonly keyColl = {
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
        if (super.scan(space) === false) ok = false;
        space = new DetailSpace(space, this.element);

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

        const { i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
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
                if (value.exp.pelement.scan(space) === false) {
                    ok = false;
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

export class PBizPend extends PBizEntity<BizPend> {
    /*
    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
    }
    */

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
        /*
        for (let n of predefinedId) {
            props.set(n, new BizBudAtom(n, undefined));
        }
        for (let n of predefinedValue) {
            props.set(n, new BizBudDec(n, undefined));
        }
        */
        return ok;
    }
}

export class PBizDetailAct extends PBizBase<BizBinAct> {
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

        let statement = new BizDetailActStatements(undefined, this.element);
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
        let actSpace = new DetailSpace(space, undefined);
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

export class PBizDetailActStatements extends PStatements {
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

export const detailPreDefined = [
    '$site', '$user'
    , 'pend'
    , 'sheet', 'target'
    , 'detail'
    , 'i', 'x', 'value', 'amount', 'price'
];
class DetailSpace extends Space {
    private readonly detail: BizBin;
    constructor(outer: Space, detail: BizBin) {
        super(outer);
        this.detail = detail;
    }
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (detailPreDefined.indexOf(name) >= 0) {
            return new VarPointer();
        }
    }

    protected override _getBizEntity(name: string): BizEntity {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                const { pend } = this.detail;
                return pend?.entity;
            case 'main':
                debugger;
                break;
        }
    }
}
