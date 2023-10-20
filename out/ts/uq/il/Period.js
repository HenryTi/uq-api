"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Period = void 0;
var SpanPeriod;
(function (SpanPeriod) {
    SpanPeriod[SpanPeriod["year"] = 0] = "year";
    SpanPeriod[SpanPeriod["month"] = 1] = "month";
    SpanPeriod[SpanPeriod["week"] = 2] = "week";
    SpanPeriod[SpanPeriod["day"] = 3] = "day";
    SpanPeriod[SpanPeriod["hour"] = 4] = "hour";
    SpanPeriod[SpanPeriod["minute"] = 5] = "minute";
})(SpanPeriod || (SpanPeriod = {}));
const envTimeZone = -new Date().getTimezoneOffset() / 60;
class Period {
    constructor(timezone, siteBizMonth, siteBizDate) {
        this.timezone = timezone;
        this.siteBizMonth = siteBizMonth;
        this.siteBizDate = siteBizDate;
        let date = this.newDate();
        this.state = {
            to: date,
            from: new Date(date),
        };
        this.init();
    }
    newDate() {
        let ret = new Date();
        ret.setHours(ret.getHours() - envTimeZone + this.timezone);
        ret.setHours(0, 0, 0, 0);
        return ret;
    }
}
exports.Period = Period;
class DayPeriod extends Period {
    init() {
        this.type = SpanPeriod.day;
        let { from: fromDate, to: toDate } = this.state;
        let from = new Date(fromDate);
        let to = new Date(toDate);
        to.setDate(fromDate.getDate() + 1);
        this.state = {
            from,
            to,
        };
    }
    get internal() {
        return 24 * 60;
    }
}
class WeekPeriod extends Period {
    init() {
        let { to: toDate } = this.state;
        this.type = SpanPeriod.week;
        let dayOfWeek = toDate.getDay();
        let dayOfMonth = toDate.getDate();
        let diff = dayOfMonth - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
        let to = new Date(toDate);
        let from = new Date(toDate.setDate(diff));
        to.setDate(toDate.getDate() + 7);
        this.state = {
            from,
            to,
        };
    }
    get internal() {
        return 24 * 60 * 7;
    }
}
class MonthPeriod extends Period {
    init() {
        let { from: fromDate, to: toDate } = this.state;
        this.type = SpanPeriod.month;
        let year = toDate.getFullYear();
        let month = toDate.getMonth();
        let date = toDate.getDate();
        if (date < this.siteBizDate) {
            month--;
            if (month < 0) {
                month = 11;
                year--;
            }
            ;
        }
        let from = new Date(year, month, this.siteBizDate);
        let to = new Date(from);
        to.setMonth(month + 1);
        this.state = {
            from,
            to,
        };
    }
    get internal() {
        return 0;
    }
}
class YearPeriod extends Period {
    init() {
        let { from, to } = this.state;
        this.type = SpanPeriod.year;
        let year = to.getFullYear();
        let month = to.getMonth();
        let date = to.getDate();
        if (month < this.siteBizMonth) {
            year--;
        }
        else if (date < this.siteBizDate) {
            month++;
            if (month > 11)
                year++;
        }
        month = this.siteBizMonth;
        let toValue = new Date(from);
        toValue.setFullYear(to.getFullYear() + 1);
        this.state = {
            from: new Date(year, month, this.siteBizDate),
            to: toValue,
        };
    }
    get internal() {
        return;
    }
}
function createPeriod(periodType, timezone, siteBizMonth, siteBizDate) {
    let period;
    switch (periodType) {
        case SpanPeriod.day:
            period = new DayPeriod(timezone, siteBizMonth, siteBizDate);
            break;
        case SpanPeriod.week:
            period = new WeekPeriod(timezone, siteBizMonth, siteBizDate);
            break;
        case SpanPeriod.month:
            period = new MonthPeriod(timezone, siteBizMonth, siteBizDate);
            break;
        case SpanPeriod.year:
            period = new YearPeriod(timezone, siteBizMonth, siteBizDate);
            break;
    }
    return period;
}
//# sourceMappingURL=Period.js.map