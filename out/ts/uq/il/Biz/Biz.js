"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSchemaBuilder = exports.Biz = void 0;
const parser_1 = require("../../parser");
const schema_1 = require("../schema");
const entity_1 = require("../entity/entity");
class Biz extends entity_1.Entity {
    // roles: Role[];
    constructor(uq) {
        super(uq);
        this.bizArr = [];
        this.latestBizArr = [];
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
    anchorLatest() {
        this.latestBizArr.push(...this.bizArr);
    }
    isLatest(phrase) {
        return this.latestBizArr.find(v => v.name === phrase) !== undefined;
    }
    buildPhrases() {
        let phrases = [];
        let roles = [];
        for (let [, value] of this.bizEntities) {
            // let { type } = value;
            // phrases.push([type, '', '', value.getTypeNum()]);
            value.buildPhrases(phrases, undefined);
        }
        this.phrases = phrases;
        /*
        for (let [, value] of this.bizEntities) {
            let { type } = value;
            if (type !== 'role') continue;
            let permitNames: string[] = [];
            this.buildRoleNames(permitNames, value as BizRole);
            roles.push({ role: value.phrase, permits: permitNames });
        }
        */
        // if (roles.length > 0) this.roles = roles;
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
    /*
    private buildRoleNames(permitNames: string[], bizRole: BizRole) {
        let { roles, permits } = bizRole;
        for (let [, value] of permits) {
            let { phrase } = value;
            permitNames.push(phrase);
            this.buildPermitNames(permitNames, value);
        }
        for (let [, value] of roles) {
            let { phrase } = value;
            permitNames.push(phrase);
            this.buildRoleNames(permitNames, value);
        }
    }

    private buildPermitNames(permitNames: string[], bizPermit: BizPermit) {
        let { items, permits } = bizPermit;
        for (let [, value] of items) {
            permitNames.push(value.phrase);
        }
        for (let [, value] of permits) {
            permitNames.push(value.phrase);
            this.buildPermitNames(permitNames, value);
        }
    }
    */
    getBizBase(bizName) {
        if (bizName.length === 1) {
            return this.bizEntities.get(bizName[0]);
        }
    }
    getEntityIxPairs() {
        const pairs = [];
        const coll = {};
        const pairColl = {};
        for (const entity of this.latestBizArr) {
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
            // const bizAtom = entity as BizAtom;
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
            /*
            if (pairColl[bizAtom.name] !== undefined) continue;
            const { extends: _extends } = bizAtom;
            if (_extends === undefined) continue;
            if (coll[_extends.name] === undefined) continue;
            pairs.push([_extends.phrase, bizAtom.phrase]);
            */
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
}
exports.Biz = Biz;
class BizSchemaBuilder extends schema_1.SchemaBuilder {
    build(schema, res) {
        const { bizArr } = this.entity;
        for (let entity of bizArr) {
            schema[entity.name] = entity.buildSchema(res);
        }
    }
}
exports.BizSchemaBuilder = BizSchemaBuilder;
//# sourceMappingURL=Biz.js.map