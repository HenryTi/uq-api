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
        this.name = '$biz';
        this.bizEntities = new Map();
        // let bizUser = new BizUser(this);
        // this.bizEntities.set(bizUser.name, bizUser);
        // let bizUnit = new BizUnit(this);
        // this.bizEntities.set(bizUnit.name, bizUnit);
        this.budOptionsMap = {};
    }
    get global() { return false; }
    get type() { return 'biz'; }
    get defaultAccessibility() { return entity_1.EntityAccessibility.visible; }
    get isBiz() { return true; }
    parser(context) { return new parser_1.PBiz(this, context); }
    db(db) { return db.Biz(this); }
    internalCreateSchema() { new BizSchemaBuilder(this.uq, this).build(this.schema); }
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
            phrases.push([type, '', '', item.getTypeNum()]);
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
    getEntitys() {
        let ret = [];
        for (let [, value] of this.bizEntities) {
            let { name, type, entitySchema } = value;
            switch (type) {
                case 'spec':
                    ret.push({ name, type: 'biz.spec', schema: entitySchema });
                    break;
                case 'atom':
                    ret.push({ name, type: 'biz.atom', schema: entitySchema });
                    break;
            }
        }
        return ret;
    }
}
exports.Biz = Biz;
class BizSchemaBuilder extends schema_1.SchemaBuilder {
    build(schema) {
        const { bizEntities } = this.entity;
        for (let [key, value] of bizEntities) {
            schema[key] = value.buildSchema();
        }
    }
}
exports.BizSchemaBuilder = BizSchemaBuilder;
//# sourceMappingURL=Biz.js.map