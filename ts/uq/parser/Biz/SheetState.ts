import { BinState, BinStateAct, BinStateActStatements, BizBinBaseAct, BizField, BizStatementBinState, Pointer, SheetState, Statement, Statements, UI, Uq } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizAct, PBizActStatements, PBizEntity } from "./Base";
import { PBizBinBase } from "./Bin";
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
        const { main, details } = this.element;
        if (main !== undefined) {
            if (main.pelement.scan0(space) === false) ok = false;
        }
        for (let detail of details) {
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
            if (detail.act !== undefined) {
                ok = false;
                this.log(`DETAIL in Sheet State can not define ACT`);
            }
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
    protected override createBizBinBaseAct(): BizBinBaseAct<BinState> {
        return new BinStateAct(this.element);
    }

    readonly keyColl: { [key: string]: () => void; } = {
        act: this.parseAct,
    }

    protected parseHeader() {
        this.element.name = this.ts.token === Token.VAR ?
            this.ts.passVar() : '$';
    }

    override scan0(space: Space): boolean {
        let ok = super.scan0(space);
        const { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan0(space) === false) ok = false;
        }
        return ok;
    }

    override scan(space: Space): boolean {
        let ok = super.scan(space);
        const { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan(space) === false) ok = false;
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
