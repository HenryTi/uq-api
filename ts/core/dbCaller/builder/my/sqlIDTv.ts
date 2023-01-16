import { Builder } from "../Builder";
import { MySqlBuilder, sqlLineEnd } from "./mySqlBuilder";

export class SqlIDTv extends MySqlBuilder {
    private ids: number[];

    constructor(builder: Builder, ids: number[]) {
        super(builder);
        this.ids = ids;
    }

    build(): string {
        let idTbl: string = '$id';
        if (this.ids[0] < 0) {
            idTbl += '_local';
            for (let i = 0; i < this.ids.length; i++) this.ids[i] = -this.ids[i];
        }
        let sql = `
SELECT a.id, b.name as $type, a.name as $tv 
	FROM ${this.twProfix}${idTbl} as a 
		JOIN ${this.twProfix}$entity as b ON a.entity=b.id 
	WHERE a.id in (${this.ids.join(',')})` + sqlLineEnd;
        return sql;
    }
}
