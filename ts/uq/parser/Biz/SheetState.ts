import { BinState, BinStateAct, BinStateActStatements, BizBinBaseAct, BizField, BizStatementBinState, Pointer, SheetState, Statement, Statements, UI, Uq } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizAct, PBizActStatements, PBizEntity } from "./Base";
import { BizBinSpace, PBizBinBase } from "./Bin";
import { BizEntitySpace } from "./Biz";
import { BizFieldSpace } from "../../il/BizField";

export class PSheetState extends PBizEntity<SheetState> {
    private parseMain = () => {
        let binState = new BinState(this.element);
        this.context.parseElement(binState);
        this.element.main = binState;
    }

    private parseDetail = () => {
        let binState = new BinState(this.element);
        this.context.parseElement(binState);
        this.element.details.push(binState);
    }

    readonly keyColl: { [key: string]: () => void; } = {
        main: this.parseMain,
        detail: this.parseDetail,
    }

    protected parseHeader() {
        this.element.name = this.ts.token === Token.VAR ?
            this.ts.passVar() : '$';
        this.element.ui = this.parseUI();
    }

    override scan0(space: Space): boolean {
        let ok = true;
        const { sheet, main, details } = this.element;
        if (main !== undefined) {
            main.bin = sheet.main;
            if (main.pelement.scan0(space) === false) ok = false;
        }
        for (let detail of details) {
            const { name } = detail;
            const { details: sheetDetails } = sheet;
            if (name === undefined || name === '$') {
                if (sheetDetails.length > 1) {
                    ok = false;
                    this.log(`DETAIL must have name`);
                }
                else {
                    detail.bin = sheetDetails[0].bin;
                }
            }
            else {
                let sheetDetail = sheetDetails.find(v => v.bin.name === name);
                if (sheetDetail === undefined) {
                    ok = false;
                    this.log(`Sheet DETAIL ${name} not defined`);
                }
                else {
                    detail.bin = sheetDetail.bin;
                }
            }
            if (detail.pelement.scan0(space) === false) ok = false;
        }
        return ok;
    }

    override scan(space: Space): boolean {
        let ok = true;
        const { main, details } = this.element;
        if (main !== undefined) {
            if (main.pelement.scan(space) === false) ok = false;
        }
        for (let detail of details) {
            if (detail.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }

    override scan2(uq: Uq): boolean {
        let ok = true;
        const { main, details } = this.element;
        if (main !== undefined) {
            if (main.pelement.scan2(uq) === false) ok = false;
        }
        for (let detail of details) {
            if (detail.pelement.scan2(uq) === false) ok = false;
        }
        return ok;
    }
}

export class PBinState extends PBizBinBase<BinState> {
    private edit: string[];

    protected override createBizBinBaseAct(): BizBinBaseAct<BinState> {
        return new BinStateAct(this.element);
    }

    private parseEdit = () => {
        this.edit = [];
        if (this.ts.token !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
            return;
        }
        this.ts.readToken();
        for (; ;) {
            this.edit.push(this.ts.passVar());
            const { token } = this.ts;
            if (token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
            if (token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            break;
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    readonly keyColl: { [key: string]: () => void; } = {
        act: this.parseAct,
        edit: this.parseEdit,
    }

    protected parseHeader() {
        this.element.name = this.ts.token === Token.VAR ?
            this.ts.passVar() : '$';
    }

    override scan0(space: Space): boolean {
        let ok = super.scan0(space);
        const { act, bin } = this.element;
        let binSpace = new BizBinSpace(space, bin);
        if (act !== undefined) {
            if (act.pelement.scan0(binSpace) === false) ok = false;
        }
        return ok;
    }

    override scan(space: Space): boolean {
        let ok = super.scan(space);
        const { act, bin } = this.element;
        let binSpace = new BizBinSpace(space, bin);
        if (act !== undefined) {
            if (act.pelement.scan(binSpace) === false) ok = false;
        }
        if (this.edit !== undefined) {
            this.element.edit = [];
            let { edit, bin } = this.element;
            for (let eb of this.edit) {
                let bud = bin.getBud(eb);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${eb} not defined in BIN ${bin.getJName()}`);
                }
                else {
                    edit.push(bud);
                }
            }
        }
        return ok;
    }

    override scan2(uq: Uq): boolean {
        let ok = super.scan2(uq);
        const { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan2(uq) === false) ok = false;
        }
        return ok;
    }
}

export class PBinStateAct extends PBizAct<BinStateAct> {
    protected createBizActStatements(): Statements {
        return new BinStateActStatements(undefined, this.element);
    }
    protected createBizActSpace(space: Space): Space {
        return new BinStateActSpace(space, this.element.binState);
    }
}

export class PBinStateActStatements extends PBizActStatements<BinStateAct> {
    protected createBizActStatement(parent: Statement): Statement {
        return new BizStatementBinState(parent, this.bizAct)
    }
}

class BinStateActSpace extends BizEntitySpace<BinState> {
    private varNo: number = 1;
    private readonly bizFieldSpace: BizFieldSpace;

    constructor(outer: Space, binState: BinState) {
        super(outer, binState);
        this.bizFieldSpace = new BinStateActFieldSpace(binState);
    }

    protected _varPointer(name: string, isField: boolean): Pointer {
        return undefined;
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

export class BinStateActFieldSpace extends BizFieldSpace {
    readonly binState: BinState;
    constructor(binState: BinState) {
        super();
        this.binState = binState;
    }

    protected buildBizFieldFromDuo(n0: string, n1: string): BizField {
        return undefined;
    }
}
