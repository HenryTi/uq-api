import { BBizEntity, DbContext } from "../../builder";
import { BigInt, Char, DDate, DataType, Dec } from "../datatype";
import { Field } from "../field";
import { BizBase, BudDataType } from "./Base";
import { Biz } from "./Biz";
import { BizBud } from "./Bud";
import { OptionsItemValueType } from "./Options";

export enum BudFlag {
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
export abstract class BizEntity extends BizBase {
    readonly props: Map<string, BizBud> = new Map();
    readonly biz: Biz
    source: string = undefined;

    constructor(biz: Biz) {
        super();
        this.biz = biz;
    }

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
    checkName(name: string): boolean {
        if (super.checkName(name) === false) return false;
        if (this.props.has(name) === true) return false;
        return true; // this.assigns.has(name) === false;
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

    protected buildField(bud: BizBud): Field {
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
