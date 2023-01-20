import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlIDTv extends MySqlBuilder<number[]> {
    protected override convertParam(p: number[]): number[] {
        return p;
    }

    override build(): void {
        let idTbl: string = '$id';
        if (this.param[0] < 0) {
            idTbl += '_local';
            for (let i = 0; i < this.param.length; i++) this.param[i] = -this.param[i];
        }
        let sql = `
SELECT a.id, b.name as $type, a.name as $tv 
	FROM ${this.twProfix}${idTbl} as a 
		JOIN ${this.twProfix}$entity as b ON a.entity=b.id 
	WHERE a.id in (${this.param.join(',')})` + sqlLineEnd;
        this.sql = sql;
    }
}
