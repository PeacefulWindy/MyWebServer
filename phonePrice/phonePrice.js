const express = require("express");
const router = express.Router();
const request=require("request");
const cheerio = require('cheerio');
module.exports = router;
const config=require("../config/config")
const mysqlCfg = require("../config/mysql");
const mysql = require("mysql");
const conn = mysql.createConnection(mysqlCfg);
const iconv = require("iconv-lite");

class PhoneInfo
{
    name="";
    mainScreen="";
    CPU="";
    CPUrate="";
    system="";
    power="";
    price="";
    link="";
    GPU="";
    RAM="";
    ROM="";
    markTime="";
    mainScreenType="";
}

router.get("/submit", (req, res) => 
{
    let phoneName=req.query.phoneName
    if(!phoneName)
    {
        return res.json(
        {
            code: 403,
            data: "request error",
        });
    }

    let url="https://model.super202.cn/getJixingData.html?page=1&limit=15&sousuo="+phoneName;
    httpRequest(url,function(content)
    {
        let js=JSON.parse(content);
        if(js.data.length==0)
        {
            return;
        }

        let data=js.data[0];
        searchInfo(data.name);
    },null);

    return res.json(
    {
        code: 200,
    });
});

router.get("/update",function(req,res)
{
    getPhoneNames(function(phoneNames)
    {
        if(phoneNames.length==0)
        {
            return;
        }

        phoneNames.forEach(phoneName => 
        {
            let randTime=Math.random()*phoneNames.length*10000+2000;
            setTimeout(() => {
                searchInfo(phoneName.name);
            },randTime);
        });
    });

    return res.json
    ({
        "code":200,
    });
});

router.get("/updateFromName",function(req,res)
{
    let phoneName=req.query.name;
    if(!phoneName)
    {
        return res.json
        ({
            "code":403,
            "err":"invaild request",
        });
    }

    searchInfo(phoneName);

    return res.json(
    {
        code:200
    });
});

router.get("/search",function(req,res)
{
    let pinpaiID=0;
    if(req.query.pinpai)
    {
        pinpaiID=req.query.pinpai;
    }

    let money="1";
    if(req.query.minMoney)
    {
        if(req.query.maxMoney)
        {
            money=req.query.minMoney+"-"+req.query.maxMoney;
        }
        else
        {
            money=req.query.minMoney;
        }
    }

    let page=1;
    let url="http://detail.zol.com.cn/cell_phone_index/subcate57_"+pinpaiID+"_list_"+money+"_0_1_1_0_"+page+".html";
    httpRequest(url,function(content)
    {
        content=iconv.decode(content,"gb2312");
        let $=cheerio.load(content);
        let pageHtml=$("span[class='small-page-active']").text();
        let maxPage=0;
        if(pageHtml!="")
        {
            let index=pageHtml.indexOf("/");
            if(index != -1)
            {
                maxPage=pageHtml.substr(index+1,pageHtml.length-index);
            }
        }

        for(let page=1;page<=maxPage;page++)
        {
            let randTime=Math.random()*maxPage*10000+2000;
            setTimeout(function()
            {
                url="http://detail.zol.com.cn/cell_phone_index/subcate57_"+pinpaiID+"_list_"+money+"_0_1_1_0_"+page+".html";
                httpRequest(url,function(content)
                {
                    content=iconv.decode(content,"gb2312");
                    let $=cheerio.load(content);
                    let nodes=$("div[class='pro-intro'] h3 a");
                    for(let i=0;i<nodes.length;i++)
                    {
                        let randTime=Math.random()*nodes.length*10000+2000;
                        setTimeout(function()
                        {
                            searchInfo(nodes[i].children[0].data);
                        },randTime);
                    }
                });
            },randTime);
        }
    });
});

function getPhoneNames(func,errFunc)
{
    let sql="select name from phoneprice_phoneinfo;";
    conn.query(sql,function(err,ret)
    {
        if(err)
        {
            console.log(err);
            if(errFunc)
            {
                errFunc(err);
                return;
            }
        }

        lists=new Array();
        ret.forEach(element => {
            lists.push(element);
        });

        if(func)
        {
            func(lists);
        }
    });
}

function getPhoneInfoID(phoneName,func,errFunc)
{
    let sql="select * from phoneprice_phoneinfo where name='"+phoneName+"';";
    conn.query(sql,function(err,ret)
    {
        if(err)
        {
            console.log(err);
            if(errFunc)
            {
                errFunc(err);
                return;
            }
        }

        if(func)
        {
            if(ret.length==0)
            {
                func(0);
            }
            else
            {
                func(ret[0].id);
            }
        }
    });
}

function httpRequest(url,func,errFunc,cookie,args)
{
    var headers = 
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36",
    };

    if(cookie)
    {
        headers.cookie=cookie;
    }

    let option=
    {
        url:url,
        timeout:3000,
        encoding: null,
        headers:headers
    }

    request(option,function(err,_,content)
    {
        if(err)
        {
            console.log(err);
            if(errFunc)
            {
                errFunc(err);
            }
            return;
        }

        if(func)
        {
            func(content,args);
        }
    });
}

function insertSql(tableName,keys,values,func,errFunc)
{
    let sql="insert into "+tableName;
    sql+="(";
    for(let i=0;i<keys.length;i++)
    {
        if(i!=0)
        {
            sql+=",";
        }

        sql+=keys[i];
    }

    sql+=") values(";
    for(let i=0;i<values.length;i++)
    {
        if(i!=0)
        {
            sql+=",";
        }

        if(values[i]!="now()" && typeof(values[i])=="string")
        {
            sql=sql + "'"+values[i]+"'";
        }
        else
        {
            sql+=values[i];
        }
    }
    
    sql+=");";

    conn.query(sql,function(err,ret)
    {
        if(err)
        {
            console.log(err);
            if(errFunc)
            {
                errFunc(err);
            }
            return;
        }

        if(func)
        {
            func(ret);
        }
    });
}

function updateSql(tableName,id,keys,values,func,errFunc)
{
    let sql="update "+tableName+" set ";
    for(let i=0;i<keys.length;i++)
    {
        let key=keys[i];
        let value=values[i];

        sql=sql+key+"=";
        if(values[i]!="now()" && typeof(values[i])=="string")
        {
            sql=sql+"'"+value+"'";
        }
        else
        {
            sql=sql+value;
        }

        if(i<keys.length-1)
        {
            sql+=","
        }
    }
    sql=sql+" where id="+id+";";

    conn.query(sql,function(err,ret)
    {
        if(err)
        {
            console.log(err);
            if(errFunc)
            {
                errFunc(err);
            }
            return;
        }

        if(func)
        {
            func(ret);
        }
    });
}

function searchInfo(phoneName)
{
    let url="http://detail.zol.com.cn/index.php?c=SearchList&subcateId=57&keyword="+phoneName;
    url=encodeURI(url);
    let cookie="Hm_lpvt_ae5edc2bc4fc71370807f6187f0a2dd0="+Date.parse(new Date());
    httpRequest(url,function(content)
    {
        content=iconv.decode(content,"gb2312");
        let $=cheerio.load(content);
        let mods=$("div[class='list-item clearfix']");
        let prices=$("div[class='price-box']");

        for(let i=0;i<mods.length;i++)
        {
            let it=mods[i];
            let priceNode=prices[i];

            let phone=new PhoneInfo();

            phone.name=$("h3 a",it).text();
            phone.price=$("b[class='price-type']",priceNode).text();
            phone.link=$("ul[class='param clearfix'] li:nth-child(8) a",it).attr("href");
            if(phone.link=="")
            {
                continue;
            }

            phone.link="http://detail.zol.com.cn/"+phone.link;

            let randTime=Math.random()*mods.length*10000+3000;
            setTimeout(function()
            {
                httpRequest(phone.link,function(content)
                {
                    content=iconv.decode(content,"gb2312");
                    let $=cheerio.load(content);
                    let detailedParameters=$("div[class='detailed-parameters']");

                    let ths=$("th",detailedParameters);
                    let tds=$("td",detailedParameters);
                    for(let i=0;i<ths.length;i++)
                    {
                        let title=$("#newPmName_"+i,ths).text();
                        let value=$("#newPmVal_"+i,tds).text();

                        switch(title)
                        {
                        case "出厂系统内核":
                            phone.system=value;
                            break;
                        case "CPU型号":
                            phone.CPU=value;
                            break;
                        case "主屏分辨率":
                            phone.mainScreen=value;
                            break;
                        case "CPU频率":
                            phone.CPUrate=value;
                            break;
                        case "GPU型号":
                            phone.GPU=value;
                            break;
                        case "RAM容量":
                            phone.RAM=value;
                            break;
                        case "ROM容量":
                            phone.ROM=value;
                            break;
                        case "电池容量":
                            phone.power=value;
                            break;
                        case "上市日期":
                            phone.markTime=value;
                            break;
                        case "屏幕类型":
                            phone.mainScreenType=value;
                            break;
                        }
                    }

                    let sqlKeys=
                    [
                        "name","mainScreen","CPU",
                        "CPUrate","system","power",
                        "price","link","GPU",
                        "RAM","ROM","markTime",
                        "mainScreenType","updateTime"
                    ];

                    let sqlValue=
                    [
                        phone.name,phone.mainScreen,phone.CPU,
                        phone.CPUrate,phone.system,phone.power,
                        phone.price,phone.link,phone.GPU,
                        phone.RAM,phone.ROM,phone.markTime,
                        phone.mainScreenType,"now()"
                    ];

                    getPhoneInfoID(phone.name,function(id)
                    {
                        if(id==0)
                        {
                            insertSql("phoneprice_phoneinfo",sqlKeys,sqlValue);
                        }
                        else
                        {
                            updateSql("phoneprice_phoneinfo",id,sqlKeys,sqlValue);
                        }
                    });
                });
            },randTime);
        }
    },null,cookie);
}