"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBudCheck = exports.BizBudRadio = exports.BizBudOptions = exports.BizBudSubItems = exports.BizBudAtom = exports.BizBudDate = exports.BizBudChar = exports.BizBudDec = exports.BizBudInt = exports.BizBudNone = exports.BizBud = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
class BizBud extends Base_1.BizBase {
    get objName() { return undefined; }
    get dataTypeNum() {
        var _a;
        return (_a = Base_1.BudDataType[this.dataType]) !== null && _a !== void 0 ? _a : 0;
    }
    constructor(type, name, caption) {
        super();
        this.type = type;
        this.name = name;
        this.caption = caption;
    }
    buildSchema() {
        let ret = super.buildSchema();
        return Object.assign(Object.assign({}, ret), { dataType: this.dataType, value: this.value, history: this.hasHistory === true ? true : undefined });
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        if (this.hasIndex === true) {
            let phrase = `${prefix}.${this.name}.$index`;
            phrases.push([phrase, '', '', '0']);
        }
    }
}
exports.BizBud = BizBud;
class BizBudNone extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = 'none';
    }
    parser(context) {
        return new parser_1.PBizBudNone(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}
exports.BizBudNone = BizBudNone;
class BizBudInt extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = 'int';
    }
    parser(context) {
        return new parser_1.PBizBudInt(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}
exports.BizBudInt = BizBudInt;
class BizBudDec extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = 'dec';
    }
    parser(context) {
        return new parser_1.PBizBudDec(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}
exports.BizBudDec = BizBudDec;
class BizBudChar extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = 'char';
    }
    parser(context) {
        return new parser_1.PBizBudChar(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}
exports.BizBudChar = BizBudChar;
class BizBudDate extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = 'date';
    }
    parser(context) {
        return new parser_1.PBizBudDate(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}
exports.BizBudDate = BizBudDate;
/*
export class BizBudID extends BizBud {
    readonly dataType = 'ID';
    ID: ID;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudID(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return { ...ret, ID: this.ID?.name };
    }
}
*/
class BizBudAtom extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = 'atom';
    }
    parser(context) {
        return new parser_1.PBizBudAtom(this, context);
    }
    buildSchema() {
        var _a;
        let ret = super.buildSchema();
        return Object.assign(Object.assign({}, ret), { atom: (_a = this.atom) === null || _a === void 0 ? void 0 : _a.name });
    }
    get objName() { var _a; return (_a = this.atom) === null || _a === void 0 ? void 0 : _a.phrase; }
}
exports.BizBudAtom = BizBudAtom;
class BizBudSubItems extends BizBud {
    constructor() {
        super(...arguments);
        this.items = [];
    }
    buildSchema() {
        let ret = super.buildSchema();
        return Object.assign(Object.assign({}, ret), { items: this.items.map(v => {
                let { name, caption, value } = v;
                return [name, caption, value];
            }) });
    }
    buildPhrases(phrases, prefix) {
        var _a;
        super.buildPhrases(phrases, prefix);
        let phrase = `${prefix}.${this.name}`;
        for (let item of this.items) {
            phrases.push([`${phrase}.${item.name}`, (_a = item.caption) !== null && _a !== void 0 ? _a : '', '', this.getTypeNum()]);
        }
    }
}
exports.BizBudSubItems = BizBudSubItems;
class BizBudOptions extends BizBudSubItems {
    constructor() {
        super(...arguments);
        this.dataType = 'radio';
    }
    parser(context) {
        return new parser_1.PBizBudItems(this, context);
    }
}
exports.BizBudOptions = BizBudOptions;
class BizBudRadio extends BizBudSubItems {
    constructor() {
        super(...arguments);
        this.dataType = 'radio';
    }
    parser(context) {
        return new parser_1.PBizBudRadio(this, context);
    }
}
exports.BizBudRadio = BizBudRadio;
class BizBudCheck extends BizBudSubItems {
    constructor() {
        super(...arguments);
        this.dataType = 'check';
    }
    parser(context) {
        return new parser_1.PBizBudCheck(this, context);
    }
}
exports.BizBudCheck = BizBudCheck;
//# sourceMappingURL=Bud.js.map