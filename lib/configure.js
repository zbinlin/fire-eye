"use strict";

const self = require("sdk/self");
const { Cu, Cc, Ci, components: Components } = require("chrome");
const { FileUtils } = Cu.import("resource://gre/modules/FileUtils.jsm", {});
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {});
const { viewFor } = require("sdk/view/core");
const { browserWindows } = require("sdk/windows");

const DEFAULT_CONFIG_FILE = self.data.url("./conf/fireeye.conf.js");

function Configure() {
    if (!(this instanceof Configure)) {
        return new Configure();
    }
    this.configFile = FileUtils.getFile("ProfD", ["fireeye.conf.js"]);
    this.PREF_EDITOR_PATH = "extensions.fireeye.editor";
}
Configure.prototype = {
    constructor: Configure,
    /**
     * @public
     * @return {Promise<void>}
     */
    create() {
        let configFile = this.configFile;
        if (configFile.exists()) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            configFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 420/* 0644 */);
            let { NetUtil } = Cu.import("resource://gre/modules/NetUtil.jsm", {});
            let aOutputStream = Cc["@mozilla.org/network/file-output-stream;1"]
                                  .createInstance(Ci.nsIFileOutputStream);
            aOutputStream.init(configFile, -1, -1, 0);
            NetUtil.asyncFetch(
                NetUtil.newURI(DEFAULT_CONFIG_FILE),
                function (aInputStream, aResult) {
                    if (!Components.isSuccessCode(aResult)) {
                        reject(aResult);
                        return;
                    }
                    NetUtil.asyncCopy(aInputStream, aOutputStream, function (aResult) {
                        if (!Components.isSuccessCode(aResult)) {
                            reject(aResult);
                            return;
                        }
                        resolve();
                    });
                }
            );
        });
    },
    /**
     * @public
     * @return {Promise<{request: Array, response: Array}>}
     */
    load() {
        let configFile = this.configFile;
        if (!configFile.exists()) {
            return this.create().then(() => {
                return this.load();
            });
        } else if (configFile.isDirectory()) {
            return Promise.reject(
                new Error(`${configFile.path} is a directory.`)
            );
        } else if (!configFile.isReadable()) {
            return Promise.reject(
                new Error(`Can't read ${configFile.path}`)
            );
        }
        var config = {};
        try {
            Services.scriptloader.loadSubScriptWithOptions(
                Services.io.newFileURI(configFile).spec,
                {
                    target: config,
                    charset: "UTF-8",
                    ignoreCache: true,
                }
            );
        } catch (ex) {
            return Promise.reject(ex);
        }
        if (!Array.isArray(config.general)) {
            config.general = [];
        }
        if (!Array.isArray(config.request)) {
            config.request = config.general.slice();
        } else {
            config.request = config.general.concat(config.request);
        }
        if (!Array.isArray(config.response)) {
            config.response = config.general.slice();
        } else {
            config.response = config.general.concat(config.response);
        }
        return Promise.resolve(config);
    },
    /**
     * @public
     * @return {Promise<void>}
     */
    edit() {
        let editor = this.editor;
        let configFile = this.configFile;
        if (!editor) {
            return Promise.reject(new Error("Not specified editor."));
        }
        let args = [configFile.path];
        let name = editor.leafName;
        if (name.startsWith("vim")) {
            args.unshift("-gf");
        } else if (name.startsWith("gvim")) {
            args.unshift("-f");
        }
        return new Promise((resolve, reject) => {
            let process = Cc["@mozilla.org/process/util;1"]
                            .createInstance(Ci.nsIProcess);
            process.init(editor);
            process.runwAsync(args, args.length, {
                observe(aSubject, aTopic) {
                    if (aTopic === "process-finished") {
                        resolve();
                    } else if (aTopic === "process-failed") {
                        reject();
                    }
                },
            });
        });
    },
    get editor() {
        let editor = this.getDefaultEditor();
        if (editor) {
            return editor;
        }
        const nsIFilePicker = Ci.nsIFilePicker;
        let fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterApps);
        let aWin = viewFor(browserWindows.activeWindow);
        fp.init(aWin, "Editor...", nsIFilePicker.modeOpen);
        let rv = fp.show();
        if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
            let file = fp.file;
            this.editor = file;
            return file;
        } else {
            return null;
        }
    },
    set editor(file) {
        this.__editor__ = file;
        try {
            Services.prefs.setCharPref(this.PREF_EDITOR_PATH, file.path);
        } catch (ex) {
            console.error(`Set editor throws Error: ${ex.message || ex}`);
        }
    },
    getDefaultEditor() {
        if (this.__editor__) {
            return this.__editor__;
        }
        try {
            let editorPath = Services.prefs.getCharPref(this.PREF_EDITOR_PATH);
            var lf = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            lf.initWithPath(editorPath);
            this.__editor__ = lf;
            return lf;
        } catch (ex) {
            console.log(ex.message);
        }
    },
};


module.exports = Configure;
