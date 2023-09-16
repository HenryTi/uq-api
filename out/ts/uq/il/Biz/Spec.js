"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSpec = void 0;
const parser_1 = require("../../parser");
const field_1 = require("../field");
const Entity_1 = require("./Entity");
class BizSpec extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'spec';
        this.keys = new Map();
    }
    parser(context) {
        return new parser_1.PBizSpec(this, context);
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
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let keys = [];
        for (let [, value] of this.keys) {
            keys.push(value.buildSchema(res));
        }
        if (keys.length === 0)
            keys = undefined;
        let id = (0, field_1.idField)('id', 'big');
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
exports.BizSpec = BizSpec;
//# sourceMappingURL=Spec.js.map