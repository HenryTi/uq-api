import {
    Biz, BizAct, BizAtom, BizPermit, BizQuery, BizRole, BizEntity
    , BizMoniker as BizMoniker, Entity, Pointer, Table, Uq, BizTree, BizTie, BizMain, BizDetail
    , BizPend, BizSheet, BizSpec, BizBudOptions
} from "../../il";
import { PContext } from "../pContext";
import { Space } from "../space";
import { PEntity } from "../entity/entity";
import { Token } from "../tokens";

export class PBiz extends PEntity<Biz> {
    private readonly pRoots: {
        [biz: string]: new (biz: Biz) => BizEntity;
    };
    constructor(entity: Biz, context: PContext) {
        super(entity, context);
        this.pRoots = {
            atom: BizAtom,
            spec: BizSpec,

            moniker: BizMoniker,

            permit: BizPermit,
            role: BizRole,

            sheet: BizSheet,
            main: BizMain,
            detail: BizDetail,
            pend: BizPend,

            tree: BizTree,
            tie: BizTie,
        };
    }
    parse(): void {
        let source = this.entity.source ?? '';
        super.parse();
        source += this.entity.source;
        this.entity.source = source;
    }
    protected _parse(): void {
        const keys = [...Object.keys(this.pRoots), 'act', 'query'];
        if (this.ts.varBrace === true) {
            this.ts.expect(...keys);
        }
        let Root = this.pRoots[this.ts.lowerVar];
        if (Root === undefined) {
            switch (this.ts.lowerVar) {
                default: this.ts.expect(...keys); return;
                case 'budoptions': this.parseBudOptions(); return;
                case 'act': this.parseAct(); return;
                case 'query': this.parseQuery(); return;
            }
        }
        this.ts.readToken();
        let root = new Root(this.entity);
        root.parser(this.context).parse();
        let { bizEntities, bizArr } = this.entity;
        let { name } = root;
        if (bizEntities.has(name) === true) {
            this.ts.error(`duplicate biz entity ${name}`);
        }
        bizEntities.set(name, root);
        bizArr.push(root);
    }

    private parseAct() {
        this.ts.readToken();
        let act = this.context.parseElement(new BizAct(this.entity));
        let { uq } = this.entity;
        let { name } = act;
        uq.acts[name] = act;
        let ret = uq.checkEntityName(act);
        if (ret === undefined) return true;
        this.error(ret);
        return false;
    }

    private parseQuery() {
        this.ts.readToken();
        let query = this.context.parseElement(new BizQuery(this.entity));
        let { uq } = this.entity;
        let { name } = query;
        uq.queries[name] = query;
        let ret = uq.checkEntityName(query);
        if (ret === undefined) return true;
        this.error(ret);
        return false;
    }

    private parseBudOptions() {
        this.ts.readToken();
        if (this.ts.token !== Token.VAR) {
            this.ts.expectToken(Token.VAR);
        }
        const name = this.ts.lowerVar;
        this.ts.readToken();
        let budOptions = this.context.parseElement(new BizBudOptions(undefined, name, undefined));
        this.entity.budOptionsMap[name] = budOptions;
    }

    scan(space: Space): boolean {
        let ok = true;
        let bizSpace = new BizSpace(space, this.entity);
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined) continue;
            if (pelement.scan(bizSpace) === false) ok = false;
        }
        this.entity.buildPhrases();
        return ok;
    }

    scan2(uq: Uq): boolean {
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined) continue;
            if (pelement.scan2(uq) === false) return false;
        }
        return true;
    }

    scanDoc2(): boolean {
        return true;
    }
}

class BizSpace extends Space {
    private readonly biz: Biz;
    private varNo: number = 1;
    constructor(outer: Space, biz: Biz) {
        super(outer);
        this.biz = biz;
    }
    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table {
        return;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        return;
    }
    getVarNo() { return this.varNo; }
    setVarNo(value: number) { this.varNo = value; }
}
