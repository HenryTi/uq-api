import { PBiz, PContext } from "../../parser";
import { Builder } from "../builder";
import { Schema, SchemaBuilder } from "../schema";
import { Uq } from "../uq";
import { Entity, EntityAccessibility } from "../entity/entity";
import { BizBase } from "./Base";
import { BizEntity } from "./Entity";
import { BizRole } from "./Role";
import { BizAtom } from "./Atom";

interface Role {
    role: string;
    permits: string[];
}

export class Biz extends Entity {
    readonly bizEntities: Map<string, BizEntity>;
    readonly bizArr: BizEntity[] = [];
    readonly latestBizArr: BizEntity[] = [];
    phrases: [string, string, string, string][];
    // roles: Role[];
    constructor(uq: Uq) {
        super(uq);
        this.name = '$biz';
        this.bizEntities = new Map();
    }
    get global(): boolean { return false; }
    get type(): string { return 'biz'; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
    get isBiz() { return true; }
    parser(context: PContext) { return new PBiz(this, context); }
    db(db: Builder): object { return db.Biz(this); }
    protected internalCreateSchema(res: { [phrase: string]: string }) { new BizSchemaBuilder(this.uq, this).build(this.schema as any, res); }

    anchorLatest() {
        this.latestBizArr.push(...this.bizArr);
    }

    isLatest(phrase: string) {
        return this.latestBizArr.find(v => v.name === phrase) !== undefined;
    }

    buildPhrases() {
        let phrases: [string, string, string, string][] = [];
        let roles: Role[] = [];
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
        let phrases: [string, string, string, string][] = [];
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
    getBizBase(bizName: string[]): BizBase {
        if (bizName.length === 1) {
            return this.bizEntities.get(bizName[0]);
        }
    }

    getEntityIxPairs() {
        const pairs: [number, number][] = [];
        const coll: { [name: string]: BizAtom } = {};
        const pairColl: { [name: string]: BizAtom } = {};
        for (const entity of this.latestBizArr) {
            if (entity.type !== 'atom') continue;
            const bizAtom = entity as BizAtom;
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

        function buildAtomPair(bizAtom: BizAtom) {
            // const bizAtom = entity as BizAtom;
            if (pairColl[bizAtom.name] !== undefined) return;
            const { extends: _extends } = bizAtom;
            if (_extends === undefined) return;
            if (coll[_extends.name] === undefined) return;
            pairs.push([_extends.id, bizAtom.id]);
        }

        function buildRolePair(bizRole: BizRole) {
            for (let [, role1] of bizRole.roles) {
                pairs.push([bizRole.id, role1.id]);
            }
        }

        for (const [, entity] of this.bizEntities) {
            switch (entity.type) {
                case 'atom': buildAtomPair(entity as BizAtom); break;
                case 'role': buildRolePair(entity as BizRole); break;
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

interface BizSchema extends Schema {
    biz: any;
}
export class BizSchemaBuilder extends SchemaBuilder<Biz> {
    build(schema: BizSchema, res: { [phrase: string]: string }) {
        const { bizArr } = this.entity;
        for (let entity of bizArr) {
            schema[entity.name] = entity.buildSchema(res);
        }
    }
}
