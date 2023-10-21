import { BBizEntity, DbContext } from "../../builder";
import { BigInt, Char, DDate, DataType, Dec } from "../datatype";
import { Entity } from "../entity";
import { Field } from "../field";
import { BizBase, BudDataType } from "./Base";
import { Biz } from "./Biz";
import { BizBud, BizBudValue } from "./Bud";
import { BizRole } from "./Role";

export enum BudIndex {
    none = 0x0000,
    index = 0x0001,
}
/*
export interface IBud {
    id: number;                 // phrase id
    phrase: string;
    caption: string;
    memo: string;
    dataType: BudDataType;
    objName: string;
    typeNum: string;
    optionsItemType: OptionsItemValueType;
    value: string | number;
    flag: BudFlag;
}
*/
export interface Permission {
    a: boolean;                 // all permission
    c: boolean;                 // create
    r: boolean;                 // read
    u: boolean;                 // update·
    d: boolean;                 // delete
    l: boolean;                 // list
}

export abstract class BizEntity extends BizBase {
    readonly props: Map<string, BizBudValue> = new Map();
    readonly permissions: { [role: string]: Permission } = {};
    source: string = undefined;
    protected abstract get fields(): string[];

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.props.size > 0) {
            let props = [];
            for (let [, value] of this.props) {
                props.push(value.buildSchema(res));
            }
            Object.assign(ret, { props });
        }
        return ret;
    }
    okToDefineNewName(name: string): boolean {
        if (super.okToDefineNewName(name) === false) return false;
        let bud = this.props.get(name.toLowerCase());
        return (bud === undefined);
    }

    hasField(fieldName: string): boolean {
        return this.fields.includes(fieldName);
    }

    protected buildPhrase(prefix: string) {
        this.phrase = this.name;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        this.forEachBud(bud => {
            bud.buildPhrases(phrases, phrase)
        })
    }

    buildIxRoles(ixRoles: any[]) {
        for (let role in this.permissions) {
            let bizRole = role === '*' ? undefined : this.biz.bizEntities.get(role) as BizRole;
            // if (bizRole === undefined) debugger;
            this.setIxRoles(ixRoles, bizRole, this.permissions[role]);
        }
    }

    private setIxRoles(ixRoles: any[], bizRole: BizRole, permission: Permission) {
        let { a, c, r, u, d, l } = permission;
        let x: number;
        if (bizRole === undefined) {
            x = -1;
        }
        else {
            x = bizRole.id;
            for (let [, r] of bizRole.roles) {
                this.setIxRoles(ixRoles, r, permission);
            }
        }
        let item = [
            this.id,
            x,
            a === true ? 1 : 0,
            c === true ? 1 : 0,
            r === true ? 1 : 0,
            u === true ? 1 : 0,
            d === true ? 1 : 0,
            l === true ? 1 : 0,
        ];
        ixRoles.push(item);
    }

    getBizBase1(bizName: string): BizBase {
        let ret = super.getBizBase1(bizName);
        if (ret !== undefined) return ret;
        ret = this.props.get(bizName);
        if (ret !== undefined) return ret;
        //ret = this.assigns.get(bizName);
        // if (ret !== undefined) return ret;
    }

    getBizBase(bizName: string[]): BizBase {
        let ret = super.getBizBase(bizName);
        if (ret !== undefined) return ret;
        let { bizEntities: bizes } = this.biz;
        let [n0] = bizName;
        ret = bizes.get(n0);
        if (ret === undefined) {
            throw Error('not found');
        };
        return ret.getBizBase(bizName);
    }

    protected buildField(bud: BizBudValue): Field {
        let { name, dataType } = bud;
        let field = new Field();
        field.name = name;
        let fieldDataType: DataType;
        switch (dataType) {
            default: debugger; throw new Error(`unknown BizBud ${dataType}`);
            case BudDataType.int:
            case BudDataType.ID: fieldDataType = new BigInt(); break;
            case BudDataType.date: fieldDataType = new DDate(); break;
            case BudDataType.dec: fieldDataType = new Dec(20, 6); break;
            case BudDataType.char: fieldDataType = new Char(50); break;
        }
        field.dataType = fieldDataType;
        return field;
    }

    getBud(name: string): BizBud {
        let bud = this.props.get(name);
        return bud;
    }

    forEachBud(callback: (bud: BizBud) => void) {
        for (let [, bud] of this.props) callback(bud);
    }

    db(dbContext: DbContext): BBizEntity {
        return undefined;
    }
}
