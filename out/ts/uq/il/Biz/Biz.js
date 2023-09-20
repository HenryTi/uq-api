"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSchemaBuilder = exports.Biz = void 0;
const parser_1 = require("../../parser");
const schema_1 = require("../schema");
const entity_1 = require("../entity/entity");
class Biz extends entity_1.Entity {
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
        for (let [, value] of this.bizEntities) {
            let { type } = value;
            if (type !== 'role')
                continue;
            let permitNames = [];
            this.buildRoleNames(permitNames, value);
            roles.push({ role: value.phrase, permits: permitNames });
        }
        if (roles.length > 0)
            this.roles = roles;
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
    buildRoleNames(permitNames, bizRole) {
        let { roles, permitItems, permits } = bizRole;
        for (let [, value] of permitItems) {
            let { phrase } = value;
            permitNames.push(phrase);
        }
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
    buildPermitNames(permitNames, bizPermit) {
        let { items, permits } = bizPermit;
        for (let [, value] of items) {
            permitNames.push(value.phrase);
        }
        for (let [, value] of permits) {
            permitNames.push(value.phrase);
            this.buildPermitNames(permitNames, value);
        }
    }
    getBizBase(bizName) {
        if (bizName.length === 1) {
            return this.bizEntities.get(bizName[0]);
        }
    }
    /*
    getEntitys(): { name: string; type: string; schema: string }[] {
        let ret: { name: string; type: string; schema: string }[] = [];
        for (let [, value] of this.bizEntities) {
            let { name, type, entitySchema } = value;
            switch (type) {
                case 'spec': ret.push({ name, type: 'biz.spec', schema: entitySchema }); break;
                case 'atom': ret.push({ name, type: 'biz.atom', schema: entitySchema }); break;
            }
        }
        return ret;
    }
    */
    getAtomExtendsPairs() {
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
                pairs.push(['', bizAtom.phrase]);
            }
            else {
                pairs.push([_extends.phrase, bizAtom.phrase]);
            }
            pairColl[name] = bizAtom;
        }
        for (const [, entity] of this.bizEntities) {
            if (entity.type !== 'atom')
                continue;
            const bizAtom = entity;
            if (pairColl[bizAtom.name] !== undefined)
                continue;
            const { extends: _extends } = bizAtom;
            if (_extends === undefined)
                continue;
            if (coll[_extends.name] === undefined)
                continue;
            pairs.push([_extends.phrase, bizAtom.phrase]);
        }
        return pairs;
    }
}
exports.Biz = Biz;
class BizSchemaBuilder extends schema_1.SchemaBuilder {
    build(schema, res) {
        const { bizEntities } = this.entity;
        for (let [key, value] of bizEntities) {
            schema[key] = value.buildSchema(res);
        }
    }
}
exports.BizSchemaBuilder = BizSchemaBuilder;
//# sourceMappingURL=Biz.js.map