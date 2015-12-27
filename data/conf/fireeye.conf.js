"use strict";(function (self) {

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

self.general = [
];

self.request = [
];

self.response = [
];

}).apply(null, [this]);
