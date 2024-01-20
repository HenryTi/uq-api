"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseStatement = exports.UseTimeSpan = exports.UseYearZone = exports.UseMonthZone = exports.UseTimeZone = exports.UseSetting = exports.UseBase = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const IElement_1 = require("../IElement");
const Statement_1 = require("./Statement");
// use 某些特定的值，比如年月日，时段
class UseBase extends IElement_1.IElement {
    constructor(statement) {
        super();
        this.statement = statement;
    }
}
exports.UseBase = UseBase;
class UseSetting extends UseBase {
}
exports.UseSetting = UseSetting;
class UseTimeZone extends UseSetting {
    constructor() {
        super(...arguments);
        this.type = 'timezone';
    }
    parser(context) {
        return new parser_1.PUseTimeZone(this, context);
    }
    db(context) { return new builder_1.BUseTimeZone(this, context); }
}
exports.UseTimeZone = UseTimeZone;
class UseMonthZone extends UseSetting {
    constructor() {
        super(...arguments);
        this.type = 'monthzone';
    }
    parser(context) {
        return new parser_1.PUseMonthZone(this, context);
    }
    db(context) { return new builder_1.BUseMonthZone(this, context); }
}
exports.UseMonthZone = UseMonthZone;
class UseYearZone extends UseSetting {
    constructor() {
        super(...arguments);
        this.type = 'yearzone';
    }
    parser(context) {
        return new parser_1.PUseYearZone(this, context);
    }
    db(context) { return new builder_1.BUseYearZone(this, context); }
}
exports.UseYearZone = UseYearZone;
class UseTimeSpan extends UseBase {
    constructor() {
        super(...arguments);
        this.type = 'timespan';
    }
    parser(context) {
        return new parser_1.PUseTimeSpan(this, context);
    }
    db(context) { return new builder_1.BUseTimeSpan(this, context); }
}
exports.UseTimeSpan = UseTimeSpan;
/*
export class UseOut extends UseBase {
    readonly type = 'out';
    varName: string;
    outEntity: BizOut;
    parser(context: PContext): PElement<IElement> {
        return new PUseOut(this, context);
    }
    override db(context: DbContext) { return new BUseOut(this, context) }
}
*/
class UseStatement extends Statement_1.Statement {
    get type() { return 'use'; }
    parser(context) {
        return new parser_1.PUseStatement(this, context);
    }
    db(db) {
        return db.useStatement(this);
    }
}
exports.UseStatement = UseStatement;
//# sourceMappingURL=use.js.map