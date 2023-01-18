"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActDetail = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlActDetail extends MySqlBuilder_1.MySqlBuilder {
    constructor(sqlFactory, param) {
        super(sqlFactory);
        this.param = this.convertParam(param);
    }
    build() {
        let { main, detail, detail2, detail3 } = this.param;
        //let {values} = main;
        let mainOverride = {
            id: `(@main:=@id:=${this.twProfix}$id(${main.schema.typeId}))`,
            no: `(@no:=${this.twProfix}$no(@unit, '${main.name}', unix_timestamp()))`,
        };
        let sql = 'SET @ret=\'\'' + MySqlBuilder_1.sqlLineEnd;
        sql += this.buildInsert(main, mainOverride);
        let detailOverride = {
            id: `(@id:=${this.twProfix}$id(${detail.schema.typeId}))`,
            main: '@main',
            row: '(@row:=@row+1)',
        };
        sql += this.buildInsert(detail, detailOverride);
        if (detail2) {
            let detailOverride2 = Object.assign(Object.assign({}, detailOverride), { id: `(@id:=${this.twProfix}$id(${detail2.schema.typeId}))` });
            sql += this.buildInsert(detail2, detailOverride2);
        }
        if (detail3) {
            let detailOverride3 = Object.assign(Object.assign({}, detailOverride), { id: `(@id:=${this.twProfix}$id(${detail3.schema.typeId}))` });
            sql += this.buildInsert(detail3, detailOverride3);
        }
        sql += 'SELECT @ret as ret' + MySqlBuilder_1.sqlLineEnd;
        this.sql = sql;
    }
}
exports.SqlActDetail = SqlActDetail;
//# sourceMappingURL=SqlActDetail.js.map