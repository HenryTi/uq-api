import { BBizEntity, DbContext } from "../../builder";
import { BigInt, Char, DDate, DataType, Dec } from "../datatype";
import { Field } from "../field";
import { BizBase } from "./Base";
import { Biz } from "./Biz";
import { BizBud } from "./Bud";
import { OptionsItemValueType } from "./Options";

export enum BudFlag {
    none = 0x0000,
    index = 0x0001,
}
export interface IBud {
    phrase: string;
    caption: string;
    memo: string;
    dataTypeNum: number;
    objName: string;
    typeNum: string;
    optionsItemType: OptionsItemValueType;
    value: string | number;
    flag: BudFlag;
}

export abstract class BizEntity extends BizBase {
    readonly props: Map<string, BizBud> = new Map();
    // readonly keyFields: Field[] = [];
    // readonly propFields: Field[] = [];
    readonly biz: Biz
    entitySchema: string = undefined;
    source: string = undefined;
    id: number;

    constructor(biz: Biz) {
        super();
        this.biz = biz;
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let props = []; //, assigns = [];
        for (let [, value] of this.props) {
            props.push(value.buildSchema(res));
        }
        /*
        for (let [, value] of this.assigns) {
            assigns.push(value.buildSchema());
        }
        */
        if (props.length > 0) {
            Object.assign(ret, { props });
        }
        /*
        if (assigns.length > 0) {
            Object.assign(ret, { assigns })
        }
        */
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
        for (let [, value] of this.props) {
            value.buildPhrases(phrases, phrase)
        }
        /*
        for (let [, value] of this.assigns) {
            value.buildPhrases(phrases, phrase)
        }
        */
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
            case 'int':
            case 'ID': fieldDataType = new BigInt(); break;
            case 'date': fieldDataType = new DDate(); break;
            case 'dec': fieldDataType = new Dec(20, 6); break;
            case 'char': fieldDataType = new Char(50); break;
        }
        field.dataType = fieldDataType;
        return field;
    }

    // buildFields() { }

    getBud(name: string): BizBud {
        let bud = this.props.get(name);
        // if (bud !== undefined) return bud;
        // bud = this.assigns.get(name);
        return bud;
    }

    getAllBuds(): IBud[] {
        let buds: BizBud[] = [];
        for (let [, bud] of this.props) buds.push(bud);
        return buds;
    }

    db(dbContext: DbContext): BBizEntity {
        return undefined;
    }
}
