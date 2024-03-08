import { EnumSysTable, Field, IOAppID, JoinType, bigIntField, charField } from "../../../il";
import { ExpAnd, ExpEQ, ExpField, ExpIsNotNull, ExpIsNull, ExpNum, ExpVar, Procedure } from "../../sql";
import { Factory } from "../../sql/factory";
import { LockType } from "../../sql/select";
import { EntityTable } from "../../sql/statementWithFrom";
import { IOStatementBuilder } from "./IOStatementBuilder";

const a = 'a', b = 'b', c = 'c';

abstract class FuncUniqueTo {
    static keyId = '$key';        // In Out other site ID
    static atomPhraseId = '$atomPhraseId';
    protected readonly factory: Factory;
    protected readonly func: Procedure;
    protected readonly ioAppID: IOAppID;
    protected readonly param = 'param';
    protected abstract get fromName(): string;
    protected abstract get toName(): string;
    protected abstract fromField(): Field;
    protected abstract toField(): Field;
    constructor(factory: Factory, func: Procedure, ioAppID: IOAppID) {
        this.factory = factory;
        this.func = func;
        this.ioAppID = ioAppID;
    }

    build() {
        const { parameters, statements } = this.func;
        parameters.push(
            bigIntField(FuncUniqueTo.keyId),
            this.fromField(),
        );
        let declare = this.factory.createDeclare();
        statements.push(declare);

        declare.vars(this.toField());
        let ifParamNotNull = this.factory.createIf();
        statements.push(ifParamNotNull);
        ifParamNotNull.cmp = new ExpIsNotNull(new ExpVar(this.param));
        let select = this.factory.createSelect();
        ifParamNotNull.then(select);
        select.toVar = true;
        select.lock = LockType.none;
        select.col(this.toName, this.toName, a);
        select.from(new EntityTable(EnumSysTable.atomUnique, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('i', a)));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('base', b), new ExpNum(this.ioAppID.unique.id)),
            new ExpEQ(new ExpField('ext', b), new ExpVar(FuncUniqueTo.keyId)),
            new ExpEQ(new ExpField(this.fromName), new ExpVar(this.param)),
        ));
        let iff = this.factory.createIf();
        ifParamNotNull.then(iff);
        iff.cmp = new ExpIsNull(new ExpVar(this.toName));
        let ioStatementBuilder = new IOStatementBuilder(this.factory);
        const appendErr = ioStatementBuilder.transErrorAppend(new ExpNum(this.ioAppID.id), this.fromName, this.param);
        iff.then(appendErr);
        let ret = this.factory.createReturn();
        statements.push(ret);
        ret.returnVar = this.toName;
    }
}
export class FuncUniqueFromNo extends FuncUniqueTo {
    protected fromName = 'x';
    protected toName = 'atom';
    protected fromField(): Field { return charField(this.param, 100); }
    protected toField(): Field { return bigIntField(this.toName); }
}
export class FuncUniqueToNo extends FuncUniqueTo {
    protected fromName = 'atom';
    protected toName = 'x';
    protected fromField(): Field { return bigIntField(this.param); }
    protected toField(): Field { return charField(this.toName, 100); }
}

abstract class FuncTo {
    static appID = 'appID';
    protected readonly param = 'param';
    protected readonly factory: Factory;
    protected readonly func: Procedure;
    constructor(factory: Factory, func: Procedure) {
        this.factory = factory;
        this.func = func;
    }

    protected abstract get fromName(): string;
    protected abstract get toName(): string;
    protected abstract fromField(): Field;
    protected abstract toField(): Field;

    build() {
        const { parameters, statements } = this.func;
        parameters.push(
            bigIntField(FuncTo.appID),             // IOApp.ID
            this.fromField(),
        );
        let declare = this.factory.createDeclare();
        statements.push(declare);
        declare.vars(this.toField());
        let ifParamNotNull = this.factory.createIf();
        statements.push(ifParamNotNull);
        ifParamNotNull.cmp = new ExpIsNotNull(new ExpVar(this.param));
        let select = this.factory.createSelect();
        ifParamNotNull.then(select);
        select.toVar = true;
        select.lock = LockType.none;
        select.col(this.toName, this.toName);
        select.from(new EntityTable(EnumSysTable.IOAppAtom, false));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('appID'), new ExpVar(FuncTo.appID)),
            new ExpEQ(new ExpField(this.fromName), new ExpVar(this.param)),
        ));
        let iff = this.factory.createIf();
        ifParamNotNull.then(iff);
        iff.cmp = new ExpIsNull(new ExpVar(this.toName));
        let ioStatementBuilder = new IOStatementBuilder(this.factory);
        const insertErr = ioStatementBuilder.transErrorInsert(new ExpVar('appID'), this.fromName, this.param);
        iff.then(insertErr);
        let ret = this.factory.createReturn();
        statements.push(ret);
        ret.returnVar = this.toName;
    }
}
export class FuncNoToAtom extends FuncTo {
    protected fromName = 'no';
    protected toName = 'atom';
    protected fromField(): Field { return charField(this.param, 100); }
    protected toField(): Field { return bigIntField(this.toName); }
}
export class FuncAtomToNo extends FuncTo {
    protected fromName = 'atom';
    protected toName = 'no';
    protected fromField(): Field { return bigIntField(this.param); }
    protected toField(): Field { return charField(this.toName, 100); }
}
