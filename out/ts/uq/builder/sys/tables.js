"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SysTables = void 0;
const il = require("../../il");
const il_1 = require("../../il");
class SysTables {
    constructor(context) {
        this.context = context;
    }
    table(name) {
        let t = this.context.createTable(name);
        this.context.sysObjs.tables.push(t);
        return t;
    }
    coreTable(name) {
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
    procTable(t) {
        t.hasUnit = false;
        let name = il.charField('name', 200);
        let proc = il.textField('proc');
        let changed = il.tinyIntField('changed');
        t.fields = [name, proc, changed];
        t.keys = [name];
    }
    unitTable(t) {
        t.hasUnit = false;
        let unit = il.intField('unit');
        let syncId = il.bigIntField('syncId'); // bus queue max id
        let syncId1 = il.bigIntField('syncId1'); // bus queue defer 1 max id
        let start = il.bigIntField('start'); // bus queue start id from unitx message queue
        let start1 = il.bigIntField('start1'); // bus queue start id from unitx message queue for defer 1
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
            unit,
            syncId, syncId1,
            start, start1,
            timeZone, bizMonth, bizDate,
            admin
            // to be removed. not used anymore
            ,
            flag, modifyQueueMax
        ];
        t.keys = [unit];
    }
    IDSectionTable(t) {
        t.hasUnit = false;
        let section = il.bigIntField('section');
        t.fields = [section];
        t.keys = [section];
    }
    IDTable(t) {
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
    IDLocalTable(t) {
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
    IDMinuteTable(t) {
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
    IDUTable(t) {
        // 这是整个uq唯一需要unit字段的地方。
        // 如果uq是unit相关的，所有的查询，都跟这个表join，来确保不会获取其它unit的数据
        t.hasUnit = false; // this.context.hasUnit;
        let id = (0, il_1.bigIntField)('id');
        let entity = (0, il_1.smallIntField)('entity');
        t.fields = [id, entity, (0, il_1.timeStampField)('stamp')];
        t.keys = [id];
        if (this.context.hasUnit === true) {
            let unitField = (0, il_1.intField)('unit');
            t.fields.push(unitField);
            let index = new il_1.Index('unit_id', true);
            index.fields.push(unitField, id);
            t.indexes.push(index);
        }
    }
    IDUUTable(t) {
        // 应该不跟$unit绑定。但是需要有unit来指定所有者unit
        t.hasUnit = false; // this.context.hasUnit;
        let id = (0, il_1.bigIntField)('id');
        let uuid = (0, il_1.binaryField)('uuid', 16);
        t.fields = [id, uuid];
        t.keys = [id];
        let uuidIndex = new il_1.Index('uuid', true);
        uuidIndex.fields.push(uuid);
        t.indexes = [uuidIndex];
    }
    IDUOwner(t) {
        // 应该不跟$unit绑定。但是需要有unit来指定所有者unit
        t.hasUnit = false; // this.context.hasUnit;
        let id = (0, il_1.bigIntField)('id');
        let owner = (0, il_1.bigIntField)('owner');
        t.fields = [id, owner];
        t.keys = [id];
    }
    textIdTable(t) {
        t.hasUnit = false;
        let key = il.intField('id');
        key.autoInc = true;
        t.autoIncId = key;
        // 还是需要区分大小写。
        // 能够保存大小写区分的内容。如果不需要区分的话，保存text前，先转换
        let text = il.charField('text', 100, true);
        t.fields = [key, text];
        t.keys = [key];
        let textIndex = new il_1.Index('text', true);
        textIndex.fields = [text];
        t.indexes = [textIndex];
    }
    textLocalTable(t) {
        t.hasUnit = false;
        let id = il.intField('id');
        let local = il.tinyIntField('local');
        let text = il.charField('text', 100, true);
        t.fields = [id, local, text];
        t.keys = [id, local];
    }
    settingTable(t) {
        let name = il.charField('name', 50);
        name.nullable = false;
        let value = il.charField('value', 1000);
        let big = il.bigIntField('big');
        let int = il.intField('int');
        let stamp = (0, il_1.timeStampField)('stamp');
        stamp.defaultValue = [il_1.defaultStampOnUpdate];
        t.fields = [name, value, big, int, stamp];
        t.keys = [name];
    }
    noTable(t) {
        let sheet = il.intField('sheet');
        sheet.nullable = false;
        let date = il.dateField('date');
        let no = il.intField('no');
        t.fields = [sheet, date, no];
        t.keys = [sheet];
    }
    adminTable(t) {
        // role: 1=系统管理员，可以多个；2=业务管理员，管理角色，不能更改系统管理员
        // role = -1: 暂停系统管理员，24小时内，可以自己恢复。超过24小时，不可以自己恢复
        // 也许以后需要其它的角色
        // 这个管理员只能通过admins来设置
        let id = (0, il_1.idField)('id', 'big');
        let role = (0, il_1.tinyIntField)('role');
        role.defaultValue = 0;
        let operator = (0, il_1.idField)('operator', 'big');
        let create = (0, il_1.timeStampField)('create');
        let update = (0, il_1.timeStampField)('update');
        let assigned = (0, il_1.charField)('assigned', 100);
        update.defaultValue = il_1.defaultStampOnUpdate;
        t.fields = [id, role, operator, assigned, create, update];
        t.keys = [id];
    }
    sheetToTable(t) {
        let to = il.bigIntField('to');
        let sheet = il.bigIntField('sheet');
        t.fields = [to, sheet];
        t.keys = [to, sheet];
        let sheetIndex = new il.Index(sheet.name, true);
        sheetIndex.fields.push(sheet, to);
        t.indexes.push(sheetIndex);
    }
    sheetDetailTable(t) {
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
    archiveTable(t) {
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
        let state = il.smallIntField;
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
    flowTable(t) {
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
    constStrTable(t) {
        t.hasUnit = false;
        let id = (0, il_1.intField)('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;
        let name = new il.Field;
        name.name = 'name';
        let dt = name.dataType = new il.Char;
        dt.size = 50;
        let value = (0, il_1.intField)('value');
        t.fields = [id, name, value];
        t.keys = [id];
        let nameIndex = new il.Index(name.name, true);
        nameIndex.fields.push(name);
        t.indexes.push(nameIndex);
    }
    phraseTable(t) {
        t.hasUnit = false;
        let id = (0, il_1.bigIntField)('id');
        id.nullable = false;
        let name = new il.Field;
        name.name = 'name';
        let dt = name.dataType = new il.Char;
        dt.size = 200;
        let valid = (0, il_1.tinyIntField)('valid');
        valid.defaultValue = 1;
        let caption = (0, il_1.charField)('caption', 100);
        let base = (0, il_1.bigIntField)('base');
        base.defaultValue = 0;
        let owner = (0, il_1.bigIntField)('owner');
        owner.defaultValue = 0;
        let type = (0, il_1.tinyIntField)('type'); // prop, assign, permit, or ...
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
    ixPhraseTable(t) {
        t.hasUnit = false;
        let i = (0, il_1.bigIntField)('i');
        i.nullable = false;
        let x = (0, il_1.bigIntField)('x');
        x.nullable = false;
        let type = (0, il_1.tinyIntField)('type');
        t.fields = [i, x, type];
        t.keys = [i, x];
    }
    entityTable(t) {
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
        updateTime.defaultValue = [il_1.defaultStampOnUpdate];
        t.fields = [id, name, type, version, schema, run, date, source, from, _private, valid, open, tuidVid, updateTime];
        t.keys = [id];
        let nameIndex = new il.Index(name.name, true);
        nameIndex.fields.push(name);
        t.indexes.push(nameIndex);
    }
    versionTable(t) {
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
        source.dataType.size = 'medium';
        t.fields = [entity, date, version, schema, run, source];
        t.keys = [entity, date];
    }
    importDataSourceEntity(t) {
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
    importDataMap(t) {
        let sourceEntity = il.intField('source_entity');
        let no = il.charField('no', 50);
        let id = il.bigIntField('id');
        t.fields = [sourceEntity, no, id];
        t.keys = [sourceEntity, no];
    }
    fromNew(t) {
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
    fromNewBad(t) {
        let id = il.bigIntField('id');
        id.nullable = false;
        let entity = il.intField('entity');
        let key = il.charField('key', 100);
        let createTime = il.timeStampField('create_time');
        t.fields = [id, entity, key, createTime];
        t.keys = [id];
    }
    syncFrom(t) {
        let entity = il.intField('entity');
        let modifyMax = il.bigIntField('modifyMax');
        t.fields = [entity, modifyMax];
        t.keys = [entity];
    }
    mapPullTable(t) {
        let entity = il.intField('entity');
        let keys = il.charField('keys', 50);
        let keyCount = il.tinyIntField('keyCount');
        t.fields = [entity, keys, keyCount];
        t.keys = [entity, keys];
    }
    queueOutTable(t) {
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;
        let createTime = il.timeStampField('create_time');
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [il_1.defaultStampOnUpdate];
        let tries = il.intField('tries');
        tries.defaultValue = '0';
        let defer = il.tinyIntField('defer');
        defer.defaultValue = 1;
        t.fields = [
            id,
            il.bigIntField('to'),
            (0, il_1.charField)('action', 20),
            (0, il_1.charField)('subject', 200),
            (0, il_1.textField)('content'),
            tries,
            defer,
            il.intField('stamp'),
            createTime,
            updateTime,
        ];
        t.keys = [id];
        let deferIndex = new il_1.Index('defer_id', true);
        deferIndex.fields.push(defer, id);
        t.indexes.push(deferIndex);
    }
    queueOutDoneTable(t) {
        let id = il.bigIntField('id');
        id.nullable = false;
        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');
        t.fields = [
            id,
            il.bigIntField('to'),
            (0, il_1.charField)('action', 20),
            (0, il_1.charField)('subject', 200),
            il.textField('content'),
            il.intField('stamp'),
            createTime,
            endTime,
        ];
        t.keys = [id];
    }
    queueOutBadTable(t) {
        let id = il.bigIntField('id');
        id.nullable = false;
        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');
        t.fields = [
            id,
            il.bigIntField('to'),
            (0, il_1.charField)('action', 20),
            (0, il_1.charField)('subject', 200),
            il.textField('content'),
            il.intField('stamp'),
            createTime,
            endTime,
        ];
        t.keys = [id];
    }
    queueInTable(t) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;
        let createTime = il.timeStampField('create_time');
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [il_1.defaultStampOnUpdate];
        let tries = (0, il_1.tinyIntField)('tries');
        tries.defaultValue = 0;
        let version = (0, il_1.intField)('version');
        version.defaultValue = 0;
        let defer = il.tinyIntField('defer');
        defer.defaultValue = 11;
        t.fields = [
            id,
            (0, il_1.intField)('unit'),
            (0, il_1.bigIntField)('to'),
            (0, il_1.textField)('data'),
            version,
            defer,
            (0, il_1.intField)('stamp'),
            createTime,
            (0, il_1.intField)('bus_text_id'),
            (0, il_1.intField)('face_text_id'),
            (0, il_1.bigIntField)('msg_unitx_id'),
            tries,
            updateTime,
            // to be removed
            (0, il_1.charField)('bus', 100),
            (0, il_1.charField)('faceName', 50),
        ];
        t.keys = [id];
        //let deferIndex = new Index('defer_id', true);
        //deferIndex.fields.push(defer, id);
        //t.indexes.push(deferIndex);
    }
    queueInActTable(t) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [il_1.defaultStampOnUpdate];
        let tries = (0, il_1.tinyIntField)('tries');
        tries.defaultValue = 0;
        t.fields = [
            id,
            tries,
            updateTime,
        ];
        t.keys = [id];
    }
    queueInDoneTable(t) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;
        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');
        let orgVersion = (0, il_1.intField)('org_version');
        orgVersion.defaultValue = 0;
        let version = (0, il_1.intField)('version');
        version.defaultValue = 0;
        t.fields = [
            id,
            (0, il_1.intField)('unit'),
            il.bigIntField('to'),
            (0, il_1.charField)('bus', 100),
            (0, il_1.charField)('faceName', 50),
            (0, il_1.textField)('data'),
            version,
            orgVersion,
            il.intField('stamp'),
            createTime,
            endTime,
        ];
        t.keys = [id];
    }
    queueInBadTable(t) {
        t.hasUnit = false;
        let id = il.bigIntField('id');
        id.autoInc = true;
        id.nullable = false;
        t.autoIncId = id;
        let createTime = il.timeStampField('create_time');
        let endTime = il.timeStampField('end_time');
        let orgVersion = (0, il_1.intField)('org_version');
        orgVersion.defaultValue = 0;
        let version = (0, il_1.intField)('version');
        version.defaultValue = 0;
        t.fields = [
            id,
            (0, il_1.intField)('unit'),
            il.bigIntField('to'),
            (0, il_1.charField)('bus', 100),
            (0, il_1.charField)('faceName', 50),
            (0, il_1.textField)('data'),
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
    queueDeferTable(t) {
        t.hasUnit = false;
        let defer = (0, il_1.tinyIntField)('defer');
        let id = il.bigIntField('id');
        let stamp = il.timeStampField('stamp');
        t.fields = [defer, id, stamp];
        t.keys = [defer, id];
        let idIndex = new il_1.Index('id_defer', true);
        idIndex.fields.push(id, defer);
        t.indexes.push(idIndex);
    }
    queueModifyTable(t) {
        let id = il.bigIntField('id');
        id.autoInc = true;
        t.autoIncId = id;
        let entity = il.intField('entity');
        let key = il.charField('key', 100);
        let updateTime = il.timeStampField('update_time');
        updateTime.defaultValue = [il_1.defaultStampOnUpdate];
        t.fields = [entity, id, key, updateTime];
        t.keys = [entity, id];
    }
    actQueueTable(t) {
        // 不同unit的schedule，有不同的queue
        // 所以单独有一个unit字段，而不是系统的$unit
        t.hasUnit = false;
        let entity = (0, il_1.intField)('entity');
        let execTime = (0, il_1.timeStampField)('exec_time');
        let paramUnit = (0, il_1.intField)('unit');
        let paramUser = (0, il_1.intField)('user');
        let param = (0, il_1.textField)('param');
        let repeat = (0, il_1.smallIntField)('repeat'); // 运行一次，减一 重复次数， -1：不断重复
        let interval = (0, il_1.intField)('interval'); // 时间间隔，按秒计
        let running = (0, il_1.tinyIntField)('running'); // 时间间隔，按秒计
        running.defaultValue = 0;
        t.fields = [entity, execTime, paramUnit, paramUser, param, repeat, interval, running];
        t.keys = [entity, paramUnit];
        let index = new il_1.Index('exec_time');
        t.indexes.push(index);
        index.fields.push(execTime);
    }
    queueTable(t) {
        let { hasUnit } = this.context;
        t.hasUnit = hasUnit;
        let queue = (0, il_1.intField)('queue');
        let ix = (0, il_1.bigIntField)('ix');
        ix.defaultValue = 0;
        let value = (0, il_1.bigIntField)('value');
        let stamp = (0, il_1.timeStampField)('stamp');
        t.keys = [queue, ix, value];
        t.fields = [queue, ix, value, stamp];
    }
    queueDoneTable(t) {
        let { hasUnit } = this.context;
        t.hasUnit = hasUnit;
        let queue = (0, il_1.intField)('queue');
        let ix = (0, il_1.bigIntField)('ix');
        ix.defaultValue = 0;
        let value = (0, il_1.bigIntField)('value');
        let count = (0, il_1.smallIntField)('count'); // if count<0, can be done again. new count = (-count + 1)
        count.defaultValue = 1;
        let createStamp = (0, il_1.timeStampField)('create');
        let doneStamp = (0, il_1.timeStampField)('done');
        doneStamp.defaultValue = [il_1.defaultStampOnUpdate];
        t.keys = [queue, ix, value];
        t.fields = [queue, ix, value, count, createStamp, doneStamp];
    }
}
exports.SysTables = SysTables;
//# sourceMappingURL=tables.js.map