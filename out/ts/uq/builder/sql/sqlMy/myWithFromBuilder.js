"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyJoin = exports.MyOrder = exports.MyFrom = exports.MyWhere = exports.MyColumn = exports.MyWithFromBuilder = void 0;
const statementWithFrom_1 = require("../statementWithFrom");
const select_1 = require("../select");
const il_1 = require("../../../il");
class MyWithFromBuilder extends statementWithFrom_1.WithFromBuilder {
    createFrom() { return new MyFrom; }
    createJoin() { return new MyJoin; }
    createWhere() { return new MyWhere; }
    buildFrom(sb, tab) {
        if (this._from !== undefined) {
            lnAuto();
            this._from.to(sb, tab);
        }
        function lnAuto() {
            if (tab > 0)
                sb.nTab(1);
            else
                sb.nAuto();
        }
    }
    buildWhereTo(sb, tab) {
        if (this._from === undefined && this._where === undefined)
            return;
        if (tab > 0)
            sb.nTab(1);
        else
            sb.nAuto();
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
                sb.l();
                this._where.exp.to(sb);
                sb.r();
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
                            for (let c of s.columns)
                                sb.sep().append('ifnull(').fld(c).append(',\'\')');
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
exports.MyWithFromBuilder = MyWithFromBuilder;
class MyColumn extends statementWithFrom_1.Column {
    to(sb) {
        sb.exp(this.exp);
        if (this.alias !== undefined) {
            sb.append(' AS `').append(this.alias).append('`');
        }
    }
}
exports.MyColumn = MyColumn;
class MyWhere extends statementWithFrom_1.Where {
}
exports.MyWhere = MyWhere;
class MyFrom extends statementWithFrom_1.From {
    to(sb, tab) {
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
    addWhereUnit(sb) {
        if (!this.tbl)
            return;
        this.tbl.addWhereUnit(sb);
        // a.$unit=_$unit 应该加在join on上面，而不是where里面。否则left join会出错。
        /*
        if (this.joins) {
            for (let j of this.joins) j.tbl?.addWhereUnit(sb);
        }
        */
    }
}
exports.MyFrom = MyFrom;
class MyOrder extends select_1.Order {
    to(sb) {
        sb.exp(this.exp).append(this.asc === 'desc' ? ' DESC' : ' ASC');
    }
}
exports.MyOrder = MyOrder;
class MyJoin extends statementWithFrom_1.Join {
    to(sb, tab) {
        if (tab > 0)
            sb.nTab(2);
        else
            sb.nAuto();
        let j;
        switch (this.join) {
            case il_1.JoinType.queue:
                j = 'JOIN';
                break;
            case il_1.JoinType.left:
                j = 'LEFT JOIN';
                break;
            case il_1.JoinType.right:
                j = 'RIGHT JOIN';
                break;
            case il_1.JoinType.inner:
            case il_1.JoinType.join:
                j = 'JOIN';
                break;
            case il_1.JoinType.cross:
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
exports.MyJoin = MyJoin;
//# sourceMappingURL=myWithFromBuilder.js.map