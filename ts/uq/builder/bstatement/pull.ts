import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { Map, /*Pull, */Tuid } from "../../il";
import {
    ExpFunc, ExpField, ExpEQ, convertExp, ExpVal, ExpNum,
    ExpSelect, ExpStr
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
/*
export class BPull extends BStatement {
    protected istatement: Pull;
    override body(sqls: Sqls) {
        switch (this.istatement.entity.type) {
            case 'map':
                this.buildMapPull(sqls);
                break;
            case 'tuid':
                this.buildTuidPull(sqls);
                break;
        }
    }

    private buildMapPull(sqls: Sqls) {
        let {factory, hasUnit, unitFieldName} = this.context;
        let {entity, at, no} = this.istatement;
        let map = entity as Map;
        let {name} = map; // 引用的map，只写keys，其它字段从源导入
        let memo = factory.createMemo();        
        sqls.push(memo);
        memo.text = 'pull map ' + name;

        let varKeys = at.map(v=>convertExp(this.context, v)as ExpVal);
        let ret = this.context.buildMapPull(map, varKeys);
        sqls.push(ret);

        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(name)));

        let upsert = factory.createUpsert();
        sqls.push(upsert);
        upsert.table = new EntityTable('map_pull', hasUnit);
        upsert.cols = [
            {col: 'keyCount', val: new ExpNum(at.length)}
        ];
        upsert.keys = [
            {col: 'entity', val: new ExpSelect(selectEntity) },
            {col: 'keys', val: new ExpFunc(factory.func_concat_ws, new ExpStr('\\t'), ...varKeys)}
        ];
        if (hasUnit === true) {
            upsert.keys.unshift({col: unitFieldName, val: new ExpField(unitFieldName)});
        }
    }

    private buildTuidPull(sqls: Sqls) {
        let {factory} = this.context;
        let {entity, at, no} = this.istatement;
        let tuid = entity as Tuid;
        let {name} = tuid; // 引用的map，只写keys，其它字段从源导入
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'pull tuid ' + name;
        let ret = this.context.buildTuidPull(tuid, convertExp(this.context, at[0]) as ExpVal);
        sqls.push(ret);
    }
}
*/