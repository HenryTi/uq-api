"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execQueueAct = void 0;
const core_1 = require("../core");
const tool_1 = require("../tool");
function execQueueAct(runner) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (runner.execQueueActError === true)
            return;
        let sql;
        try {
            let ret = yield runner.call('$exec_queue_act', []);
            if (ret) {
                let db = runner.getDb();
                for (let row of ret) {
                    let { entity, entityName, exec_time, unit, param, repeat, interval } = row;
                    sql = `
USE \`${db}\`;
CREATE EVENT IF NOT EXISTS \`tv_${entityName}\`
	ON SCHEDULE AT CURRENT_TIMESTAMP DO CALL \`tv_${entityName}\`(${unit}, 0);
`;
                    yield runner.sql(sql, []);
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
                    yield runner.sql(sql, []);
                }
            }
        }
        catch (err) {
            let $uqDb = core_1.Db.db(core_1.consts.$uq);
            yield $uqDb.log(0, runner.getDb(), 'Error execQueueAct', ((_a = err.message) !== null && _a !== void 0 ? _a : '') + ': ' + sql);
            tool_1.logger.error(`execQueueAct: `, err);
            runner.execQueueActError = true;
        }
    });
}
exports.execQueueAct = execQueueAct;
//# sourceMappingURL=execQueueAct.js.map