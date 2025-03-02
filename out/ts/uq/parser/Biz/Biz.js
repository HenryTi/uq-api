"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizEntitySpace = exports.PBiz = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const entity_1 = require("../entity/entity");
const Pend_1 = require("../../il/Biz/Pend");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
class PBiz extends entity_1.PEntity {
    constructor(entity, context) {
        super(entity, context);
        this.pRoots = {
            atom: il_1.BizAtom,
            spec: il_1.BizFork,
            fork: il_1.BizFork,
            combo: il_1.BizCombo,
            title: il_1.BizBook,
            book: il_1.BizBook,
            options: il_1.BizOptions,
            assign: il_1.BizAssign,
            // permit: BizPermit,   不再需要permit，直接简单用role
            role: il_1.BizRole,
            permit: il_1.BizRole,
            sheet: il_1.BizSheet,
            bin: il_1.BizBin,
            pend: Pend_1.BizPend,
            query: il_1.BizQueryTable,
            tree: il_1.BizTree,
            tie: il_1.BizTie,
            report: il_1.BizReport,
            templet: il_1.BizTemplet,
            print: il_1.BizPrint,
            in: il_1.BizIn,
            out: il_1.BizOut,
            ioapp: il_1.BizIOApp,
            iosite: il_1.BizIOSite,
            console: il_1.BizConsole,
            flow: il_1.Flow,
        };
    }
    parse() {
        var _a;
        let source = (_a = this.entity.source) !== null && _a !== void 0 ? _a : '';
        super.parse();
        source += this.entity.source;
        this.entity.source = source;
    }
    _parse() {
        if (this.ts.isKeyword('biz') === true)
            this.ts.readToken();
        if (this.ts.varBrace === true) {
            this.ts.expect('Biz Entity');
        }
        let entityType = this.ts.lowerVar;
        let Root = this.pRoots[entityType];
        if (Root === undefined) {
            switch (entityType) {
                default:
                    this.ts.error(`Unknown Biz Entity ${entityType}`);
                    return;
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
    foreachScan(scan) {
        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === true && p.bizPhraseType !== BizPhraseType_1.BizPhraseType.bin)
                scan(p);
        }
        for (let [, p] of this.entity.bizEntities) {
            if (p.bizPhraseType === BizPhraseType_1.BizPhraseType.bin)
                scan(p);
        }
        for (let [, p] of this.entity.bizEntities) {
            if (p.isIDScan === false)
                scan(p);
        }
    }
    scan0(space) {
        let ok = true;
        function scan0(entity) {
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
    scan(space) {
        let ok = true;
        const { bizEntities } = this.entity;
        for (let [, p] of bizEntities) {
            const { bizPhraseType } = p;
            switch (bizPhraseType) {
                case BizPhraseType_1.BizPhraseType.sheet:
                    const sheet = p;
                    const { main, details } = sheet;
                    main === null || main === void 0 ? void 0 : main.sheetArr.push(sheet);
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
        function scan(entity) {
            let { pelement } = entity;
            if (pelement === undefined)
                return;
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
    scan2(uq) {
        let ok = true;
        function scan2(entity) {
            let { pelement } = entity;
            if (pelement === undefined)
                return;
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
                case BizPhraseType_1.BizPhraseType.atom:
                case BizPhraseType_1.BizPhraseType.fork:
                    let entity = p;
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
    scanDoc2() {
        return true;
    }
}
exports.PBiz = PBiz;
class BizEntitySpace extends space_1.Space {
    constructor(outer, bizEntity) {
        super(outer);
        this.useColl = {};
        if (bizEntity === undefined)
            debugger;
        this.bizEntity = bizEntity;
    }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        return;
    }
    _varPointer(name, isField) {
        return;
    }
    _getBizFromEntityFromAlias(name) {
        if (name === undefined)
            return {
                bizEntityArr: [this.bizEntity]
            };
        return super._getBizFromEntityFromAlias(name);
    }
    _getUse(name) {
        return this.useColl[name];
    }
    // protected _getBizEntitySpace(): BizEntitySpace { return this; }
    _getBizEntity() {
        return this.bizEntity;
    }
    _addUse(name, statementNo, obj) {
        let v = this.useColl[name];
        if (v !== undefined)
            return false;
        this.useColl[name] = {
            statementNo,
            obj,
        };
        return true;
    }
}
exports.BizEntitySpace = BizEntitySpace;
//# sourceMappingURL=Biz.js.map