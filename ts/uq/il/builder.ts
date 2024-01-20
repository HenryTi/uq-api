import * as stat from './statement';
import * as ent from './entity';
import { BEntity, BStatement, BID, BIDX, BIX, BForList, BBiz } from '../builder';
import { Biz } from './Biz';

export interface Builder {
    arr(v: ent.Arr): BEntity<ent.Arr>;
    role(v: ent.Role): BEntity<ent.Role>;
    import(v: ent.Import): BEntity<ent.Import>;
    enm(v: ent.Enum): BEntity<ent.Enum>;
    _const(v: ent.Const): BEntity<ent.Const>;
    dataTypeDefine(v: ent.DataTypeDefine): BEntity<ent.DataTypeDefine>;
    queue(v: ent.Queue): BEntity<ent.Queue>;
    bus(v: ent.Bus): BEntity<ent.Bus>;
    book(v: ent.Book): BEntity<ent.Book>;
    map(v: ent.Map): BEntity<ent.Map>;
    history(v: ent.History): BEntity<ent.History>;
    pending(v: ent.Pending): BEntity<ent.Pending>;
    action(v: ent.Act): BEntity<ent.Act>;
    func(v: ent.Function): BEntity<ent.Function>;
    sysproc(v: ent.SysProc): BEntity<ent.SysProc>;
    proc(v: ent.Proc): BEntity<ent.Proc>;
    query(v: ent.Query): BEntity<ent.Query>;
    tuid(v: ent.Tuid): BEntity<ent.Tuid>;
    ID(v: ent.ID): BID;
    IX(v: ent.IX): BIX;
    IDX(v: ent.IDX): BIDX;
    Biz(v: Biz): BBiz;

    varStatement(v: stat.VarStatement): BStatement;
    tableStatement(v: stat.TableStatement): BStatement;
    textStatement(v: stat.TextStatement): BStatement;
    withIDDelOnId(v: stat.WithStatement): BStatement;
    withIDDelOnKeys(v: stat.WithStatement): BStatement;
    withIDXDel(v: stat.WithStatement): BStatement;
    withIXDel(v: stat.WithStatement): BStatement;
    withIDSetOnId(v: stat.WithStatement): BStatement;
    withIDSetOnKeys(v: stat.WithStatement): BStatement;
    withIDXSet(v: stat.WithStatement): BStatement;
    withIXSet(v: stat.WithStatement): BStatement;
    withTruncate(v: stat.WithStatement): BStatement;

    bizDetailActStatement(v: stat.BizBinActStatement): BStatement;
    bizDetailActSubPend(v: stat.BizBinPendStatement): BStatement;
    bizDetailActSubSubject(v: stat.BizBinTitleStatement): BStatement;

    value(v: stat.ValueStatement): BStatement;
    setStatement(v: stat.SetStatement): BStatement;
    putStatement(v: stat.PutStatement): BStatement;
    fromStatement(v: stat.FromStatement): BStatement;
    fromStatementInPend(v: stat.FromStatementInPend): BStatement;
    settingStatement(v: stat.SettingStatement): BStatement;
    whileStatement(v: stat.While): BStatement;
    ifStatement(v: stat.If): BStatement;
    breakStatement(v: stat.BreakStatement): BStatement;
    continueStatement(v: stat.ContinueStatement): BStatement;
    returnStatement(v: stat.ReturnStatement): BStatement;
    returnStartStatement(): BStatement;
    returnEndStatement(): BStatement;
    procStatement(v: stat.ProcStatement): BStatement;
    foreachArr(v: stat.ForEach, forArr: stat.ForArr): BForList;
    foreachSelect(v: stat.ForEach, forSelect: stat.ForSelect): BForList;
    foreachQueue(v: stat.ForEach, forQueue: stat.ForQueue): BForList;
    selectStatement(v: stat.SelectStatement): BStatement;
    deleteStatement(v: stat.DeleteStatement): BStatement;
    bookWrite(v: stat.BookWrite): BStatement;
    historyWrite(v: stat.HistoryWrite): BStatement;
    tuidWrite(v: stat.TuidWrite): BStatement;
    pendingWrite(v: stat.PendingWrite): BStatement;
    stateTo(v: stat.StateToStatement): BStatement;
    fail(v: stat.FailStatement): BStatement;
    busStatement(v: stat.BusStatement): BStatement;
    sendMsgStatement(v: stat.SendMsgStatement): BStatement;
    sendAppStatement(v: stat.SendAppStatement): BStatement;
    inlineStatement(v: stat.InlineStatement): BStatement;
    schedule(v: stat.ScheduleStatement): BStatement;
    logStatement(v: stat.LogStatement): BStatement;
    execSqlStatement(v: stat.ExecSqlStatement): BStatement;
    roleStatement(v: stat.RoleStatement): BStatement;
    sleepStatement(v: stat.SleepStatement): BStatement;
    transactionStatement(v: stat.TransactionStatement): BStatement;
    pokeStatement(v: stat.PokeStatement): BStatement;
    queueStatement(v: stat.QueueStatement): BStatement;
    useStatement(v: stat.UseStatement): BStatement;
}
