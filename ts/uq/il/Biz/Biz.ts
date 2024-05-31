import { PBiz, PContext } from "../../parser";
import { Builder } from "../builder";
import { Schema, SchemaBuilder } from "../schema";
import { Uq } from "../uq";
import { Entity, EntityAccessibility } from "../entity/entity";
import { BizBase } from "./Base";
import { BizEntity } from "./Entity";
import { BizRole } from "./Role";
import { BizAtom } from "./BizID";
import { EnumSysTable } from "../EnumSysTable";
import { BizPhraseType } from "./BizPhraseType";
import { BizIOApp, BizOut, IOAppOut } from "./InOut";

export class Biz extends Entity {
    readonly bizEntities: Map<string, BizEntity>;
    readonly bizArr: BizEntity[] = [];
    phrases: [string, string, string, string][];
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

    delEntity(entityId: number) {
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
        let phrases: [string, string, string, string][] = [];
        for (let [, value] of this.bizEntities) {
            value.buildPhrases(phrases, undefined);
        }
        this.phrases = phrases;
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

    getBizBase(bizName: string[]): BizBase {
        if (bizName.length === 1) {
            return this.bizEntities.get(bizName[0]);
        }
    }

    getEntityIxPairs(bizNewest: BizEntity[]) {
        const pairs: [number, number][] = [];
        const coll: { [name: string]: BizAtom } = {};
        const pairColl: { [name: string]: BizAtom } = {};
        for (const entity of bizNewest) {
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

    sameTypeEntityArr(entityNames: string[]): {
        ok: boolean;
        entityArr: BizEntity[];
        logs: string[];
        bizPhraseType: BizPhraseType;
        bizEntityTable: EnumSysTable;
    } {
        let logs: string[] = [];
        let entityArr: BizEntity[] = [];
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
        let bizPhraseType: BizPhraseType;
        let bizEntityTable: EnumSysTable;
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
            // bizEntityTable = bizEntity.getEnumSysTable();
            switch (bizPhraseType) {
                default:
                    logs.push(`FROM can only be one of ATOM, SPEC, DUO, BIN, SHEET, PEND`);
                    ok = false;
                    break;
                case BizPhraseType.query: break;
                case BizPhraseType.atom:
                    bizEntityTable = EnumSysTable.atom; break;
                case BizPhraseType.spec:
                    bizEntityTable = EnumSysTable.spec; break;
                case BizPhraseType.duo:
                    bizEntityTable = EnumSysTable.duo; break;
                case BizPhraseType.bin:
                    bizEntityTable = EnumSysTable.bizBin; break;
                case BizPhraseType.sheet:
                    bizEntityTable = EnumSysTable.sheet; break;
                case BizPhraseType.pend:
                    bizEntityTable = EnumSysTable.pend; break;
            }
        }
        return {
            ok, entityArr, logs, bizPhraseType, bizEntityTable
        };
    }

    getIOAppOuts(bizOut: BizOut): IOAppOut[] {
        let ret: IOAppOut[] = [];
        for (let entity of this.bizArr) {
            if (entity.bizPhraseType !== BizPhraseType.ioApp) continue;
            const { outs } = entity as BizIOApp;
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

interface BizSchema extends Schema {
    biz: any;
}
export class BizSchemaBuilder extends SchemaBuilder<Biz> {
    // filter out system uq defines
    build(schema: BizSchema, res: { [phrase: string]: string }) {
        const { bizArr } = this.entity;
        schema.biz = bizArr.map(v => {
            return v.buildSchema(res);
        });
    }
}
