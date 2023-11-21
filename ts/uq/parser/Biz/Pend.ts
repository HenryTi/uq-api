import {
    BizPend, Statement, BizBudValue
    , BizEntity, PendQuery, BizQueryTableStatements, BizQueryTableInPendStatements, FromStatementInPend
} from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";
import { PBizBudValue } from "./Bud";
import { PBizQueryTable, PBizQueryTableStatements } from "./Query";

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

    readonly keyColl: { [key: string]: () => void } = (() => {
        let ret: { [key: string]: () => void } = {
            prop: this.parseProp,
            query: this.parseQuery,
            i: this.parseI,
            x: this.parseX,
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
        let { props, pendQuery, i, x } = this.element;
        const predefines = [...BizPend.predefinedId, ...BizPend.predefinedValue];

        if (i !== undefined) {
            if (this.scanBud(space, i) === false) {
                ok = false;
            }
            if (i.value !== undefined) {
                this.log(`I can not =`);
                ok = false;
            }
        }
        if (x !== undefined) {
            if (this.scanBud(space, x) === false) {
                ok = false;
            }
            if (x.value !== undefined) {
                this.log(`X can not =`);
                ok = false;
            }
        }

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
