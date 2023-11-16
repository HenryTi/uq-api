export enum BizPhraseType {
    any = 0,
    atom = 11,
    spec = 12,
    bud = 13,
    budGroup = 14,

    card = 61,
    cardDetail = 63,
    cardState = 62,

    sheet = 101,
    bin = 102,
    pend = 104,
    detailAct = 111,
    query = 151,
    pick = 161,

    role = 201,
    permit = 202,
    options = 301,
    tree = 401,
    tie = 501,
    report = 601,
    title = 901,
    assign = 902,

    key = 1001,
    prop = 1011,
    optionsitem = 1031,
};

export enum BudDataType {
    none = 0,
    int = 11,                   // bigint
    atom = 12,                  // atom id
    radio = 13,                 // single radio ids
    check = 14,                 // multiple checks
    intof = 15,
    ID = 19,

    dec = 21,                   // dec(18.6)

    char = 31,                  // varchar(100)
    str = 32,                   // varchar(100)

    date = 41,
    datetime = 42,
};

