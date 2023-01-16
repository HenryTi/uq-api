import { consts, Db, EntityRunner } from "../core";
import { logger } from "../tool";
/*
export async function execQueueAct(runner: EntityRunner): Promise<number> {
    if (runner.execQueueActError === true) return -1;
    let sql: string;
    try {
        let ret: any[] = await runner.call('$exec_queue_act', []);
        if (ret) {
            let db = runner.getDb();
            for (let row of ret) {
                let { entity, entityName, exec_time, unit, param, repeat, interval } = row;
                sql = `
USE \`${db}\`;
DROP EVENT IF EXISTS \`tv_${entityName}\`;
CREATE EVENT IF NOT EXISTS \`tv_${entityName}\`
    ON SCHEDULE AT CURRENT_TIMESTAMP ON COMPLETION PRESERVE DO CALL \`tv_${entityName}\`(${unit}, 0);
`;
                await runner.sql(sql, []);
                if (repeat === 1) {
                    sql = `use \`${db}\`; DELETE a FROM tv_$queue_act AS a WHERE a.unit=${unit} AND a.entity=${entity};`;
                }
                else {
                    sql = `use \`${db}\`; UPDATE tv_$queue_act AS a 
                        SET a.exec_time=date_add(GREATEST(a.exec_time, CURRENT_TIMESTAMP()), interval a.interval minute)
                            , a.repeat=a.repeat-1
                        WHERE a.unit=${unit} AND a.entity=${entity};
                    `;
                }
                await runner.sql(sql, []);
            }
        }
        return 0;
    }
    catch (err) {
        let $uqDb = Db.db(consts.$uq);
        await $uqDb.uqLog(0, runner.getDb(), 'Error execQueueAct'
            , (err.message ?? '') + ': ' + sql);
        logger.error(`execQueueAct: `, err);
        // runner.execQueueActError = true; 暂时先不处理这个 2022-1-6
        return -1;
    }
}
*/
