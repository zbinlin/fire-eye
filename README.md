# FireEye

Custom HTTP Headers

最初 FireEye 扩展的名字是 ModHttpHeader，为了修改 HTTP Header 而编写的。由于某
次在查看 Cookie 时，通过搜索关键字“ref”发现大量曾经访问过的链接，而这还是在禁止
第三方 Cookie 的情况下发生的。

猜测是在点击这些链接是由 Referer 带过去，并且由服务器写回 Cookie 的，由于不太喜
欢被“人”跟综，于是想把这些 Referer 在带出去前全部 block 掉。

在查找 Firefox 的 about:config 里查找 referer 时，发现有一条 preference 是控制
referer 的：[network.http.sendRefererHeader][]，进一步查找它的值的含义时，发现
可以通过设置值为 0 来禁止 http 发送 referer。

但由于很多网站在登陆时会检查 referer 来防止 CSRF，如果直接设置该 preference 的
值为 0，会导致这些网站无法正常登入。修改 [network.http.sendRefererHeader][] 的
方式行不通了，于是想通过扩展来修改这些 referer，如果 referer 的 host 与 http
request 的 host 一致就放行，否则 block 掉。

这样一来就可以解决因为 CSRF 而引起网站无法登入的情况了。当然，可能有些网站允许
某个不同 host 的链接登陆，这里也会因 block 掉而无常正常登入，还有就是还有些同
host 的其他 referer 会带出去。

由于之前已经编写了 ModHttpHeader 扩展用来修改 HTTP Header，但配置无法进行逻辑判
断，因而无法对 http request 的 URI 与 referer 进行判断。于是修改了 ModHttpHeader
代码，使其可以达到这个需求，并重新命名为 FireEye。

配置文件：[data/conf/fireeye.conf.js](./data/conf/fireeye.conf.js)

[network.http.sendRefererHeader]: http://dxr.mozilla.org/mozilla-central/source/modules/libpref/src/init/all.js#l953 "network.http.sendRefererHeader"
