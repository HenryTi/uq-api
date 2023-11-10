import {
    Biz, BizAtom, BizRole, BizEntity
    , BizTitle, Entity, Pointer, Table, Uq, BizTree, BizTie, BizBin
    , BizPend, BizSheet, BizOptions, /*BizAtomBud, */BizAtomSpec, BizPick, BizReport, BizQueryTable, BizAssign
} from "../../il";
import { PContext } from "../pContext";
import { Space } from "../space";
import { PEntity } from "../entity/entity";

export class PBiz extends PEntity<Biz> {
    private readonly pRoots: {
        [biz: string]: new (biz: Biz) => BizEntity;
    };
    constructor(entity: Biz, context: PContext) {
        super(entity, context);
        this.pRoots = {
            atom: BizAtom,
            spec: BizAtomSpec,

            title: BizTitle,
            options: BizOptions,
            assign: BizAssign,

            // permit: BizPermit,   不再需要permit，直接简单用role
            role: BizRole,
            permit: BizRole,

            sheet: BizSheet,
            bin: BizBin,
            pend: BizPend,
            pick: BizPick,
            query: BizQueryTable,

            tree: BizTree,
            tie: BizTie,
            report: BizReport,
        };
    }
    parse(): void {
        let source = this.entity.source ?? '';
        super.parse();
        source += this.entity.source;
        this.entity.source = source;
    }
    protected _parse(): void {
        if (this.ts.isKeyword('biz') === true) this.ts.readToken();
        if (this.ts.varBrace === true) {
            this.ts.expect('Biz Entity');
        }
        let entityType = this.ts.lowerVar;
        let Root = this.pRoots[entityType];
        if (Root === undefined) {
            switch (entityType) {
                default: this.ts.error(`Unknown Biz Entity ${entityType}`); return;
                // case 'act': this.parseAct(); return;
                // case 'query': this.parseQuery(); return;
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

    scan(space: Space): boolean {
        let ok = true;
        let uomAtoms: BizAtom[] = [];
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined) continue;
            let bizEntitySpace = new BizEntitySpace(space, p);
            if (pelement.scan(bizEntitySpace) === false) ok = false;
            if (p.type === 'atom') {
                if ((p as BizAtom).uom === true) uomAtoms.push(p as BizAtom);
            }
        }
        if (uomAtoms.length > 1) {
            this.log('only one ATOM can have UOM');
            this.log(`${uomAtoms.map(v => v.jName).join(', ')} have UOM`)
            ok = false;
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

export class BizEntitySpace<T extends BizEntity = BizEntity> extends Space {
    readonly bizEntity: T;
    constructor(outer: Space, bizEntity: T) {
        super(outer);
        this.bizEntity = bizEntity;
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
    protected override _getBizEntity(name: string): BizEntity {
        if (name === undefined) return this.bizEntity;
        return super._getBizEntity(name);
    }
}
