"use strict";

const { when } = require("sdk/system/unload");

const HttpGuard = require("./lib/http-guard");
const Configure = require("./lib/configure");

const { ToggleButton } = require("sdk/ui");
const { Panel } = require("sdk/panel");
const notifications = require("sdk/notifications");

let config = new Configure();
let httpGuard = new HttpGuard();

const _ = require("sdk/l10n").get;

const states = {
    enabled: {
        label: _("label_enabled"),
        icon: {
            16: "./icons/icon-16.png",
            32: "./icons/icon-32.png",
            64: "./icons/icon-64.png",
        },
    },
    disabled: {
        label: _("label_disabled"),
        icon: {
            16: "./icons/disabled-icon-16.png",
            32: "./icons/disabled-icon-32.png",
            64: "./icons/disabled-icon-64.png",
        },
    },
};

let actions = {
    reload() {
        loadConfigure().then(() => {
            notifySuccess();
        }).catch(ex => {
            console.error(ex.message);
            console.error(ex.stack || ex);
            notifyFailure();
        });
    },
    edit() {
        config.edit().then(() => {
            return loadConfigure().then(() => {
                notifySuccess();
            }, ex => {
                console.error(ex.message);
                console.error(ex.stack || ex);
                notifyFailure();
            });
        }, ex => {
            console.log(ex.message);
        });
    },
    toggle() {
        if (actions.enabled) {
            httpGuard.pause();
            button.state(button, {
                label: states.disabled.label,
                icon: states.disabled.icon,
            });
        } else {
            httpGuard.resume();
            button.state(button, {
                label: states.enabled.label,
                icon: states.enabled.icon,
            });
        }
        actions.enabled = !actions.enabled;
    },
};
Object.defineProperty(actions, "enabled", {
    writable: true,
    value: true,
});

let button = ToggleButton({
    id: "fire-eye-btn",
    label: states.enabled.label,
    icon: states.enabled.icon,
    onChange(state) {
        if (state.checked) {
            panel.show({
                position: this,
                width: 0.1,
                height: 0.1,
            });
        }
    },
});

let panel = Panel({
    focus: true,
    contentURL: "./menu.html",
    contentScriptFile: "./menu.js",
    contentStyleFile: "./menu.css",
    onMessage(data) {
        if (!data || typeof data !== "object") {
            console.log(data);
            return;
        }
        if (data.action) {
            let action = actions[data.action];
            if (typeof action === "function") {
                action();
                this.hide();
            } else {
                console.log(data);
            }
        } else if (data.resize) {
            panel.resize(data.resize.width, data.resize.height);
        }
    },
    onShow() {
        let items = Object.keys(actions).filter(key => {
            if (!actions.enabled) {
                return key === "toggle";
            } else {
                return true;
            }
        }).map(key => {
            let text = key === "toggle" ? actions.enabled ? "disable" : "enable"
                                        : key;
            return {
                text: _(`action_${text}`),
                value: key,
            };
        });
        this.port.emit("init", {
            items,
        });
    },
    onHide() {
        button.state("window", {
            checked: false,
        });
    },
});


loadConfigure().then(() => {
    httpGuard.register();
}).catch(ex => {
    console.error(ex.message);
    console.error(ex.stack || ex);
    notifyFailure();
});


when(function (reason) {
    if (reason === "disable" || reason === "uninstall") {
        httpGuard.unregister();
    }
});


function loadConfigure() {
    return config.load().then(({request, response}) => {
        httpGuard.req = request;
        httpGuard.res = response;
    });
}
function notifySuccess() {
    notifications.notify({
        title: "FireEye",
        iconURL: "./icons/icon-64.png",
        text: _("config_load_success"),
    });
}
function notifyFailure() {
    notifications.notify({
        title: "FireEye",
        iconURL: "./icons/icon-64.png",
        text: _("config_load_failure", config.configFile.path),
    });
}
