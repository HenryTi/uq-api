import { ParamActDetail } from "../../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlActDetail extends MySqlBuilder<ParamActDetail> {
    protected convertParam(p: ParamActDetail): ParamActDetail {
        let { main, detail, detail2, detail3 } = p;
        let ret = Object.assign({}, p);
        let types = ['id'];
        ret.main = this.getTableSchema(main.name as unknown as string, types, [(main as any).value as any]);
        ret.detail = this.getTableSchema(detail.name as unknown as string, types, detail.values);
        if (detail2) {
            ret.detail2 = this.getTableSchema(detail2.name as unknown as string, types, detail2.values);
        }
        if (detail3) {
            ret.detail3 = this.getTableSchema(detail3.name as unknown as string, types, detail3.values);
        }
        return ret;
    }

    build(): void {
        let { main, detail, detail2, detail3 } = this.param;
        //let {values} = main;
        let mainOverride = {
            id: `(@main:=@id:=${this.twProfix}$id(${main.schema.typeId}))`,
            no: `(@no:=${this.twProfix}$no(@unit, '${main.name}', unix_timestamp()))`,
        }
        let sql = 'SET @ret=\'\'' + sqlLineEnd;
        sql += this.buildInsert(main, mainOverride);
        let detailOverride = {
            id: `(@id:=${this.twProfix}$id(${detail.schema.typeId}))`,
            main: '@main',
            row: '(@row:=@row+1)',
        }
        sql += this.buildInsert(detail, detailOverride);
        if (detail2) {
            let detailOverride2 = {
                ...detailOverride,
                id: `(@id:=${this.twProfix}$id(${detail2.schema.typeId}))`,
            }
            sql += this.buildInsert(detail2, detailOverride2);
        }
        if (detail3) {
            let detailOverride3 = {
                ...detailOverride,
                id: `(@id:=${this.twProfix}$id(${detail3.schema.typeId}))`,
            }
            sql += this.buildInsert(detail3, detailOverride3);
        }
        sql += 'SELECT @ret as ret' + sqlLineEnd;
        this.sql = sql;
    }
}
