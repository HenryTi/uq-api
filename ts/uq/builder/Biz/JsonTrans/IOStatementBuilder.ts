import { EnumSysTable, JoinType, JsonTableColumn, bigIntField, charField, intField } from "../../../il";
import { ExpAdd, ExpAtVar, ExpEQ, ExpExists, ExpField, ExpFunc, ExpNum, ExpSelect, ExpStar, ExpStr, ExpVal, ExpVar } from "../../sql";
import { Factory } from "../../sql/factory";
import { LockType } from "../../sql/select";
import { EntityTable, VarTable, FromJsonTable } from "../../sql/statementWithFrom";

const transErr = 'transerr';
const a = 'a', b = 'b', c = 'c';
const ioAppIO = '$ioAppIO';
const siteAtomApp = '$siteAtomApp';
const queueId = '$queueId';
const pSiteAtomApp = '$pSiteAtomApp';
const vJson = '$json';
const vRetJson = '$retJson';
const jsonTable = 't';
const otherSite = '$otherSite';
const endPoint = '$endPoint';
const vDone = '$done';
const atom = '$atom';
const appID = '$appID';
const ioSite = '$ioSite';

export class IOStatementBuilder {
    static transerr = '$transerr';
    private readonly factory: Factory;
    constructor(factory: Factory) {
        this.factory = factory;
    }

    transErrorTable() {
        let vtTransErr = this.factory.createVarTable();
        vtTransErr.noDrop = true;
        vtTransErr.name = IOStatementBuilder.transerr;
        const transErrIdField = intField('id');
        transErrIdField.autoInc = true;
        const atomField = bigIntField('atom');
        atomField.nullable = true;
        const noField = charField('no', 100);
        noField.nullable = true;
        vtTransErr.keys = [
            transErrIdField,
        ];
        vtTransErr.fields = [
            transErrIdField, bigIntField('appID'), atomField, noField,
        ];
        return vtTransErr;
    }

    transErrorJsonInit() {
        let initTranErr = this.factory.createSet();
        initTranErr.isAtVar = true;
        initTranErr.equ(transErr, new ExpFunc('JSON_ARRAY'));
        return initTranErr;
    }

    transErrorInsert(varAppID: ExpVal, fromField: string, fromVar: string) {
        const insertErr = this.factory.createInsert();
        insertErr.ignore = true;
        insertErr.table = new VarTable(IOStatementBuilder.transerr);
        insertErr.cols = [
            { col: 'appID', val: varAppID },
            { col: fromField, val: new ExpVar(fromVar) },
        ];
        return insertErr;
    }

    transErrorAppend(varAppID: ExpVal, fromField: string, fromVar: string) {
        const setAppend = this.factory.createSet();
        setAppend.isAtVar = true;
        setAppend.equ(transErr, new ExpFunc(
            'JSON_ARRAY_APPEND'
            , new ExpAtVar(transErr), new ExpStr('$')
            , new ExpFunc(
                'JSON_OBJECT',
                new ExpStr('appID'), varAppID,
                new ExpStr(fromField), new ExpVar(fromVar)
            )
        ));
        return setAppend;
    }

    transErrTruncate() {
        let truncateTransErr = this.factory.createTruncate();
        truncateTransErr.table = new VarTable(IOStatementBuilder.transerr);
        return truncateTransErr;
    }

    transErrMerge() {
        let insert = this.factory.createInsert();
        let tblTransErr = new VarTable(IOStatementBuilder.transerr);
        insert.table = tblTransErr;
        const cols = insert.cols = [
            { col: 'appID', val: undefined },
            { col: 'atom', val: undefined },
            { col: 'no', val: undefined },
        ];
        let select = this.factory.createSelect();
        insert.select = select;
        let jsonColumns: JsonTableColumn[] = [
            { field: bigIntField('appID'), path: `$.appID` },
            { field: bigIntField('atom'), path: `$.atom` },
            { field: charField('no', 100), path: `$.no` },
        ];
        let jsonTable = new FromJsonTable('a', new ExpAtVar(transErr), `$[*]`, jsonColumns);
        cols.forEach(v => select.col(v.col));
        select.from(jsonTable);
        select.lock = LockType.none;
        return insert;
    }

    transErrCount() {
        let tblTransErr = new VarTable(IOStatementBuilder.transerr, a);
        let selectTransErrCount = this.factory.createSelect();
        selectTransErrCount.from(tblTransErr);
        selectTransErrCount.column(
            new ExpFunc(this.factory.func_count, new ExpStar()),
        );
        selectTransErrCount.limit(ExpNum.num1);
        return selectTransErrCount;
    }

    transSelect() {
        let tblTransErr = new VarTable(IOStatementBuilder.transerr, a);
        let selectTranErr = this.factory.createSelect();
        selectTranErr.from(tblTransErr)
            .join(JoinType.join, new EntityTable(EnumSysTable.duo, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('appID', a)));
        selectTranErr.column(
            new ExpFunc('JSON_ARRAYAGG',
                new ExpFunc('JSON_OBJECT',
                    new ExpStr('siteAtomApp'), new ExpField('i', b),
                    new ExpStr('ID'), new ExpField('x', b),
                    new ExpStr('atom'), new ExpField('atom', a),
                    new ExpStr('no'), new ExpField('no', a),
                )
            ),
            'v'
        );
        return selectTranErr;
    }

    insertIOError(inOut: 0 | 1) {
        let select = this.factory.createSelect();
        select.from(new EntityTable(EnumSysTable.IOError, false));
        select.col('id');
        select.where(new ExpEQ(new ExpField('id'), new ExpVar(queueId)));

        let selectTranErr = this.transSelect();

        let iff = this.factory.createIf();
        iff.cmp = new ExpExists(select);
        let update = this.factory.createUpdate();
        iff.then(update);
        update.table = new EntityTable(EnumSysTable.IOError, false);
        update.cols = [
            { col: 'result', val: new ExpSelect(selectTranErr) },
            { col: 'times', val: new ExpAdd(new ExpField('times'), ExpNum.num1) },
        ];
        update.where = new ExpEQ(new ExpField('id'), new ExpVar(queueId));

        let insertIOError = this.factory.createInsert();
        iff.else(insertIOError);
        insertIOError.table = new EntityTable(EnumSysTable.IOError, false);
        insertIOError.cols = [
            { col: 'id', val: new ExpVar(queueId) },
            { col: 'siteAtomApp', val: new ExpVar(siteAtomApp) },
            { col: 'appIO', val: new ExpVar(ioAppIO) },
            { col: 'result', val: new ExpSelect(selectTranErr) },
            { col: 'inout', val: new ExpNum(inOut) },
        ];
        return [insertIOError];
    }
}
