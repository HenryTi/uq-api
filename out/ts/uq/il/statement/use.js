"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseStatement = exports.UseTimeSpan = exports.SpanPeriod = exports.UseYearZone = exports.UseMonthZone = exports.UseTimeZone = exports.UseSetting = exports.UseBase = void 0;
const parser_1 = require("../../parser");
const element_1 = require("../element");
const statement_1 = require("./statement");
class UseBase extends element_1.IElement {
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
}
exports.UseYearZone = UseYearZone;
var SpanPeriod;
(function (SpanPeriod) {
    SpanPeriod[SpanPeriod["year"] = 0] = "year";
    SpanPeriod[SpanPeriod["month"] = 1] = "month";
    SpanPeriod[SpanPeriod["week"] = 2] = "week";
    SpanPeriod[SpanPeriod["day"] = 3] = "day";
    SpanPeriod[SpanPeriod["hour"] = 4] = "hour";
    SpanPeriod[SpanPeriod["minute"] = 5] = "minute";
    SpanPeriod[SpanPeriod["second"] = 6] = "second";
})(SpanPeriod = exports.SpanPeriod || (exports.SpanPeriod = {}));
class UseTimeSpan extends UseBase {
    constructor() {
        super(...arguments);
        this.type = 'timespan';
    }
    parser(context) {
        return new parser_1.PUseTimeSpan(this, context);
    }
}
exports.UseTimeSpan = UseTimeSpan;
class UseStatement extends statement_1.Statement {
    get type() { return 'use'; }
    parser(context) {
        return new parser_1.PUseStatement(this, context);
    }
    db(db) {
        return;
    }
}
exports.UseStatement = UseStatement;
//# sourceMappingURL=use.js.map