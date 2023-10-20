enum SpanPeriod {
    year, month, week, day, hour, minute
}

const envTimeZone = -new Date().getTimezoneOffset() / 60;
export abstract class Period {
    protected readonly timezone: number;
    protected readonly siteBizMonth: number;
    protected readonly siteBizDate: number;
    constructor(timezone: number, siteBizMonth: number, siteBizDate: number) {
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
    private newDate(): Date {
        let ret = new Date();
        ret.setHours(ret.getHours() - envTimeZone + this.timezone)
        ret.setHours(0, 0, 0, 0);
        return ret;
    }
    type: SpanPeriod;
    state: {
        from: Date;
        to: Date;
    };
    abstract init(): void;
    abstract get internal(): number;
}

class DayPeriod extends Period {
    init(): void {
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
    get internal(): number {
        return 24 * 60;
    }
}

class WeekPeriod extends Period {
    init(): void {
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
    get internal(): number {
        return 24 * 60 * 7;
    }
}

class MonthPeriod extends Period {
    init(): void {
        let { from: fromDate, to: toDate } = this.state;
        this.type = SpanPeriod.month;
        let year = toDate.getFullYear();
        let month = toDate.getMonth();
        let date = toDate.getDate();
        if (date < this.siteBizDate) {
            month--;
            if (month < 0) { month = 11; year-- };
        }
        let from = new Date(year, month, this.siteBizDate);
        let to: Date = new Date(from);
        to.setMonth(month + 1);
        this.state = {
            from,
            to,
        };
    }
    get internal(): number {
        return 0;
    }
}

class YearPeriod extends Period {
    init(): void {
        let { from, to } = this.state;
        this.type = SpanPeriod.year;
        let year = to.getFullYear();
        let month = to.getMonth();
        let date = to.getDate();
        if (month < this.siteBizMonth) {
            year--;
        } else if (date < this.siteBizDate) {
            month++;
            if (month > 11) year++;
        }
        month = this.siteBizMonth;
        let toValue: Date = new Date(from);
        toValue.setFullYear(to.getFullYear() + 1);
        this.state = {
            from: new Date(year, month, this.siteBizDate),
            to: toValue,
        };
    }
    get internal(): number {
        return;
    }
}

function createPeriod(periodType: SpanPeriod, timezone: number, siteBizMonth: number, siteBizDate: number): Period {
    let period: Period;
    switch (periodType) {
        case SpanPeriod.day: period = new DayPeriod(timezone, siteBizMonth, siteBizDate); break;
        case SpanPeriod.week: period = new WeekPeriod(timezone, siteBizMonth, siteBizDate); break;
        case SpanPeriod.month: period = new MonthPeriod(timezone, siteBizMonth, siteBizDate); break;
        case SpanPeriod.year: period = new YearPeriod(timezone, siteBizMonth, siteBizDate); break;
    }
    return period;
}
