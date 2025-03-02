import {
    Biz, BizAtom, BizRole, BizEntity
    , BizBook, Entity, Pointer, Table, Uq, BizTree, BizTie, BizBin
    , BizSheet, BizOptions, BizFork
    , BizReport, BizQueryTable, BizAssign, BizConsole, BizIn, BizOut, BizIOApp, BizIOSite,
    BizFromEntity,
    BizCombo,
    BizTemplet,
    BizPrint,
    BizIDExtendable,
    Flow
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
            spec: BizFork,
            fork: BizFork,
            combo: BizCombo,

            title: BizBook,
            book: BizBook,
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
            templet: BizTemplet,
            print: BizPrint,

            in: BizIn,
            out: BizOut,
            ioapp: BizIOApp,
            iosite: BizIOSite,

            console: BizConsole,
            flow: Flow,
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

    private foreachScan(scan: (entity: BizEntity) => void) {
        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === true && p.bizPhraseType !== BizPhraseType.bin) scan(p);
        }
        for (let [, p] of this.entity.bizEntities) {
            if (p.bizPhraseType === BizPhraseType.bin) scan(p);
        }
        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === false) scan(p);
        }
    }

    scan0(space: Space): boolean {
        let ok = true;
        function scan0(entity: BizEntity) {
            let bizEntitySpace = new BizEntitySpace(space, entity);
            if (entity.pelement.scan0(bizEntitySpace) === false) {
                ok = false;
            }
        }
        this.foreachScan(scan0);
        /*
        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === true) scan0(p);
        }

        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === false) scan0(p);
        }
        */
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { bizEntities } = this.entity;

        for (let [, p] of bizEntities) {
            const { bizPhraseType } = p;
            switch (bizPhraseType) {
                case BizPhraseType.sheet:
                    const sheet = p as BizSheet;
                    const { main, details } = sheet;
                    main?.sheetArr.push(sheet);
                    for (let detail of details) {
                        const { bin } = detail;
                        const { main: binMain } = bin;
                        bin.sheetArr.push(sheet);
                        if (binMain !== main && binMain !== undefined && main !== undefined) {
                            this.log(`BIN ${bin.name} MAIN ${binMain.name}, SHEET ${sheet.name} MAIN ${main.name}, must be the same`);
                            ok = false;
                        }
                    }
                    break;
            }
        }

        function scan(entity: BizEntity) {
            let { pelement } = entity;
            if (pelement === undefined) return;
            let bizEntitySpace = new BizEntitySpace(space, entity);
            if (pelement.scan(bizEntitySpace) === false) {
                ok = false;
            }
        }
        this.foreachScan(scan);
        /*
        for (let [, p] of bizEntities) {
            if (p.isIDScan === true) scan(p);
        }
        for (let [, p] of bizEntities) {
            if (p.isIDScan === false) scan(p);
        }
        */
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        function scan2(entity: BizEntity) {
            let { pelement } = entity;
            if (pelement === undefined) return;
            if (pelement.scan2(uq) === false) {
                ok = false;
            }
        }
        this.foreachScan(scan2);
        this.entity.buildPhrases();
        /*
        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === true) scan2(p);
        }
        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === false) scan2(p);
        }
        */
        for (let [, p] of this.entity.bizEntities) {
            switch (p.bizPhraseType) {
                case BizPhraseType.atom:
                case BizPhraseType.fork:
                    let entity = p as BizIDExtendable;
                    let { extends: _extends } = entity;
                    if (_extends !== undefined) {
                        let { extendeds } = _extends;
                        if (extendeds === undefined) {
                            _extends.extendeds = extendeds = [];
                        }
                        extendeds.push(entity);
                    }
                    break;
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
    protected override _getBizFromEntityFromAlias(name: string) {
        if (name === undefined) return {
            bizEntityArr: [this.bizEntity]
        } as BizFromEntity<T>;
        return super._getBizFromEntityFromAlias(name);
    }
    protected override _getUse(name: string): { statementNo: number; obj: any; } {
        return this.useColl[name];
    }
    // protected _getBizEntitySpace(): BizEntitySpace { return this; }
    protected override _getBizEntity(): BizEntity {
        return this.bizEntity;
    }
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
