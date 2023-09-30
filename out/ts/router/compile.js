"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompileRouter = void 0;
const jsonpack = require("jsonpack");
const uq_1 = require("../uq");
const bizSiteBuilder_1 = require("../uq/bizSiteBuilder");
const actionType = 'compile';
function buildCompileRouter(router, rb) {
    router.get('/compile/hello', async (req, res) => {
        res.json({
            ok: true,
            res: {
                route: 'compile',
                sub: 'hello',
            }
        });
    });
    rb.entityPost(router, actionType, '/override', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { source } = body;
        const compile = new CompileSource(runner, source, unit, user, true);
        const ret = await compile.run();
        return ret;
    });
    rb.entityPost(router, actionType, '/append', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { source } = body;
        const compile = new CompileSource(runner, source, unit, user, false);
        const ret = await compile.run();
        return ret;
    });
    rb.entityPost(router, actionType, '/entity', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const { id, code } = body;
        const compile = new CompileEntity(runner, code, unit, user, id);
        const ret = await compile.run();
        return ret;
    });
    rb.entityPost(router, actionType, '/biz', async (unit, user, name, db, urlParams, runner, body, schema, run, net) => {
        const compile = new CompileSource(runner, undefined, unit, user, false);
        const ret = await compile.run();
        return ret;
    });
}
exports.buildCompileRouter = buildCompileRouter;
class Compile {
    constructor(runner, code, site, user) {
        this.msgs = [];
        this.log = (msg) => {
            this.msgs.push(msg);
            return true;
        };
        this.runner = runner;
        this.code = code;
        this.site = site;
        this.user = user;
    }
    setUqRunnerEntityId(uqRunner) { }
    setBizSiteBuilderEntityId(bizSiteBuilder) { return true; }
    async run() {
        try {
            const uqRunner = new uq_1.UqRunner(undefined, this.log);
            this.setUqRunnerEntityId(uqRunner);
            let [objs, props] = await this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
            const { uq } = uqRunner;
            const { biz } = uq;
            const bizSiteBuilder = new bizSiteBuilder_1.BizSiteBuilder(biz, this.runner, this.site, this.user);
            await bizSiteBuilder.loadObjects(objs, props);
            if (this.code) {
                for (let source of bizSiteBuilder.sysEntitySources) {
                    uqRunner.parse(source, '$sys', true);
                }
                uqRunner.parse(this.code, 'upload');
                let isIdNewOk = uqRunner.anchorLatest();
                let isIdNameOk = this.setBizSiteBuilderEntityId(bizSiteBuilder);
                if (isIdNewOk === false || isIdNameOk === false) {
                    return {
                        logs: this.msgs,
                        hasError: true,
                    };
                }
            }
            for (let obj of objs) {
                const { id, phrase, source } = obj;
                if (!source)
                    continue;
                if (this.override === true) {
                    if (uqRunner.isLatest(phrase) === true)
                        continue;
                }
                uqRunner.parse(source, phrase);
            }
            uqRunner.scan();
            if (uqRunner.ok === false) {
                return {
                    logs: this.msgs,
                    hasError: true,
                };
            }
            bizSiteBuilder.setEntitysId();
            await bizSiteBuilder.build(this.log);
            let schemas = bizSiteBuilder.buildSchemas();
            return {
                schemas: jsonpack.pack(schemas.$biz),
                logs: this.msgs,
                hasError: false,
            };
        }
        catch (err) {
            let logs = [err.message];
            let { stack } = err;
            let type = typeof stack;
            switch (type) {
                default:
                    logs.push('typeof err.stack ' + type);
                    break;
                case 'undefined': break;
                case 'object':
                    logs.push(JSON.stringify(stack));
                    break;
                case 'string':
                    logs.push(...stack.split('\n'));
                    break;
            }
            return {
                hasError: true,
                logs,
            };
        }
    }
}
class CompileEntity extends Compile {
    constructor(runner, code, site, user, newEntityId) {
        super(runner, code, site, user);
        this.override = true;
        this.newEntityId = newEntityId;
    }
    setUqRunnerEntityId(uqRunner) {
        uqRunner.setEntityId(this.newEntityId);
    }
    setBizSiteBuilderEntityId(bizSiteBuilder) {
        return bizSiteBuilder.markNewEntityId(this.newEntityId);
    }
}
class CompileSource extends Compile {
    constructor(runner, code, site, user, override) {
        super(runner, code, site, user);
        this.override = override;
    }
}
/*
async function compileEntity(runner: EntityRunner, id: number, code: string, unit: number, user: number) {
}

async function compile(runner: EntityRunner, clientSource: string, override: boolean, unit: number, user: number) {
    const msgs: string[] = [];
    function log(msg: string) {
        msgs.push(msg);
        return true;
    }
    const uqRunner = new UqRunner(undefined, log);
    let [objs, props] = await runner.unitUserTablesFromProc('GetBizObjects', unit, user, 'zh', 'cn');
    const { uq } = uqRunner;
    const { biz } = uq;
    const bizSiteBuilder = new BizSiteBuilder(biz, runner, unit, user);
    await bizSiteBuilder.loadObjects(objs, props);

    if (clientSource) {
        for (let source of bizSiteBuilder.sysEntitySources) {
            uqRunner.parse(source, '$sys', true);
        }

        uqRunner.parse(clientSource, 'upload');
        uqRunner.anchorLatest();
    }
    for (let obj of objs) {
        const { id, phrase, source } = obj;
        if (!source) continue;
        if (override === true) {
            if (uqRunner.isLatest(phrase) === true) continue;
        }
        uqRunner.parse(source, phrase);
        let entity = uqRunner.uq.biz.bizEntities.get(phrase);
        if (entity !== undefined) entity.id = id;
    }
    uqRunner.scan();
    if (uqRunner.ok === false) {
        return {
            logs: msgs,
            hasError: true,
        }
    }

    await bizSiteBuilder.build(log);
    let schemas = bizSiteBuilder.buildSchemas();
    return {
        schemas: jsonpack.pack(schemas.$biz),
        logs: msgs,
        hasError: false,
    }
}
*/
//# sourceMappingURL=compile.js.map