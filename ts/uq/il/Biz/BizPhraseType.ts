import { EnumSysTable } from "../EnumSysTable";

export enum BizPhraseType {
    any = 0,
    atom = 11,
    fork = 12,
    bud = 13,
    budGroup = 14,
    duo = 15,           // 二重奏
    combo = 16,

    /*
    card = 61,
    cardDetail = 63,
    cardState = 62,
    */

    sheet = 101,
    bin = 102,
    pend = 104,
    act = 111,
    query = 151,
    pick = 161,

    role = 201,
    permit = 202,
    options = 301,
    tree = 401,
    tie = 501,
    report = 601,
    in = 701,
    out = 700,
    ioApp = 710,
    ioSite = 711,
    book = 901,
    assign = 902,

    key = 1001,
    prop = 1011,
    optionsitem = 1031,

    binDiv = 2001,

    console = 6001,
};

export enum BudDataType {
    none = 0,
    int = 11,                   // bigint
    atom = 12,                  // atom id
    radio = 13,                 // single radio ids
    check = 14,                 // multiple checks
    bin = 15,
    ID = 19,

    dec = 21,                   // dec(18.6)

    char = 31,                  // varchar(100)
    str = 32,                   // varchar(100)

    date = 41,
    datetime = 42,

    optionItem = 81,            // options item
    any = 96,
    unique = 97,
    user = 98,
    arr = 99,
};

export interface BudType {
    sysTable: EnumSysTable;
}

const budTypeInt: BudType = {
    sysTable: EnumSysTable.ixBudInt,
}
const budTypeStr: BudType = {
    sysTable: EnumSysTable.ixBudStr,
}
const budTypeDec: BudType = {
    sysTable: EnumSysTable.ixBudDec,
}
export const budTypes: { [type in BudDataType]?: BudType } = {
    [BudDataType.int]: budTypeInt,
    [BudDataType.str]: budTypeStr,
    [BudDataType.char]: budTypeStr,
    [BudDataType.dec]: budTypeDec,
    [BudDataType.date]: budTypeInt,
    [BudDataType.datetime]: budTypeInt,
    [BudDataType.atom]: budTypeInt,
    [BudDataType.ID]: budTypeInt,
    [BudDataType.radio]: budTypeInt,
};
