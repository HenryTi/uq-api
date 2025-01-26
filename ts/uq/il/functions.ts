import { ceil } from "lodash";

export const functions: { [name: string]: number | [number, number] } = {
    concat: -1,
    concat_ws: -1,
    least: -1,
    greatest: -1,
    now: 0,
    curdate: 0,
    substr: [2, 3],
    unix_timestamp: [0, 1],
    utc_timestamp: 0,
    year: 1,
    month: 1,
    day: 1,
    weekday: 1,
    len: 1,
    ltrim: 1,
    rtrim: 1,
    from_unixtime: 1,
    hex: 1,
    unhex: 1,
    date: 1,
    utcdate: 1,
    week: 1,
    yearweek: 2,
    rand: 0,
    left: 2,
    right: 2,
    ifnull: 2,
    "if": 2,
    round: 2,
    str_to_date: 2,
    replace: 3,
    substring: 3,
    charindex: [2, 3],
    locate: [2, 3],
    ascii: 1,
    date_format: 2,
    timediff: 2,

    abs: 1,
    floor: 1,
    ceiling: 1,
    ceil: 1,
}

export const uqFunctions: { [name: string]: number | [number, number] } = {
    // tonwa internal function
    idtext: 1,
    textid: 1,
    idvalues: 1,
    minuteidfromdate: 2,
    minuteiddate: 2,
    minuteidmonth: 2,
    minuteidtime: 2,
    minuteidperiod: 3,
    unittimezone: 0,
    timezone: 0,
    bizmonth: 0,
    bizdate: 0,
    bizmonthid: 2,
    bizyearid: 3,

    // uminute: 2, 系统默认 uminute(null);
    uminutedate: 2,
    uminutetime: 2,
    uminutestamp: 1,

    me: 0,

    phraseid: 1,
    phraseofid: 1,

    // 这里添加uq函数后，必须在 MyFactory 里面明确增加相关的mysql build函数，才会自动加$site和$user两个参数
    bs_curdate: 0,
    seedatom: 1,
};
