import {
    Biz, BizAtom, BizRole, BizEntity
    , BizTitle, Entity, Pointer, Table, Uq, BizTree, BizTie, BizBin
    , BizSheet, BizOptions, BizSpec
    , BizReport, BizQueryTable, BizAssign, BizConsole, BizDuo, BizIn, BizOut, BizIOApp, BizIOSite
} from "../../il";
import { PContext } from "../pContext";
import { Space } from "../space";
import { PEntity } from "../entity/entity";
import { BizPend } from "../../il/Biz/Pend";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";

export class PBiz extends PEntity<Biz> {
    private readonly pRoots: {
        [biz: string]: new (biz: Biz) => BizEntity;
    };
    constructor(entity: Biz, context: PContext) {
        super(entity, context);
        this.pRoots = {
            atom: BizAtom,
            spec: BizSpec,
            duo: BizDuo,

            title: BizTitle,
            options: BizOptions,
            assign: BizAssign,

            // permit: BizPermit,   不再需要permit，直接简单用role
            role: BizRole,
            permit: BizRole,

            sheet: BizSheet,
            bin: BizBin,
            pend: BizPend,
            query: BizQueryTable,

            tree: BizTree,
            tie: BizTie,
            report: BizReport,

            in: BizIn,
            out: BizOut,
            ioapp: BizIOApp,
            iosite: BizIOSite,

            console: BizConsole,
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
        if (entityType !== 'console') {
            // console 可能没有名字，也可能有$console
            this.ts.readToken();
        }
        let root = new Root(this.entity);
        this.context.parseElement(root);
        let { bizEntities, bizArr } = this.entity;
        let { name } = root;
        if (bizEntities.has(name) === true) {
            this.ts.error(`duplicate biz entity ${name}`);
        }
        bizEntities.set(name, root);
        bizArr.push(root);
    }

    scan0(space: Space): boolean {
        let ok = true;
        for (let [, p] of this.entity.bizEntities) {
            let bizEntitySpace = new BizEntitySpace(space, p);
            if (p.pelement.scan0(bizEntitySpace) === false) {
                ok = false;
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        for (let [, p] of this.entity.bizEntities) {
            const { bizPhraseType } = p;
            switch (bizPhraseType) {
                case BizPhraseType.sheet:
                    const sheet = p as BizSheet;
                    const { main, details } = sheet;
                    main?.sheetArr.push(sheet);
                    for (let detail of details) {
                        detail.bin.sheetArr.push(sheet);
                    }
                    break;
            }
        }
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined) continue;
            let bizEntitySpace = new BizEntitySpace(space, p);
            if (pelement.scan(bizEntitySpace) === false) {
                ok = false;
            }
        }
        this.entity.buildPhrases();
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined) continue;
            if (pelement.scan2(uq) === false) {
                ok = false;
            }
        }
        return ok;
    }

    scanDoc2(): boolean {
        return true;
    }
}

export class BizEntitySpace<T extends BizEntity = BizEntity> extends Space {
    readonly bizEntity: T;
    readonly useColl: { [name: string]: { statementNo: number; obj: any; } } = {};
    constructor(outer: Space, bizEntity: T) {
        super(outer);
        if (bizEntity === undefined) debugger;
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
    protected override _getBizEntity(name: string): BizEntity[] {
        if (name === undefined) return [this.bizEntity];
        return super._getBizEntity(name);
    }
    protected override _getUse(name: string): { statementNo: number; obj: any; } {
        return this.useColl[name];
    }
    protected _getBizEntitySpace(): BizEntitySpace { return this; }
    protected override _addUse(name: string, statementNo: number, obj: any): boolean {
        let v = this.useColl[name];
        if (v !== undefined) return false;
        this.useColl[name] = {
            statementNo,
            obj,
        }
        return true;
    }
}
