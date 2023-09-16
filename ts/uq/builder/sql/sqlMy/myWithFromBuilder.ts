import { SqlBuilder } from "../sqlBuilder";
import { Column, Where, From, Join, WithFromBuilder } from '../statementWithFrom';
import { Order } from '../select';
import { JoinType } from "../../../il";

export class MyWithFromBuilder extends WithFromBuilder {
    protected createFrom(): From { return new MyFrom }
    protected createJoin(): Join { return new MyJoin }
    protected createWhere(): Where { return new MyWhere }
    buildFrom(sb: SqlBuilder, tab: number) {
        if (this._from !== undefined) {
            lnAuto();
            this._from.to(sb, tab);
        }
        function lnAuto() {
            if (tab > 0) sb.nTab(1);
            else sb.nAuto();
        }
    }
    buildWhereTo(sb: SqlBuilder, tab: number) {
        if (this._from === undefined && this._where === undefined) return;
        if (tab > 0) sb.nTab(1);
        else sb.nAuto();
        sb.append('WHERE 1=1');
        this._from?.addWhereUnit(sb);

        if (this._from !== undefined) {
            let { tbl, joins } = this._from;
            //tbl.addJoinOn(sb);
            if (joins !== undefined) {
                // 这个不能加andUnit。因为left join会让内容选不出来
                // joins.forEach(j => j.tbl.andUnit(sb));
            }
        }
        if (this._where !== undefined) {
            sb.append(' AND ');
            if (this._searches === undefined || this._searches.length === 0)
                this._where.exp.to(sb);
            else {
                sb.l(); this._where.exp.to(sb); sb.r();
                let count = 0;
                for (let s of this._searches) {
                    count += s.columns.length;
                }
                if (count > 0) {
                    sb.append(' AND (');
                    sb.sepStart(' OR ');
                    for (let s of this._searches) {
                        let cols = s.columns;
                        let len = cols.length;
                        sb.sep();
                        if (len === 0) {
                            sb.append('1=0');
                            continue;
                        }

                        if (len === 1) {
                            sb.fld(cols[0]);
                        }
                        else {
                            sb.append('CONCAT(');
                            sb.sepStart(',\' \',');
                            for (let c of s.columns) sb.sep().append('ifnull(').fld(c).append(',\'\')');
                            sb.sepEnd();
                            sb.r();
                        }
                        sb.append(' LIKE ').var(s.key);
                    }
                    sb.r();
                }
            }
        }
    }
}

export class MyColumn extends Column {
    to(sb: SqlBuilder) {
        sb.exp(this.exp);
        if (this.alias !== undefined) {
            sb.append(' AS `').append(this.alias).append('`');
        }
    }
}

export class MyWhere extends Where {
}

export class MyFrom extends From {
    to(sb: SqlBuilder, tab: number) {
        sb.append('FROM ');
        this.tbl.to(sb);
        this.tbl.addJoinOn(sb);
        if (this.joins !== undefined) {
            for (let j of this.joins) {
                j.to(sb, tab);
                j.tbl.addJoinOn(sb);
            }
        }
    }
    addWhereUnit(sb: SqlBuilder) {
        if (!this.tbl) return;
        this.tbl.addWhereUnit(sb);
        // a.$unit=_$unit 应该加在join on上面，而不是where里面。否则left join会出错。
        /*
        if (this.joins) {
            for (let j of this.joins) j.tbl?.addWhereUnit(sb);
        }
        */
    }
}

export class MyOrder extends Order {
    to(sb: SqlBuilder) {
        sb.exp(this.exp).append(this.asc === 'desc' ? ' DESC' : ' ASC');
    }
}
export class MyJoin extends Join {
    to(sb: SqlBuilder, tab: number) {
        if (tab > 0) sb.nTab(2);
        else sb.nAuto();
        let j: string;
        switch (this.join) {
            case JoinType.queue: j = 'JOIN'; break;
            case JoinType.left: j = 'LEFT JOIN'; break;
            case JoinType.right: j = 'RIGHT JOIN'; break;
            case JoinType.inner:
            case JoinType.join: j = 'JOIN'; break;
            case JoinType.cross:
                sb.append('CROSS JOIN ');
                this.tbl.to(sb);
                if (this.on !== undefined) {
                    sb.append(' ON ').l();
                    this.on.to(sb);
                    sb.r();
                    this.tbl.addWhereUnit(sb);
                }
                return;
        }
        sb.append(j).append(' ');
        this.tbl.to(sb);
        sb.append(' ON ').l();
        this.on.to(sb);
        sb.r();
        this.tbl.addWhereUnit(sb);
    }
}
