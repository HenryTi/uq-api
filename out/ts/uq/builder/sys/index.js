"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sys = exports.sheetFields = void 0;
const tables_1 = require("./tables");
const archiveProcs_1 = require("./archiveProcs");
const settingProcs_1 = require("./settingProcs");
const entityProcs_1 = require("./entityProcs");
const sheetProcs_1 = require("./sheetProcs");
const accessProcs_1 = require("./accessProcs");
const importProcs_1 = require("./importProcs");
const queueProcs_1 = require("./queueProcs");
const roleProcs_1 = require("./roleProcs");
const IDProcedures_1 = require("./IDProcedures");
var sheetProcs_2 = require("./sheetProcs");
Object.defineProperty(exports, "sheetFields", { enumerable: true, get: function () { return sheetProcs_2.sheetFields; } });
class Sys {
    constructor(context) {
        this.tables = new tables_1.SysTables(context);
        this.procedures = [
            new settingProcs_1.SettingProcedures(context),
            new entityProcs_1.EntityProcedures(context),
            new sheetProcs_1.SheetProcedures(context),
            new archiveProcs_1.ArchiveProcedures(context),
            new accessProcs_1.AccessProcedures(context),
            new importProcs_1.ImportProcedures(context),
            new queueProcs_1.QueueProcedures(context),
            new IDProcedures_1.IDProcedures(context),
            new roleProcs_1.RoleProcedures(context),
        ];
    }
    build() {
        this.tables.build();
        for (let p of this.procedures)
            p.build();
    }
}
exports.Sys = Sys;
//# sourceMappingURL=index.js.map