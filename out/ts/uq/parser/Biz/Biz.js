"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBiz = void 0;
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
            permit: il_1.BizPermit,
            role: il_1.BizRole,
            sheet: il_1.BizSheet,
            bin: il_1.BizBin,
            pend: il_1.BizPend,
            pick: il_1.BizPick,
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
        // const keys = [...Object.keys(this.pRoots), 'act', 'query'];
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
    /*
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
*/
    scan(space) {
        let ok = true;
        let bizSpace = new BizSpace(space, this.entity);
        let uomAtoms = [];
        for (let [, p] of this.entity.bizEntities) {
            let { pelement } = p;
            if (pelement === undefined)
                continue;
            if (pelement.scan(bizSpace) === false)
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
class BizSpace extends space_1.Space {
    // private varNo: number = 1;
    constructor(outer, biz) {
        super(outer);
        this.biz = biz;
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
//# sourceMappingURL=Biz.js.map