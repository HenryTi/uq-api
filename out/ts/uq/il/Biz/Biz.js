"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSchemaBuilder = exports.Biz = void 0;
const parser_1 = require("../../parser");
const schema_1 = require("../schema");
const entity_1 = require("../entity/entity");
const EnumSysTable_1 = require("../EnumSysTable");
const BizPhraseType_1 = require("./BizPhraseType");
class Biz extends entity_1.Entity {
    constructor(uq) {
        super(uq);
        this.bizArr = [];
        this.name = '$biz';
        this.bizEntities = new Map();
    }
    get global() { return false; }
    get type() { return 'biz'; }
    get defaultAccessibility() { return entity_1.EntityAccessibility.visible; }
    get isBiz() { return true; }
    parser(context) { return new parser_1.PBiz(this, context); }
    db(db) { return db.Biz(this); }
    internalCreateSchema(res) { new BizSchemaBuilder(this.uq, this).build(this.schema, res); }
    delEntity(entityId) {
        for (let i = 0; i < this.bizArr.length; i++) {
            let entity = this.bizArr[i];
            if (entity.id === entityId) {
                this.bizEntities.delete(entity.name);
                this.bizArr.splice(i, 1);
                break;
            }
        }
    }
    buildPhrases() {
        let phrases = [];
        for (let [, value] of this.bizEntities) {
            value.buildPhrases(phrases, undefined);
        }
        this.phrases = phrases;
    }
    buildArrPhrases() {
        let phrases = [];
        for (let item of this.bizArr) {
            let { type } = item;
            phrases.push([type, '', '', item.typeNum]);
            item.buildPhrases(phrases, type);
        }
        return phrases;
    }
    getBizBase(bizName) {
        if (bizName.length === 1) {
            return this.bizEntities.get(bizName[0]);
        }
    }
    getEntityIxPairs(bizNewest) {
        const pairs = [];
        const coll = {};
        const pairColl = {};
        for (const entity of bizNewest) {
            if (entity.type !== 'atom')
                continue;
            const bizAtom = entity;
            const { name } = bizAtom;
            coll[name] = bizAtom;
            const { extends: _extends } = bizAtom;
            if (_extends === undefined) {
                pairs.push([0, bizAtom.id]);
            }
            else {
                pairs.push([_extends.id, bizAtom.id]);
            }
            pairColl[name] = bizAtom;
        }
        function buildAtomPair(bizAtom) {
            if (pairColl[bizAtom.name] !== undefined)
                return;
            const { extends: _extends } = bizAtom;
            if (_extends === undefined)
                return;
            if (coll[_extends.name] === undefined)
                return;
            pairs.push([_extends.id, bizAtom.id]);
        }
        function buildRolePair(bizRole) {
            for (let [, role1] of bizRole.roles) {
                pairs.push([bizRole.id, role1.id]);
            }
        }
        for (const [, entity] of this.bizEntities) {
            switch (entity.type) {
                case 'atom':
                    buildAtomPair(entity);
                    break;
                case 'role':
                    buildRolePair(entity);
                    break;
            }
        }
        return pairs;
    }
    getIxRoles() {
        let ret = [];
        for (const [, entity] of this.bizEntities) {
            entity.buildIxRoles(ret);
        }
        return ret;
    }
    sameTypeEntityArr(entityNames) {
        let logs = [];
        let entityArr = [];
        let ok = true;
        for (let entityName of entityNames) {
            let entity = this.bizEntities.get(entityName);
            if (entity === undefined) {
                logs.push(`${entityName} is not defined`);
                ok = false;
            }
            else {
                entityArr.push(entity);
            }
        }
        let { length } = entityArr;
        let bizPhraseType;
        let bizEntityTable;
        if (length > 0) {
            let bizEntity = entityArr[0];
            const { bizPhraseType: bpt } = bizEntity;
            for (let i = 1; i < length; i++) {
                let ent = entityArr[i];
                if (ent.bizPhraseType !== bpt) {
                    logs.push(`${entityArr.map(v => v.getJName()).join(', ')} must be the same type`);
                    ok = false;
                }
            }
            bizPhraseType = bpt;
            switch (bizPhraseType) {
                default:
                    logs.push(`FROM can only be one of ATOM, SPEC, BIN, SHEET, PEND`);
                    ok = false;
                    break;
                case BizPhraseType_1.BizPhraseType.query: break;
                case BizPhraseType_1.BizPhraseType.atom:
                    bizEntityTable = EnumSysTable_1.EnumSysTable.atom;
                    break;
                case BizPhraseType_1.BizPhraseType.spec:
                    bizEntityTable = EnumSysTable_1.EnumSysTable.spec;
                    break;
                case BizPhraseType_1.BizPhraseType.bin:
                    bizEntityTable = EnumSysTable_1.EnumSysTable.bizBin;
                    break;
                case BizPhraseType_1.BizPhraseType.sheet:
                    bizEntityTable = EnumSysTable_1.EnumSysTable.sheet;
                    break;
                case BizPhraseType_1.BizPhraseType.pend:
                    bizEntityTable = EnumSysTable_1.EnumSysTable.pend;
                    break;
            }
        }
        return {
            ok, entityArr, logs, bizPhraseType, bizEntityTable
        };
    }
    getIOAppOuts(bizOut) {
        let ret = [];
        for (let entity of this.bizArr) {
            if (entity.bizPhraseType !== BizPhraseType_1.BizPhraseType.ioApp)
                continue;
            const { outs } = entity;
            for (let out of outs) {
                if (out.bizIO === bizOut) {
                    ret.push(out);
                    break;
                }
            }
        }
        return ret;
    }
}
exports.Biz = Biz;
class BizSchemaBuilder extends schema_1.SchemaBuilder {
    // filter out system uq defines
    build(schema, res) {
        const { bizArr } = this.entity;
        schema.biz = bizArr.map(v => {
            return v.buildSchema(res);
        });
    }
}
exports.BizSchemaBuilder = BizSchemaBuilder;
//# sourceMappingURL=Biz.js.map