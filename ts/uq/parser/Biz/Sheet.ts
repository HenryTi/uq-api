import {
    BizDetail, BizDetailAct, BizMain, BizPend, BizSheet, Field
    , Statements, Statement, BizDetailActStatements, BizDetailActStatement
    , Uq, Entity, Table, Pointer, VarPointer, BizBase, TableVar, ProcParamType, BizAtom, BizBudAtom, BizBud, BudDataType, BizPhraseType, bigIntField, DetailItem, ValueExpression, BudValueAct
} from "../../il";
import { PContext } from "../pContext";
import { Space } from "../space";
import { PStatements } from "../statement";
import { Token } from "../tokens";
import { PBizBase, PBizEntity } from "./Base";

export class PBizSheet extends PBizEntity<BizSheet> {
    private main: string;
    private details: { name: string, caption: string }[] = [];

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

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        if (this.main === undefined) {
            this.log(`Biz Sheet must define main`);
            ok = false;
        }
        let main = this.getBizEntity<BizMain>(space, this.main, BizPhraseType.main);
        if (main === undefined) {
            this.log(`MAIN ${this.main} is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        for (let { name, caption } of this.details) {
            let detail = this.getBizEntity<BizDetail>(space, name, BizPhraseType.detail);
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

export class PBizMain extends PBizEntity<BizMain> {
    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            target: this.parseTarget,
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

    private parseTarget = () => {
        const cTarget = 'target';
        if (this.element.target !== undefined) {
            this.ts.error('target can only define once');
        }
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud(cTarget, caption);
        this.element.target = bizBud;
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        const { target } = this.element;
        if (target !== undefined) {
            if (target.dataType !== BudDataType.atom) {
                this.log('target can only be ATOM');
                ok = false;
            }
            if (this.scanBud(space, target) === false) ok = false;
        }
        return ok;
    }
}

export class PBizDetail extends PBizEntity<BizDetail> {
    private main: string;
    private pend: string;
    private pendCaption: string;

    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            main: this.parseMain,
            item: this.parseItem,
            itemx: this.parseItemX,
            value: this.parseValue,
            price: this.parsePrice,
            amount: this.parseAmount,
            act: this.parseAct,
            pend: this.parsePend,
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

    private parseMain = () => {
        if (this.main !== undefined) {
            this.ts.error(`MAIN can only be defined once in Biz Detail`);
        }
        this.main = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parsePend = () => {
        if (this.pend !== undefined) {
            this.ts.error(`PEND can only be defined once in Biz Detail`);
        }
        this.pend = this.ts.passVar();
        this.pendCaption = this.ts.mayPassString();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseItem = () => {
        if (this.element.item !== undefined) {
            this.ts.error(`ITEM can only be defined once in Biz Detail`);
        }
        this.element.item = this.parseItemOut();
    }

    private parseItemX = () => {
        if (this.element.itemX !== undefined) {
            this.ts.error(`ITEMX can only be defined once in Biz Detail`);
        }
        this.element.itemX = this.parseItemOut();
    }

    private parseItemOut() {
        let caption = this.ts.mayPassString();
        let atom: string;
        let pick: string;
        if (this.ts.isKeyword('atom') === true) {
            this.ts.readToken();
            this.ts.assertToken(Token.VAR);
            atom = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('pick') === true) {
            this.ts.readToken();
            this.ts.assertToken(Token.VAR);
            pick = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            this.ts.expect('atom', 'pick');
        }
        this.ts.passToken(Token.SEMICOLON);
        let exp: ValueExpression;
        let act: BudValueAct;
        return {
            caption,
            atom,
            pick,
            exp,
            act,
        };
    }

    private parseValueBud(bud: BizBud, budName: string) {
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
        const { acts } = this.element;
        if (acts.length > 0) {
            this.ts.error('ACT can only be defined once');
        }
        let bizDetailAct = new BizDetailAct(this.element);
        this.element.acts.push(bizDetailAct);
        this.context.parseElement(bizDetailAct);
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        space = new DetailSpace(space);
        if (this.main === undefined) {
            this.log(`Biz Detail must define main`);
            ok = false;
        }
        let main = this.getBizEntity<BizMain>(space, this.main, BizPhraseType.main);
        if (main === undefined) {
            this.log(`MAIN '${this.main}' is not defined`)
            ok = false;
        }
        else {
            this.element.main = main;
        }

        if (this.pend !== undefined) {
            let pend = this.getBizEntity<BizPend>(space, this.pend, BizPhraseType.pend);
            if (pend === undefined) {
                this.log(`PEND '${this.pend}' is not defined`)
                ok = false;
            }
            else {
                this.element.pend = {
                    caption: this.pendCaption,
                    entity: pend,
                };
            }
        }

        const { item, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (item !== undefined) {
            const { atom, pick } = item;
            if (atom !== undefined) {
                let entity = this.getBizEntity(space, atom);
                if (entity === undefined || entity.bizPhraseType !== BizPhraseType.atom) {
                    this.ts.log(`${atom} is not BizAtom`);
                    ok = false;
                }
            }
            else if (pick !== undefined) {
                let entity = this.getBizEntity(space, pick);
                if (entity === undefined || [BizPhraseType.pick, BizPhraseType.atom].indexOf(entity.bizPhraseType) < 0) {
                    this.ts.log(`${pick} is neither BizPick nor BizAtom `);
                    ok = false;
                }
            }
        }

        const scanBudValue = (bud: BizBud) => {
            if (bud === undefined) return;
            if (bud.dataType !== BudDataType.dec) {
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

        let { acts } = this.element;
        for (let act of acts) {
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
    private detail: string;

    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            // assign: this.parseAssign,
            // detail: this.parseDetail,
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

    private parseDetail = () => {
        if (this.detail !== undefined) {
            this.ts.error(`detail can only be defined once in Biz Pend`);
        }
        this.detail = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        /*
        if (this.detail === undefined) {
            this.log(`Biz Detail must define detail`);
            ok = false;
        }
        let detail = this.getBizEntity<BizDetail>(space, this.detail, 'detail');
        if (detail === undefined) {
            ok = false;
        }
        else {
            this.element.detail = detail;
        }
        */
        return ok;
    }
}

export class PBizDetailAct extends PBizBase<BizDetailAct> {
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
        let actSpace = new DetailSpace(space);
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
    private readonly bizDetailAct: BizDetailAct;

    constructor(statements: Statements, context: PContext, bizDetailAct: BizDetailAct) {
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
    , 'target', 'item', 'itemx', 'value', 'amount', 'price'
];
class DetailSpace extends Space {
    /*
    private readonly act: BizDetailAct;
    constructor(outer: Space, act: BizDetailAct) {
        super(outer);
        this.act = act;
    }
    */
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        /*
        let { idParam } = this.act;
        if (name === idParam.name) {
            return new VarPointer();
        }
        */
        if (detailPreDefined.indexOf(name) >= 0) {
            return new VarPointer();
        }
    }
    /*
    protected _getBizBase(bizName: string[]): BizBase {
        try {
            return this.act.bizDetail.getBizBase(bizName);
        }
        catch {
            return;
        }
    }
    addTableVar(tableVar: TableVar): boolean {
        return this.act.addTableVar(tableVar);
    }
    getTableVar(name: string): TableVar {
        return this.act?.getTableVar(name);
    }
    */
}
