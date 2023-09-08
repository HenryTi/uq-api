import { DbContext } from '../dbContext';
import { SysTables } from './tables';
import { SysProcedures } from './sysProcedures';
import { ArchiveProcedures } from './archiveProcs';
import { SettingProcedures } from './settingProcs';
import { EntityProcedures } from './entityProcs';
import { SheetProcedures } from './sheetProcs';
import { AccessProcedures } from './accessProcs';
import { ImportProcedures } from './importProcs';
import { QueueProcedures } from './queueProcs';
import { RoleProcedures } from './roleProcs';
import { IDProcedures } from './IDProcedures';

export { sheetFields } from './sheetProcs';

export class Sys {
    private tables: SysTables;
    private procedures: SysProcedures[];

    constructor(context: DbContext) {
        this.tables = new SysTables(context);
        this.procedures = [
            new SettingProcedures(context),
            new EntityProcedures(context),
            new SheetProcedures(context),
            new ArchiveProcedures(context),
            new AccessProcedures(context),
            new ImportProcedures(context),
            new QueueProcedures(context),
            new IDProcedures(context),
            new RoleProcedures(context),
        ];
    }

    build() {
        this.tables.build();
        for (let p of this.procedures) p.build();
    }
}
