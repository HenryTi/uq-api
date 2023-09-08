import * as _ from 'lodash';
// import { UqBuildApi } from '../../core';
// import { CompileOptions } from '../../compile';
import { Uq, UqVersion, Tuid } from '../il';
import { DbContext } from './dbContext';
import { Sys } from './sys';
import { Modified } from './modified';

export class BUq {
    private context: DbContext;
    private uq: Uq;
    private sys: Sys;

    constructor(uq: Uq, context: DbContext) {
        this.context = context;
        this.uq = uq;
        this.sys = new Sys(context)
    }

    getTuid(name: string): Tuid { return this.uq.tuids[name]; }
    /*
    async updateDb(runner: UqBuildApi, serviceId: number, uqId: number, uqUniqueUnit: number, options: CompileOptions): Promise<{
        ok: boolean,
        modified: boolean,
        err: any,
    }> {
        try {
            let { log, coreObjs, sysObjs, appObjs } = this.context;

            let retBuild = !runner.exists;
            let savedVersion: UqVersion;
            let compilerVersion: string;
            let devBuildSys: boolean;
            if (retBuild === true) {
                // new database created
                log(`Database ${runner.dbName} just created, will thoroughly build`);
                options.action = 'thoroughly';
            }
            else {
                log(`Database ${runner.dbName} exists`);
                try {
                    let [ver, compilerVer, devBuildSysSetting] = await Promise.all([
                        runner.getSetting('version'),
                        runner.getSetting('compiler-version'),
                        runner.getSetting('dev-build-sys'),
                    ]);
                    savedVersion = new UqVersion(ver);
                    compilerVersion = compilerVer ?? '0.0.0';
                    devBuildSys = typeof (devBuildSysSetting) === 'string';
                }
                catch {
                }
            }
            if (!compilerVersion) compilerVersion = '0.0.0';
            if (!savedVersion) savedVersion = new UqVersion('0.0.0');

            this.sys.build();

            let { author, version } = this.uq;
            let verCompare = version.compare(savedVersion);
            if (verCompare < 0) {
                return {
                    ok: false,
                    modified: false,
                    err: `current version ${version} can not lower than saved version ${savedVersion}`,
                };
            }

            if (this.context.compilerVersion !== compilerVersion
                || version.compare(savedVersion) > 0) {
                options.action = 'thoroughly';
            }

            if (
                options.action === 'thoroughly'
                || options.action === 'sys-only'
                || devBuildSys === true
            ) {
                log(`new version ${version} over ${savedVersion}`);
                if (await coreObjs.updateDb(runner, options) === false)
                    throw '升级Core Objects时，发生错误。';
            }
            if (options.action === 'thoroughly'
                || options.action === 'sys-only'
                || devBuildSys === true) {
                if (await sysObjs.updateDb(runner, options) === false)
                    throw '升级Sys Objects时，发生错误。';
            }

            if (
                options.action === 'sys-only'
            ) {
                return {
                    ok: true,
                    modified: false,
                    err: undefined,
                };
            }

            let modified = new Modified(this.context, this.uq, runner, options);
            await modified.loadSchemas(true);
            log('schemas loaded');
            await modified.buildEntityTables();
            await modified.buildEntityProcedures();
            await modified.buildBizPhrases();

            if (await appObjs.updateDb(runner, options) === false) {
                return {
                    ok: false,
                    modified: false,
                    err: 'error occured on upgrading UQ tables or procedures',
                }
            }

            let hasModified = await modified.save();

            log();
            log('build table rows');
            if (await appObjs.updateTablesRows(runner, options) === false) {
                return {
                    ok: false,
                    modified: false,
                    err: 'error occured on building table rows',
                }
            }

            log('new schemas saved');
            if (uqUniqueUnit === null) uqUniqueUnit = undefined;
            await runner.setSetting({
                service: serviceId,
                uqId: uqId,
                uqOwner: this.uq.owner,
                uq: this.uq.name,
                author,
                version: version.toString(),
                hasUnit: this.context.hasUnit === true ? '1' : '0',
                hasStatements: this.uq.statement !== undefined ? '1' : '0',
                uniqueUnit: uqUniqueUnit,
                compileTick: Date.now() / 1000,
                "compiler-version": this.context.compilerVersion,
                "dev-build-sys": null,
                "uq-doc-type": this.uq.docType,
            });
            log(`app author ${author} version ${version} saved`);

            return {
                ok: true,
                modified: hasModified,
                err: undefined,
            };
        }
        catch (err) {
            debugger;
            return {
                ok: false,
                modified: false,
                err: err,
            }
        }
    }
    */
}
