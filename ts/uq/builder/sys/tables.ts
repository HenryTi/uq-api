import { DbContext } from '../dbContext';
import * as sql from '../sql';
import * as il from '../../il';
import { textField, intField, charField, tinyIntField, Index, Text, defaultStampOnUpdate, timeStampField, smallIntField, idField, bigIntField, binaryField } from '../../il';

export class SysTables {
    protected context: DbContext;
    constructor(context: DbContext) {
        this.context = context;
    }

    private table(name: string): sql.Table {
        let t = this.context.createTable(name);
        this.context.sysObjs.tables.push(t);
        return t;
    }

    private coreTable(name: string): sql.Table {
        let t = this.context.createTable(name);
        this.context.coreObjs.tables.push(t);
        return t;
    }

    build() {
        //this.procTable(this.coreTable('$proc')); // 系统创建的时候，自动创建这个表
        this.settingTable(this.coreTable(il.EnumSysTable.setting));
        this.constStrTable(this.coreTable(il.EnumSysTable.const));
        this.phraseTable(this.coreTable(il.EnumSysTable.phrase));
        // this.ixPhraseTable(this.coreTable(il.EnumSysTable.ixPhrase));
        this.entityTable(this.coreTable(il.EnumSysTable.entity));
        this.versionTable(this.coreTable(il.EnumSysTable.version));
        this.noTable(this.coreTable('$no'));

        this.adminTable(this.table(il.EnumSysTable.admin));

        this.queueOutTable(this.table(il.EnumSysTable.messageQueue));
        this.queueOutDoneTable(this.table(il.EnumSysTable.messageQueueEnd));
        this.queueOutBadTable(this.table(il.EnumSysTable.messageQueueFailed));
        this.queueInTable(this.table('$queue_in'));
        // this.queueInActTable(this.table('$queue_in_act'));      // to be removed actions in queue in
        // this.queueInDoneTable(this.table('$queue_in_done'));    // to be removed
        // this.queueInBadTable(this.table('$queue_in_bad'));      // to be removed
        this.queueModifyTable(this.table('$modify_queue'));
        this.queueDeferTable(this.table('$queue_defer'));

        this.fromNew(this.table('$from_new'));
        this.fromNewBad(this.table(il.EnumSysTable.fromNewBad));
        this.syncFrom(this.table('$sync_from'));
        this.mapPullTable(this.table('$map_pull'));
        this.importDataSourceEntity(this.table(il.EnumSysTable.importDataSourceEntity));
        this.importDataMap(this.table(il.EnumSysTable.importDataMap));

        this.sheetToTable(this.table(il.EnumSysTable.sheetTo));
        this.sheetDetailTable(this.table(il.EnumSysTable.sheetDetail));
        this.flowTable(this.table(il.EnumSysTable.flow));
        this.archiveTable(this.table(il.EnumSysTable.archive));
        this.flowTable(this.table(il.EnumSysTable.archiveFlow));

        this.unitTable(this.table(il.EnumSysTable.unit));
        this.IDSectionTable(this.table('$id_section'));
        this.IDTable(this.table('$id'));
        this.IDLocalTable(this.table('$id_local'));
        this.IDMinuteTable(this.table('$id_minute')); // unique minute id table
        this.IDUTable(this.table(il.EnumSysTable.id_u));
        this.IDUUTable(this.table(il.EnumSysTable.id_uu));
        this.textIdTable(this.table('$text_id'));
        this.textLocalTable(this.table('$text_local')); // $text_id 对应语言翻译

        this.actQueueTable(this.table('$queue_act'));
        this.queueTable(this.table('$queue'));
        this.queueDoneTable(this.table('$queue$'));
    }

    private procTable(t: sql.Table) {
        t.hasUnit = false;
        let name = il.charField('name', 200);
        let proc = il.textField('proc');
        let changed = il.tinyIntField('changed');
        t.fields = [name, proc, changed];
        t.keys = [name];
    }

    private unitTable(t: sql.Table) {
        t.hasUnit = false;
        let unit = il.intField('unit');
        let syncId = il.bigIntField('syncId');  // bus queue max id
        let syncId1 = il.bigIntField('syncId1');  // bus queue defer 1 max id
        let start = il.bigIntField('start');  // bus queue start id from unitx message queue
        let start1 = il.bigIntField('start1');  // bus queue start id from unitx message queue for defer 1
        let timeZone = il.tinyIntField('timezone');
        timeZone.defaultValue = 8;
        let bizMonth = il.tinyIntField('bizmonth');
        bizMonth.defaultValue = 1;
        let bizDate = il.tinyIntField('bizdate');
        bizDate.defaultValue = 1;
        // syncIdLocal, 
        let admin = il.bigIntField('admin');
        let modifyQueueMax = il.bigIntField('modifyQueueMax');
        let flag = il.tinyIntField('flag');
        t.fields = [
            unit
            , syncId, syncId1
            , start, start1
            , timeZone, bizMonth, bizDate
            , admin
            // to be removed. not used anymore
            , flag, modifyQueueMax
        ];
        t.keys = [unit]
    }

    private IDSectionTable(t: sql.Table) {
        t.hasUnit = false;
        let section = il.bigIntField('section');
        t.fields = [section];
        t.keys = [section];
    }

    private IDTable(t: sql.Table) {
        // 应该不跟$unit绑定。但是需要有unit来指定所有者unit
        t.hasUnit = false; // this.context.hasUnit;
        let id = il.bigIntField('id');
        let entity = il.smallIntField('entity');
        // name 字段内容，用\n分开多个文字字段。直接可以做like查询。
        // 存储过程参数，\t分隔字段，\a分隔行
        // 第一字段：name
        // 第二字段：no
        // 第三字段：discription
        t.fields = [id, entity, il.charField('name', 100)];
        if (this.context.hasUnit === true) {
            t.fields.push(il.intField('unit'));
        }
        t.keys = [id];
    }

    private IDLocalTable(t: sql.Table) {
        // 应该不跟$unit绑定。但是需要有unit来指定所有者unit
        t.hasUnit = false;
        let id = il.bigIntField('id');
        let entity = il.smallIntField('entity');
        let stamp = il.timeStampField('stamp');
        t.fields = [id, entity, il.charField('name', 100), stamp];
        t.keys = [id];
        if (this.context.hasUnit === true) {
            t.fields.push(il.intField('unit'));
        }
    }

    private IDMinuteTable(t: sql.Table) {
        // 应该不跟$unit绑定。但是需要有unit来指定所有者unit
        t.hasUnit = false;
        let id = il.bigIntField('id');
        let entity = il.smallIntField('entity');
        let stamp = il.timeStampField('stamp');
        t.fields = [id, entity, stamp];
        t.keys = [id];
        if (this.context.hasUnit === true) {
            t.fields.push(il.intField('unit'));
        }
    }

    private IDUTable(t: sql.Table) {
        // 这是整个uq唯一需要unit字段的地方。
        // 如果uq是unit相关的，所有的查询，都跟这个表join，来确保不会获取其它unit的数据
        t.hasUnit = false; // this.context.hasUnit;
        let id = bigIntField('id');
        let entity = smallIntField('entity');
        t.fields = [id, entity, timeStampField('stamp')];
        t.keys = [id];
        if (this.context.hasUnit === true) {
            let unitField = intField('unit');
            t.fields.push(unitField);
            let index = new Index('unit_id', true);
            index.fields.push(unitField, id);
            t.indexes.push(index);
        }
    }

    private IDUUTable(t: sql.Table) {
        // 应该不跟$unit绑定。但是需要有unit来指定所有者unit
        t.hasUnit = false; // this.context.hasUnit;
        let id = bigIntField('id');
        let uuid = binaryField('uuid', 16);
        t.fields = [id, uuid];
        t.keys = [id];
        let uuidIndex = new Index('uuid', true);
        uuidIndex.fields.push(uuid);
        t.indexes = [uuidIndex];
    }

    private IDUOwner(t: sql.Table) {
        // 应该不跟$unit绑定。但是需要有unit来指定所有者unit
        t.hasUnit = false; // this.context.hasUnit;
        let id = bigIntField('id');
        let owner = bigIntField('owner');
        t.fields = [id, owner];
        t.keys = [id];
    }

    private textIdTable(t: sql.Table) {
        t.hasUnit = false;
        let key = il.intField('id');
        key.autoInc = true;
        t.autoIncId = key;
        // 还是需要区分大小写。
        // 能够保存大小写区分的内容。如果不需要区分的话，保存text前，先转换
        let text = il.charField('text', 100, true);
        t.fields = [key, text];
        t.keys = [key];
        let textIndex = new Index('text', true);
        textIndex.fields = [text];
        t.indexes = [textIndex];
    }

    private textLocalTable(t: sql.Table) {
        t.hasUnit = false;
        let id = il.intField('id');
        let local = il.tinyIntField('local');
        let text = il.charField('text', 100, true);
        t.fields = [id, local, text];
        t.keys = [id, local];
    }

    private settingTable(t: sql.Table) {
        let name = il.charField('name', 50);
        name.nullable = false;
        let value = il.charField('value', 1000);
        let big = il.bigIntField('big');
        let int = il.intField('int');
        let stamp = timeStampField('stamp');
        stamp.defaultValue = [defaultStampOnUpdate];
        t.fields = [name, value, big, int, stamp];
        t.keys = [name];
    }

    private noTable(t: sql.Table) {
        let sheet = il.intField('sheet');
        sheet.nullable = false;
        let date = il.dateField('date');
        let no = il.intField('no');
        t.fields = [sheet, date, no]
        t.keys = [sheet];
    }

    private adminTable(t: sql.Table) {
        // role: 1=系统管理员，可以多个；2=业务管理员，管理角色，不能更改系统管理员
        // role = -1: 暂停系统管理员，24小时内，可以自己恢复。超过24小时，不可以自己恢复
        // 也许以后需要其它的角色
        // 这个管理员只能通过admins来设置
        let id = idField('id', 'big');
        let role = tinyIntField('role');
        role.defaultValue = 0;
        let operator = idField('operator', 'big');
        let create = timeStampField('create');
        let update = timeStampField('update');
        let assigned = charField('assigned', 100);
        update.defaultValue = defaultStampOnUpdate;
        t.fields = [id, role, operator, assigned, create, update];
        t.keys = [id];
    }

    private sheetToTable(t: sql.Table) {
        let to = il.bigIntField('to');
        let sheet = il.bigIntField('sheet');
        t.fields = [to, sheet];
        t.keys = [to, sheet];
        let sheetIndex = new il.Index(sheet.name, true);
        sheetIndex.fields.push(sheet, to);
        t.indexes.push(sheetIndex);
    }

    private sheetDetailTable(t: sql.Table) {
        t.hasUnit = false;
        let sheet = il.bigIntField('sheet');
        sheet.nullable = false;
        let arr = il.tinyIntField('arr');
        arr.nullable = false;
        let row = il.smallIntField('row');
        row.nullable = false;
        let data = il.textField('data');
        t.fields = [sheet, arr, row, data];
        t.keys = [sheet, arr, row];
    }

    private archiveTable(t: sql.Table) {
        let bigInt = new il.BigInt;
        let id = new il.Field;
        id.name = 'id';
        id.dataType = bigInt;
        id.nullable = false;
        let no = new il.Field;
        no.name = 'no';
        let dt = no.dataType = new il.Char();
        dt.size = 30;
        let data = new il.Field;
        data.name = 'data';
        data.dataType = new il.Text;
        let user = new il.Field;
        user.name = 'user';
        user.dataType = bigInt;
        let date = new il.Field;
        date.name = 'date';
        date.dataType = new il.DateTime;
        let sheet = new il.Field;
        sheet.name = 'sheet';
        sheet.dataType = new il.Int;
        let version = new il.Field;
        version.name = 'version';
        version.dataType = new il.Int;
        let flow = il.smallIntField('flow');
        let state = il.smallIntField
        let discription = new il.Field;
        discription.name = 'discription';
        dt = discription.dataType = new il.Char();
        dt.size = 50;
        t.fields = [id, no, user, date, sheet, version, flow, discription, data];
        t.keys = [id];
        let noIndex = new il.Index(no.name, false);
        noIndex.fields.push(no);
        t.indexes.push(noIndex);
    }

    private flowTable(t: sql.Table) {
        t.hasUnit = false;
        let sheet = il.bigIntField('sheet');
        sheet.nullable = false;
        let date = il.dateTimeField('date');
        date.nullable = false;
        let flow = il.smallIntField('flow');
        flow.nullable = false;
        let preState = il.intField('preState');
        let action = il.intField('action');
        let state = il.intField('state');
        let user = il.bigIntField('user');
        t.fields = [sheet, date, flow, preState, action, state, user];
        t.keys = [sheet, flow];
    }

    private constStrTable(t: sql.Table) {
        t.hasUnit = false;
        let id = intField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;

        let name = new il.Field;
        name.name = 'name';
        let dt = name.dataType = new il.Char;
        dt.size = 50;

        let value = intField('value');
        t.fields = [id, name, value];
        t.keys = [id];
        let nameIndex = new il.Index(name.name, true);
        nameIndex.fields.push(name);
        t.indexes.push(nameIndex);
    }

    private phraseTable(t: sql.Table) {
        t.hasUnit = false;
        let id = bigIntField('id');
        id.nullable = false;
        let name = new il.Field;
        name.name = 'name';
        let dt = name.dataType = new il.Char;
        dt.size = 200;
        let valid = tinyIntField('valid');
        valid.defaultValue = 1;
        let caption = charField('caption', 100);
        let base = bigIntField('base');
        base.defaultValue = 0;
        let owner = bigIntField('owner');
        owner.defaultValue = 0;
        let type = tinyIntField('type');            // prop, assign, permit, or ...
        type.defaultValue = 0;
        t.fields = [id, name, caption, valid, base, owner, type];
        t.keys = [id];
        let nameIndex = new il.Index(name.name, true);
        nameIndex.fields.push(name);
        t.indexes.push(nameIndex);
        let ownerIndex = new il.Index(owner.name, true);
        ownerIndex.fields.push(owner, id);
        t.indexes.push(ownerIndex);
    }

    private ixPhraseTable(t: sql.Table) {
        t.hasUnit = false;
        let i = bigIntField('i');
        i.nullable = false;
        let x = bigIntField('x');
        x.nullable = false;
        let type = tinyIntField('type');
        t.fields = [i, x, type];
        t.keys = [i, x];
    }

    private entityTable(t: sql.Table) {
        t.hasUnit = false;
        let id = il.intField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;

        let name = il.charField('name', 50);
        let type = il.intField('type');
        let version = il.intField('version');
        let schema = il.textField('schema');
        let run = il.textField('run');
        let date = il.dateTimeField('date');
        let source = il.textField('source');
        let from = il.charField('from', 200);
        let _private = il.tinyIntField('private');
        _private.defaultValue = 0;
        let valid = il.tinyIntField('valid');
        valid.defaultValue = 1;
        let open = il.tinyIntField('open');
        open.defaultValue = 0;
        let tuidVid = il.bigIntField('tuidVId');
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [defaultStampOnUpdate];

        t.fields = [id, name, type, version, schema, run, date, source, from, _private, valid, open, tuidVid, updateTime];
        t.keys = [id];
        let nameIndex = new il.Index(name.name, true);
        nameIndex.fields.push(name);
        t.indexes.push(nameIndex);
    }

    private versionTable(t: sql.Table) {
        t.hasUnit = false;
        let entity = il.intField('entity');
        entity.nullable = false;
        let date = il.dateField('date');
        date.nullable = false;
        let version = il.intField('version');
        version.nullable = false;
        let schema = il.textField('schema');
        let run = il.textField('run');
        let source = il.textField('source');
        (source.dataType as Text).size = 'medium';
        t.fields = [entity, date, version, schema, run, source];
        t.keys = [entity, date];
    }

    private importDataSourceEntity(t: sql.Table) {
        let id = il.intField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;

        let source = il.charField('source', 50);
        let entity = il.charField('entity', 100);
        t.fields = [id, source, entity];
        t.keys = [id];
        let sourceEntityIndex = new il.Index(source.name + '_' + entity.name, true);
        sourceEntityIndex.fields.push(source, entity);
        t.indexes.push(sourceEntityIndex);
    }

    private importDataMap(t: sql.Table) {
        let sourceEntity = il.intField('source_entity');
        let no = il.charField('no', 50);
        let id = il.bigIntField('id');
        t.fields = [sourceEntity, no, id];
        t.keys = [sourceEntity, no];
    }

    private fromNew(t: sql.Table) {
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;
        let tries = il.tinyIntField('tries');
        tries.nullable = false;
        tries.defaultValue = 0;
        let entity = il.intField('entity');
        let key = il.charField('key', 100);
        let createTime = il.timeStampField('create_time');
        t.fields = [id, tries, entity, key, createTime];
        t.keys = [id];
    }

    private fromNewBad(t: sql.Table) {
        let id = il.bigIntField('id');
        id.nullable = false;
        let entity = il.intField('entity');
        let key = il.charField('key', 100);
        let createTime = il.timeStampField('create_time');
        t.fields = [id, entity, key, createTime];
        t.keys = [id];
    }

    private syncFrom(t: sql.Table) {
        let entity = il.intField('entity');
        let modifyMax = il.bigIntField('modifyMax');
        t.fields = [entity, modifyMax];
        t.keys = [entity];
    }

    private mapPullTable(t: sql.Table) {
        let entity = il.intField('entity');
        let keys = il.charField('keys', 50);
        let keyCount = il.tinyIntField('keyCount');
        t.fields = [entity, keys, keyCount];
        t.keys = [entity, keys];
    }

    private queueOutTable(t: sql.Table) {
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;

        let createTime = il.timeStampField('create_time');
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [defaultStampOnUpdate];
        let tries = il.intField('tries');
        tries.defaultValue = '0';
        let defer = il.tinyIntField('defer');
        defer.defaultValue = 1;

        t.fields = [
            id,
            il.bigIntField('to'),
            charField('action', 20),
            charField('subject', 200),
            textField('content'),
            tries,
            defer,
            il.intField('stamp'),
            createTime,
            updateTime,
        ];

        t.keys = [id];
        let deferIndex = new Index('defer_id', true);
        deferIndex.fields.push(defer, id);
        t.indexes.push(deferIndex);
    }

    private queueOutDoneTable(t: sql.Table) {
        let id = il.bigIntField('id');
        id.nullable = false;
        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');

        t.fields = [
            id,
            il.bigIntField('to'),
            charField('action', 20),
            charField('subject', 200),
            il.textField('content'),
            il.intField('stamp'),
            createTime,
            endTime,
        ];

        t.keys = [id];
    }

    private queueOutBadTable(t: sql.Table) {
        let id = il.bigIntField('id');
        id.nullable = false;
        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');

        t.fields = [
            id,
            il.bigIntField('to'),
            charField('action', 20),
            charField('subject', 200),
            il.textField('content'),
            il.intField('stamp'),
            createTime,
            endTime,
        ];

        t.keys = [id];
    }
    private queueInTable(t: sql.Table) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;

        let createTime = il.timeStampField('create_time');
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [defaultStampOnUpdate];
        let tries = tinyIntField('tries');
        tries.defaultValue = 0;
        let version = intField('version');
        version.defaultValue = 0;
        let defer = il.tinyIntField('defer');
        defer.defaultValue = 11;
        t.fields = [
            id,
            intField('unit'),
            bigIntField('to'),
            textField('data'),
            version,
            defer,
            intField('stamp'),
            createTime,

            intField('bus_text_id'),
            intField('face_text_id'),
            bigIntField('msg_unitx_id'),
            tries,
            updateTime,

            // to be removed
            charField('bus', 100),
            charField('faceName', 50),
        ];

        t.keys = [id];
        //let deferIndex = new Index('defer_id', true);
        //deferIndex.fields.push(defer, id);
        //t.indexes.push(deferIndex);
    }

    private queueInActTable(t: sql.Table) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [defaultStampOnUpdate];
        let tries = tinyIntField('tries');
        tries.defaultValue = 0;
        t.fields = [
            id,
            tries,
            updateTime,
        ];
        t.keys = [id];
    }

    private queueInDoneTable(t: sql.Table) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;

        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');
        let orgVersion = intField('org_version');
        orgVersion.defaultValue = 0;
        let version = intField('version');
        version.defaultValue = 0;
        t.fields = [
            id,
            intField('unit'),
            il.bigIntField('to'),
            charField('bus', 100),
            charField('faceName', 50),
            textField('data'),
            version,
            orgVersion,
            il.intField('stamp'),
            createTime,
            endTime,
        ];

        t.keys = [id];
    }

    private queueInBadTable(t: sql.Table) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;

        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');
        let orgVersion = intField('org_version');
        orgVersion.defaultValue = 0;
        let version = intField('version');
        version.defaultValue = 0;
        t.fields = [
            id,
            intField('unit'),
            il.bigIntField('to'),
            charField('bus', 100),
            charField('faceName', 50),
            textField('data'),
            version,
            orgVersion,
            il.intField('stamp'),
            createTime,
            endTime,
        ];

        t.keys = [id];
    }

    // 1x: queue in defer 0-9
    // 0x: queue out defer 0-9
    private queueDeferTable(t: sql.Table) {
        t.hasUnit = false;
        let defer = tinyIntField('defer');
        let id = il.bigIntField('id');
        let stamp = il.timeStampField('stamp');
        t.fields = [defer, id, stamp];
        t.keys = [defer, id];
        let idIndex = new Index('id_defer', true);
        idIndex.fields.push(id, defer);
        t.indexes.push(idIndex);
    }

    private queueModifyTable(t: sql.Table) {
        let id = il.bigIntField('id');
        id.autoInc = true;
        t.autoIncId = id;
        let entity = il.intField('entity');
        let key = il.charField('key', 100);
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [defaultStampOnUpdate];
        t.fields = [entity, id, key, updateTime];
        t.keys = [entity, id];
    }

    private actQueueTable(t: sql.Table) {
        // 不同unit的schedule，有不同的queue
        // 所以单独有一个unit字段，而不是系统的$unit
        t.hasUnit = false;
        let entity = intField('entity');
        let execTime = timeStampField('exec_time');
        let paramUnit = intField('unit');
        let paramUser = intField('user');
        let param = textField('param');
        let repeat = smallIntField('repeat');			// 运行一次，减一 重复次数， -1：不断重复
        let interval = intField('interval');			// 时间间隔，按秒计
        let running = tinyIntField('running');			// 时间间隔，按秒计
        running.defaultValue = 0;
        t.fields = [entity, execTime, paramUnit, paramUser, param, repeat, interval, running];
        t.keys = [entity, paramUnit];
        let index = new Index('exec_time');
        t.indexes.push(index);
        index.fields.push(execTime);
    }

    private queueTable(t: sql.Table) {
        let { hasUnit } = this.context;
        t.hasUnit = hasUnit;
        let queue = intField('queue');
        let ix = bigIntField('ix');
        ix.defaultValue = 0;
        let value = bigIntField('value');
        let stamp = timeStampField('stamp');
        t.keys = [queue, ix, value];
        t.fields = [queue, ix, value, stamp];
    }

    private queueDoneTable(t: sql.Table) {
        let { hasUnit } = this.context;
        t.hasUnit = hasUnit;
        let queue = intField('queue');
        let ix = bigIntField('ix');
        ix.defaultValue = 0;
        let value = bigIntField('value');
        let count = smallIntField('count');             // if count<0, can be done again. new count = (-count + 1)
        count.defaultValue = 1;
        let createStamp = timeStampField('create');
        let doneStamp = timeStampField('done');
        doneStamp.defaultValue = [defaultStampOnUpdate];
        t.keys = [queue, ix, value];
        t.fields = [queue, ix, value, count, createStamp, doneStamp];
    }
}
