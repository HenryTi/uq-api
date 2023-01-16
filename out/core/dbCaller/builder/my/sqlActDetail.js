"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActDetail = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlActDetail extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { main, detail, detail2, detail3 } = this.param;
        //let {values} = main;
        let mainOverride = {
            id: `(@main:=@id:=${this.twProfix}$id(${main.schema.typeId}))`,
            no: `(@no:=${this.twProfix}$no(@unit, '${main.name}', unix_timestamp()))`,
        };
        let sql = 'SET @ret=\'\'' + mySqlBuilder_1.sqlLineEnd;
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
        sql += 'SELECT @ret as ret' + mySqlBuilder_1.sqlLineEnd;
        return sql;
    }
}
exports.SqlActDetail = SqlActDetail;
//# sourceMappingURL=sqlActDetail.js.map