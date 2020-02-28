const express = require("express");
const router = express.Router();

module.exports = router;

const config = require("../config/mysql");
const mysql = require("mysql");
const conn = mysql.createConnection(config);

router.get("/", (req, res) => 
{
    const search=req.query.search;
    const page=req.query.page;

    var sql="select * from blacklist_blacklist where ";
    sql=sql+"reason like '%"+req.query.search+"%' or ";
    sql=sql+"gameName like '%"+req.query.search+"%' or ";
    sql=sql+"actorName like '%"+req.query.search+"%' or ";
    sql=sql+"qq like '%"+req.query.search+"%' or ";
    sql=sql+"wechat like '%"+req.query.search+"%' or ";
    sql=sql+"alipay like '%"+req.query.search+"%' or ";
    sql=sql+"paypal like '%"+req.query.search+"%' or ";
    sql=sql+"baidu like '%"+req.query.search+"%';";

    conn.query(sql,(err,result)=>
    {
        if (err)
        {
            return res.json(
            {
                code: 403,
                data: "请求错误",
            });
        }

        var data=[]

        for(var i=(page-1)*10;i<page*10 && i<result.length;i++)
        {
            data.push(result[i]);
        }

        res.json
        ({
            code:200,
            data:data,
            currpage:Number(page),
            totalpage:Math.ceil(result.length/10)
        });
    });
});

router.get("/checkblacklist", (req, res) => 
{
    var sql="select * from blacklist_checkblacklist;";

    conn.query(sql,(err,result)=>
    {
        if (err)
        {
            return res.json(
            {
                code: 500,
            });
        }

        res.json
        ({
            code:200,
            data:result,
        });
    });
});

router.get("/appeal",(req, res) => 
{
    var sql="select t2.id,t2.reason,t2.created_time as created_time,t1.id as b_id,t1.reason as b_reason,t1.gameName as b_gameName,t1.serverName as b_serverName,t1.actorName as b_actorName,t1.qq as b_qq,t1.wechat as b_wechat,t1.alipay as b_alipay,t1.paypal as paypal,t1.evidence as b_evidence,t1.baidu as b_baidu from blacklist_blacklist as t1,(select * from blacklist_blacklistappeal)as t2 where t1.id=t2.b_id_id;";

    conn.query(sql,(err,result)=>
    {
        if (err)
        {
            return res.json(
            {
                code: 500,
            });
        }

        res.json
        ({
            code:200,
            data:result,
        });
    });
});

router.post("/checkblacklist", (req, res) => 
{
    var data;
    for(var key in req.body)
    {
        data=key;
    }

    data=JSON.parse(data);

    var sql="insert into blacklist_checkblacklist(";
    sql+="reason,gameName,serverName,actorName,qq,wechat,alipay,paypal,evidence,baidu,created_time,updated_time";
    sql+=") values(";
    sql+="'"+data.reason+"'";
    sql+=",'"+data.gameName+"'";
    sql+=",'"+data.serverName+"'";
    sql+=",'"+data.actorName+"'";
    sql+=",'"+data.qq+"'";
    sql+=",'"+data.wechat+"'";
    sql+=",'"+data.alipay+"'";
    sql+=",'"+data.paypal+"'";
    sql+=",'"+data.evidence+"'";
    sql+=",'"+data.baidu+"'";
    sql+=",now()";
    sql+=",now()";
    sql+=");";

    conn.query(sql,(err,result)=>
    {
        if (err)
        {
            console.log("err:",err);
            console.log("result:",result);
            return res.json(
            {
                code: 500,
            });
        }

        res.json
        ({
            code:200,
        });
    });

    console.log(sql);
});

router.post("/appeal",(req, res) => 
{
    var data;
    for(var key in req.body)
    {
        data=key;
    }

    console.log(data);
    data=JSON.parse(data);

    var sql="insert into blacklist_blacklistappeal(reason,created_time,b_id_id) values('"+data.reason+"',now(),'"+data.id+"');";

    conn.query(sql,(err,result)=>
    {
        if (err)
        {
            console.log("err:",err);
            console.log("result:",result);
            return res.json(
            {
                code: 500,
            });
        }

        res.json
        ({
            code:200,
        });
    });
});