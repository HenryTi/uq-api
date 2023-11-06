import { Table, WithFrom } from "./statementWithFrom";
import { SqlTable, StatementBase } from "./statement";

export abstract class DeleteStatement extends WithFrom {
    tables: (SqlTable | string)[];
}

export abstract class TruncateStatement extends StatementBase {
    table: Table;
}