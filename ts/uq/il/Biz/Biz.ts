import { PBiz, PContext } from "../../parser";
import { Builder } from "../builder";
import { Schema, SchemaBuilder } from "../schema";
import { Uq } from "../uq";
import { Entity, EntityAccessibility } from "../entity/entity";
import { BizBase } from "./Base";
import { BizEntity } from "./Entity";
import { BizUnit } from "./Unit";
import { BizUser } from "./User";
import { BizPermit, BizRole } from "./Permit";
import { BizBudOptions } from "./Bud";

interface Role {
    role: string;
    permits: string[];
}

export class Biz extends Entity {
    readonly bizEntities: Map<string, BizEntity>;
    readonly bizArr: BizEntity[] = [];
    readonly budOptionsMap: { [name: string]: BizBudOptions };
    phrases: [string, string, string, string][];
    roles: Role[];
    constructor(uq: Uq) {
        super(uq);
        this.name = '$biz';
        this.bizEntities = new Map();
        let bizUser = new BizUser(this);
        this.bizEntities.set(bizUser.name, bizUser);
        let bizUnit = new BizUnit(this);
        this.bizEntities.set(bizUnit.name, bizUnit);
        this.budOptionsMap = {};
    }
    get global(): boolean { return false; }
    get type(): string { return 'biz'; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
    get isBiz() { return true; }
    parser(context: PContext) { return new PBiz(this, context); }
    db(db: Builder): object { return db.Biz(this); }
    protected internalCreateSchema() { new BizSchemaBuilder(this.uq, this).build(this.schema as any); }

    buildPhrases() {
        let phrases: [string, string, string, string][] = [];
        let roles: Role[] = [];
        for (let [, value] of this.bizEntities) {
            let { type } = value;
            phrases.push([type, '', '', value.getTypeNum()]);
            value.buildPhrases(phrases, type);
        }
        this.phrases = phrases;
        for (let [, value] of this.bizEntities) {
            let { type } = value;
            if (type !== 'role') continue;
            let permitNames: string[] = [];
            this.buildRoleNames(permitNames, value as BizRole);
            roles.push({ role: value.phrase, permits: permitNames });
        }
        if (roles.length > 0) this.roles = roles;
    }

    private buildRoleNames(permitNames: string[], bizRole: BizRole) {
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

    getBizBase(bizName: string[]): BizBase {
        if (bizName.length === 1) {
            return this.bizEntities.get(bizName[0]);
        }
    }

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
}

interface BizSchema extends Schema {
    biz: any;
}
export class BizSchemaBuilder extends SchemaBuilder<Biz> {
    build(schema: BizSchema) {
        const { bizEntities } = this.entity;
        for (let [key, value] of bizEntities) {
            schema[key] = value.buildSchema();
        }
    }
}
