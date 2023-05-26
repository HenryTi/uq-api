export interface ParamPage {
    start: number;
    size: number;
}

export interface Field {
    name: string;
    type: string;
    track: boolean;
}

export interface ExField {
    field: string;
    sum: boolean;
    log: boolean;
    time: boolean;
    track: boolean;
    memo: boolean;
}

export enum EnumIdType {
    None = 0
    , UID = 1   // UUID or ULocal or UMinute
    , UUID = 2	// universally unique identifier (UUID)
    , ULocal = 3	// local unique identifier
    , UMinute = 4	// minute unique identifier
    , Global = 11, Local = 12, Minute = 13
    , MinuteId = 21
} // Minute: unique in uq

export interface EntitySchema {
    name: string;
    typeId: number;
    type: string;
    biz: string;
    keys: Field[];
    fields: Field[];
    nameNoVice: string[];
    owner: boolean;
    idType: EnumIdType;
    isMinute: boolean;
    create: boolean;
    update: boolean;
    hasSort: boolean;
}

export interface TableSchema {
    name: string;
    schema: EntitySchema;
    values: any[];
    isXi?: boolean;					// xi -> ix
}

export interface ParamActs {
    [ID: string]: TableSchema;
}

export interface ParamActIX {
    IX: TableSchema;
    ID: TableSchema;
    IXs?: { IX: TableSchema, ix: number }[];
    values: any[];
}

export interface ParamActIXSort {
    IX: TableSchema;
    ix: number;
    xi: number;					// id to be moved
    after: number;				// insert after id. if before first, then 0
}

export interface ParamActID {
    ID: TableSchema;
    value: object;
    IX: TableSchema[];
    ix: (number | object)[];
}

export interface ParamActDetail {
    main: TableSchema;
    detail: TableSchema;
    detail2?: TableSchema;
    detail3?: TableSchema;
}

export interface ParamQueryID {
    ID: TableSchema;
    IX: TableSchema[];
    IDX: TableSchema[];
    key: { [key: string]: string | number };
    id: number | number[];
    ix: number;
    idx: number | number[];
    keyx: { [key: string]: string | number };
    page: ParamPage;
    order: 'asc' | 'desc';
}

export interface ParamQuerySum {

}

export interface ParamQueryLog {

}

export interface ParamQueryNO {

}

export interface ParamIDNO {
    ID: TableSchema;
    stamp: number;
}

export interface ParamIDDetailGet extends ParamActDetail {
    id: number;
}

export interface ParamID {
    IDX: TableSchema[];
    id: number | number[];
    order?: 'asc' | 'desc',
    page?: ParamPage;
}

export interface ParamKeyID {
    ID: TableSchema;
    IDX: TableSchema[];
    IX?: TableSchema[];
    key: { [key: string]: number | string };
    ix?: number;
    page?: ParamPage;
}

export interface ParamIX {
    IX: TableSchema;
    IX1: TableSchema;
    ix: number | number[];
    IDX?: TableSchema[];
    order?: 'asc' | 'desc';
    page?: ParamPage;
}

export interface ParamIXValues {
    IX: TableSchema;
    ix: number;
    order?: 'asc' | 'desc';
    page?: ParamPage;
}

export interface ParamKeyIX {
    ID: TableSchema;
    key: { [key: string]: number | string };
    IX: TableSchema;
    IDX?: TableSchema[];
    page?: ParamPage;
}

export interface ParamIDLog {
    IDX: TableSchema;
    field: string;
    id: number;
    log: 'each' | 'day' | 'week' | 'month' | 'year';
    timeZone?: number;
    far?: number;
    near?: number;
    page: ParamPage;
}

export interface ParamSum {
    IDX: TableSchema;
    field: string[];
    far: number;		// 开始时间tick >= far
    near: number;		// 结束时间tick < near
}

export interface ParamIDSum extends ParamSum {
    id: number | number[];
}

export interface ParamKeyIDSum extends ParamSum {
    ID: TableSchema;
    key: { [key: string]: number | string };
    page?: ParamPage;
}

export interface ParamIXSum extends ParamSum {
    IX: TableSchema;
    ix: number | number[];
    page?: ParamPage;
}

export interface ParamKeyIXSum extends ParamSum {
    ID: TableSchema;
    key: { [key: string]: number | string };
    IX: TableSchema;
    page?: ParamPage;
}

export interface ParamIDinIX {
    ID: TableSchema;
    ix: number;
    IX: TableSchema;
    page: ParamPage;
}

export interface ParamIDxID {
    ID: TableSchema;
    IX: TableSchema;
    ID2: TableSchema;
    page?: ParamPage;
}

export interface ParamIDTree {
    ID: TableSchema;
    parent: number;
    key: string | number;
    level: number;				// 无值，默认1一级
    page: ParamPage;
}
