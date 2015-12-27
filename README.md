# FireEye
Custom HTTP Headers

## 前言 ##

最初 FireEye 扩展的名字是 ModHttpHeader，为了修改 HTTP Header 而编写的。由于某次在查看 Cookie 时，通过搜索关键字“ref”发现大量曾经访问过的链接，而这还是在禁止第三方 Cookie 的情况下发生的。

猜测是在点击这些链接是由 Referer 带过去，并且由服务器写回 Cookie 的，由于不太喜欢被“人”跟综，于是想把这些 Referer 在带出去前全部 block 掉。

在查找 Firefox 的 about:config 里查找 referer 时，发现有一条 preference 是控制 referer 的：[network.http.sendRefererHeader][]，进一步查找它的值的含义时，发现可以通过设置值为 0 来禁止 http 发送 referer。

但由于很多网站在登陆时会检查 referer 来防止 CSRF，如果直接设置该 preference 的值为 0，会导致这些网站无法正常登入。修改 [network.http.sendRefererHeader][] 的方式行不通了，于是想通过扩展来修改这些 referer，如果 referer 的 host 与 http request 的 host 一致就放行，否则 block 掉。

这样一来就可以解决因为 CSRF 而引起网站无法登入的情况了。当然，可能有些网站允许某个不同 host 的链接登陆，这里也会因 block 掉而无常正常登入，还有就是还有些同 host 的其他 referer 会带出去。

由于之前已经编写了 ModHttpHeader 扩展用来修改 HTTP Header，但配置无法进行逻辑判断，因而无法对 http request 的 URI 与 referer 进行判断。于是修改了 ModHttpHeader 代码，使其可以达到这个需求，并重新命名为 FireEye。


## 安装 ##

linux 下：

1. clone 代码到本地：

        hg clone https://bitbucket.org/zbinlin/fireeye

2. make && make install


## 配置 ##

在安装成功后，需要到“定制工具栏”时把 FireEye 的图标 ![FireEye Icon](https://bitbucket.org/zbinlin/fireeye/raw/tip/skin/enabled.png) 拖到“附加组件栏”或其他工具栏上。

然后使用鼠标右键（或 Ctrl + 鼠标左键）单击图标，这时由于是第一次编辑配置文件，需要先选择编辑器-在弹出的对话框中选择自己熟悉的编辑器然后就可以根据以下的说明（配置文件中也有）来进行配置了：

    /*
     * FireEye 配置文件
     * 路径：%PROFILE%/fireeye.conf.js
     * 
     * general  数组的每个元素会同时应用到 HTTP request 及 HTTP response 中。
     * request  数组的每个元素只应用到 HTTP request 中。
     * response 数组的每个元素只应用到 HTTP response 中。
     *
     * 因此，如果想同时修改 request 及 response 的 HTTP Header，可以的配置放到 general 中。
     *
     * general、request、response 三个数组里定义的配置格式是一样的，数组元素是一个具有以下属性的对象：
     *
     * url       : 该属性可以是正则表达式字面量或字符串字面量，用来匹配 HTTP URI，如果匹配成功，则应用该项配置。
     *
     * fieldName : 该属性是需要修改（添加/删除）的 HTTP Header 的片段名（field name），值为字符串。
     *
     * fieldValue: 该属性是需要修改的 HTTP Header 的片段值（field value），如果为空，并且 merge 为 false，则在 HTTP Header 中删除该片段。
     *
     * extraValue: 如果该属性存在，则最终（即发送到服务器）的 HTTP Header 片段值由 defaultValue.replace(fieldValue, extraValue) 生成，如果 extraValue 是一个函数时，回调时它的第一个参数是一个 context 对象。
     *
     * merge     : 该属性值为 Boolean 类型，如果为 true，最终的 HTTP Header 片段值由 defaultValue 与 fieldValue 合并生成（注，有些 field 不支持 merge）。
     *
     * exclude   : 该属性值为 Array 类型，里面每个元素的值类型与 url 属性的一样，如果其中一个元素值与 HTTP URI 匹配，则忽略该项配置（即黑名单，用来排除某些 URI）。
     *
     *
     * 注 1：上面提到的 defaultValue 是指由 Firefox 生成的，即将发送到服务器的 HTTP Header 的片段值，FireEye 的作用就是修改这个值。
     * 注 2：context 对象目前包含如下属性：
     *   location 对象：与 window.location 里的属性基本一致，如 href 属性为 HTTP 的 URI。
     *
     * 示例：
     * * 修改发送到 http://www.example.org 的 User-Agent，但不要修改 http://www.example.org/example.html 的 User-Agent。
     * self.request = [
     *     {url: /https?:\/\/www\.example\.org\/.*$/, fieldName: "User-Agent", fieldValue: "Googlebot", exclude: ["http://www.example.org/example.html"]} 
     * ];
     *
     * * 在浏览 http://www.example.org 时，在 Set-Cookies 中添加一个新的 cookie。
     * self.response = [
     *     {url: /https?:\/\/www\.example\.org\/.*$/, fieldName: "Set-Cookie", fieldValue: "foo=bar", merge: true}
     * ];
     *
     * * 当 referer 中 URI 的 host 与 HTTP request 的 URI 不一致时，删除 referer。
     * self.request = [
     *     {url: /^.*$/, fieldName: "Referer",
     *         fieldValue: /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/,
     *         extraValue: function (context, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9, idx, source) {
     *             let location = context.location;
     *             return $4.toLowerCase() === location.host.toLowerCase() ? source : "";
     *         },
     *         merge: false
     *     }
     * ];
     */


## 其他 ##

FireEye 的按钮使用说明：

* 更新配置（每次编辑配置文件后需要更新才能生效）：鼠标左键单击按钮

* 禁用配置（如果暂时不用 FireEye 时，可以禁用配置，但这个状态只维持在当前打开的 Firefox 中，重启或关闭后打开时，FireEye 还是“启用”状态）：鼠标中键（或 Shfit + 鼠标左键）

* 编辑配置（第一次编辑时会弹出编辑器对话框来选择一个编辑器来对配置文件进行编辑）：鼠标右键（或 Ctrl + 鼠标左键）



[network.http.sendRefererHeader]: http://dxr.mozilla.org/mozilla-central/source/modules/libpref/src/init/all.js#l953 "network.http.sendRefererHeader"
