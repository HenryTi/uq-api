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
            spec: il_1.BizAtomSpec,
            title: il_1.BizTitle,
            options: il_1.BizOptions,
            assign: il_1.BizAssign,
            // permit: BizPermit,   不再需要permit，直接简单用role
            role: il_1.BizRole,
            permit: il_1.BizRole,
            sheet: il_1.BizSheet,
            bin: il_1.BizBin,
            pend: il_1.BizPend,
            pick: il_1.BizPick,
            query: il_1.BizQueryTable,
            tree: il_1.BizTree,
            tie: il_1.BizTie,
            report: il_1.BizReport,
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
    scan(space) {
        let ok = true;
        let uomAtoms = [];
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined)
                continue;
            let bizEntitySpace = new BizEntitySpace(space, p);
            if (pelement.scan(bizEntitySpace) === false)
                ok = false;
            if (p.type === 'atom') {
                if (p.uom === true)
                    uomAtoms.push(p);
            }
        }
        if (uomAtoms.length > 1) {
            this.log('only one ATOM can have UOM');
            this.log(`${uomAtoms.map(v => v.jName).join(', ')} have UOM`);
            ok = false;
        }
        this.entity.buildPhrases();
        return ok;
    }
    scan2(uq) {
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined)
                continue;
            if (pelement.scan2(uq) === false)
                return false;
        }
        return true;
    }
    scanDoc2() {
        return true;
    }
}
exports.PBiz = PBiz;
class BizEntitySpace extends space_1.Space {
    constructor(outer, bizEntity) {
        super(outer);
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
}
exports.BizEntitySpace = BizEntitySpace;
//# sourceMappingURL=Biz.js.map