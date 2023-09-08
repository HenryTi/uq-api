"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithStatement = exports.WithActTruncate = exports.WithActDel = exports.WithActSet = exports.WithIX = exports.WithIDX = exports.WithID = void 0;
const parser_1 = require("../../parser");
const statement_1 = require("./statement");
class With {
}
class WithID extends With {
    constructor() {
        super(...arguments);
        this.type = 'id';
    }
    get entity() { return this.ID; }
}
exports.WithID = WithID;
class WithIDX extends With {
    constructor() {
        super(...arguments);
        this.type = 'idx';
    }
    get entity() { return this.IDX; }
}
exports.WithIDX = WithIDX;
class WithIX extends With {
    constructor() {
        super(...arguments);
        this.type = 'ix';
    }
    get entity() { return this.IX; }
}
exports.WithIX = WithIX;
class WithAct {
}
class WithActSet extends WithAct {
    constructor() {
        super(...arguments);
        this.type = 'set';
        this.sets = {};
        this.setsOnNew = {};
    }
}
exports.WithActSet = WithActSet;
class WithActDel extends WithAct {
    constructor() {
        super(...arguments);
        this.type = 'del';
    }
}
exports.WithActDel = WithActDel;
class WithActTruncate extends WithAct {
    constructor() {
        super(...arguments);
        this.type = 'truncate';
    }
}
exports.WithActTruncate = WithActTruncate;
class WithStatement extends statement_1.Statement {
    get type() { return 'with'; }
    db(db) {
        switch (this.act.type) {
            case 'truncate':
                return db.withTruncate(this);
            case 'del':
                switch (this.with.type) {
                    case 'id':
                        if (this.with.idVal === undefined) {
                            return db.withIDDelOnKeys(this);
                        }
                        else {
                            return db.withIDDelOnId(this);
                        }
                    case 'idx': return db.withIDXDel(this);
                    case 'ix': return db.withIXDel(this);
                }
                break;
            case 'set':
                switch (this.with.type) {
                    case 'id':
                        if (this.with.idVal === undefined) {
                            return db.withIDSetOnKeys(this);
                        }
                        else {
                            return db.withIDSetOnId(this);
                        }
                    case 'idx': return db.withIDXSet(this);
                    case 'ix': return db.withIXSet(this);
                }
                break;
        }
    }
    parser(context) { return new parser_1.PWithStatement(this, context); }
}
exports.WithStatement = WithStatement;
//# sourceMappingURL=with.js.map