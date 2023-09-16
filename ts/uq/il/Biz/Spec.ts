import { PBizSpec, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { idField } from "../field";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";

export class BizSpec extends BizEntity {
    readonly type = 'spec';
    readonly keys: Map<string, BizBud> = new Map();
    parser(context: PContext): PElement<IElement> {
        return new PBizSpec(this, context);
    }
    /*
    buildFields(): void {
        for (let [, value] of this.keys) {
            this.keyFields.push(this.buildField(value));
        }
        for (let [, value] of this.props) {
            this.propFields.push(this.buildField(value));
        }
    }
    */
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let keys = [];
        for (let [, value] of this.keys) {
            keys.push(value.buildSchema(res));
        }
        if (keys.length === 0) keys = undefined;

        let id = idField('id', 'big');
        let entitySchema = {
            name: this.name,
            type: "id",
            biz: "spec",
            private: false,
            sys: true,
            global: false,
            idType: 3,
            isMinute: false,
            /*
            keys: this.keyFields,
            fields: [
                id,
                ...this.keyFields,
                ...this.propFields
            ],
            */
        };
        this.entitySchema = JSON.stringify(entitySchema);
        return Object.assign(ret, { keys });
    }
}
