const express = require("express");
const app = express();

const config=require("./config/config")

app.listen(config.port,config.host,() => console.log("http://"+config.host+":"+config.port));
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({extended: false}));
//设置跨域访问
app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("X-Powered-By", "http://0.0.0.0");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.header("Access-Control-Allow-Credentials",true);//携带cookie跨域请求
    req.method.toUpperCase() === "OPTIONS" ? res.sendStatus(200) : next();//防止在预请求阶段就响应接口
});

app.use("/v1/blacklist",require("./blacklist/blacklist"))
