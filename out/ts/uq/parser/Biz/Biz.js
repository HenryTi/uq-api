"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizEntitySpace = exports.PBiz = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const entity_1 = require("../entity/entity");
class PBiz extends entity_1.PEntity {
    constructor(entity, context) {
        super(entity, context);
        this.pRoots = {
            atom: il_1.BizAtom,
            spec: il_1.BizSpec,
            duo: il_1.BizDuo,
            title: il_1.BizTitle,
            options: il_1.BizOptions,
            assign: il_1.BizAssign,
            // permit: BizPermit,   不再需要permit，直接简单用role
            role: il_1.BizRole,
            permit: il_1.BizRole,
            sheet: il_1.BizSheet,
            bin: il_1.BizBin,
            pend: il_1.BizPend,
            query: il_1.BizQueryTable,
            tree: il_1.BizTree,
            tie: il_1.BizTie,
            report: il_1.BizReport,
            in: il_1.BizIn,
            out: il_1.BizOut,
            ioapp: il_1.BizIOApp,
            iosite: il_1.BizIOSite,
            console: il_1.BizConsole,
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
    scan0(space) {
        let ok = true;
        for (let [, p] of this.entity.bizEntities) {
            let bizEntitySpace = new BizEntitySpace(space, p);
            if (p.pelement.scan0(bizEntitySpace) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        for (let [, p] of this.entity.bizEntities) {
            const { bizPhraseType } = p;
            switch (bizPhraseType) {
                case il_1.BizPhraseType.sheet:
                    const sheet = p;
                    const { main, details } = sheet;
                    main === null || main === void 0 ? void 0 : main.sheetArr.push(sheet);
                    for (let detail of details) {
                        detail.bin.sheetArr.push(sheet);
                    }
                    break;
            }
        }
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined)
                continue;
            let bizEntitySpace = new BizEntitySpace(space, p);
            if (pelement.scan(bizEntitySpace) === false) {
                ok = false;
            }
        }
        this.entity.buildPhrases();
        return ok;
    }
    scan2(uq) {
        let ok = true;
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined)
                continue;
            if (pelement.scan2(uq) === false) {
                ok = false;
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
    _getBizEntity(name) {
        if (name === undefined)
            return this.bizEntity;
        return super._getBizEntity(name);
    }
    _getUse(name) {
        return this.useColl[name];
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