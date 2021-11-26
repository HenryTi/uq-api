import { EntityRunner } from "../core";
import { logger } from "../tool";

export async function execQueueAct(runner: EntityRunner): Promise<void> {
	if (runner.execQueueActError === true) return;
	try {
		// for (let i=0; i<20; i++) {
		let ret: any[] = await runner.call('$exec_queue_act', []);
		if (ret) {
			let db = runner.getDb();
			for (let row of ret) {
				let { entity, entityName, exec_time, unit, param, repeat, interval } = row;
				let sql = `
CREATE EVENT IF NOT EXISTS \`${db}\`.\`tv_${entityName}\`
	ON SCHEDULE AT CURRENT_TIMESTAMP DO CALL \`${db}\`.\`tv_${entityName}\`(${unit}, 0);
`;
				await runner.sql(sql, []);
				if (repeat === 1) {
					sql = `DELETE a FROM \`${db}\`.tv_$queue_act AS a WHERE a.unit=${unit} AND a.entity=${entity};`;
				}
				else {
					sql = `UPDATE \`${db}\`.tv_$queue_act AS a 
						SET a.exec_time=date_add(GREATEST(a.exec_time, CURRENT_TIMESTAMP()), interval a.interval minute)
							, a.repeat=a.repeat-1
						WHERE a.unit=${unit} AND a.entity=${entity};
					`;
				}
				await runner.sql(sql, []);
			}
		}
		//}
	}
	catch (err) {
		logger.error(`execQueueAct: `, err);
		runner.execQueueActError = true;
	}
}
