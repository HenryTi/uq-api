"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpanPeriod = exports.SetEqu = void 0;
var SetEqu;
(function (SetEqu) {
    SetEqu[SetEqu["equ"] = 0] = "equ";
    SetEqu[SetEqu["add"] = 1] = "add";
    SetEqu[SetEqu["sub"] = 2] = "sub";
})(SetEqu || (exports.SetEqu = SetEqu = {}));
;
var SpanPeriod;
(function (SpanPeriod) {
    SpanPeriod[SpanPeriod["year"] = 0] = "year";
    SpanPeriod[SpanPeriod["month"] = 1] = "month";
    SpanPeriod[SpanPeriod["week"] = 2] = "week";
    SpanPeriod[SpanPeriod["day"] = 3] = "day";
    SpanPeriod[SpanPeriod["hour"] = 4] = "hour";
    SpanPeriod[SpanPeriod["minute"] = 5] = "minute";
})(SpanPeriod || (exports.SpanPeriod = SpanPeriod = {}));
//# sourceMappingURL=tool.js.map