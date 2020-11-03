const express = require("express");
const router = express.Router();
const request=require("request");
const cheerio = require('cheerio');
module.exports = router;
const config = require("../config/mysql");
const mysql = require("mysql");
const conn = mysql.createConnection(config);
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
}

router.get("/submit", (req, res) => 
{
    let phoneName=req.query.phoneName
    console.log(req.query)
    if(!phoneName)
    {
        return res.json(
        {
            code: 403,
            data: "request error",
        });
    }

    getPhoneName(phoneName,function(phoneNames)
    {
        if(phoneNames.length!=0)
        {
            return res.json(
            {
                code: 200,
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
            let keys=["name","brand","models"];
            let values=[data.name,data.pinpai,data.jixing];

            insertSql("phoneprice_phonename",keys,values,function()
            {
                return res.json(
                {
                    code: 200,
                });
            },function(err)
            {
                return res.json(
                {
                    code: 200,
                });
            });
        },function(err)
        {
            return res.json(
            {
                code: 200,
            });
        },null);
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
            let cookie="Hm_lpvt_ae5edc2bc4fc71370807f6187f0a2dd0="+Date.parse(new Date());
            let url="http://detail.zol.com.cn/index.php?c=SearchList&subcateId=57&keyword="+phoneName.name;
            url=encodeURI(url);

            let randTime=Math.random()*7000+3000;
            
            setTimeout(function()
            {
                httpRequest(url,function(content)
                {
                    content=iconv.decode(content,"gb2312");
                    let $=cheerio.load(content);
                    let mods=$("div[class=pro-intro]");
                    let prices=$("div[class='price-box']");

                    for(let i=0;i<mods.length;i++)
                    {
                        let it=mods[i];
                        let priceNode=prices[i];

                        let phone=new PhoneInfo();

                        phone.name=$("a[class=title]",it).text();
                        phone.price=$("b[class='price-type']",priceNode).text();

                        let ul=$("ul[class='param clearfix']",it);

                        let as=$("a",ul);
                        for(let i=0;i<as.length;i++)
                        {
                            let a=as[i];
                            if(a.children[0].data=="更多参数>>")
                            {
                                phone.link="http://detail.zol.com.cn"+a.attribs.href;
                                break;
                            }
                        }
                        
                        if(phone.link=="")
                        {
                            continue;
                        }

                        getPhoneInfoID(phone.name,function(id)
                        {
                            let randTime=Math.random()*7000+3000;
                            setTimeout(function(args)
                            {
                                httpRequest(phone.link,function(content,args)
                                {
                                    let id=args.id;
                                    let phone=args.phone;
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
                                        }
                                    }

                                    let sqlKeys=
                                    [
                                        "name","mainScreen","CPU",
                                        "CPUrate","system","power",
                                        "price","link","GPU",
                                        "RAM","ROM","markTime",
                                        "updateTime"
                                    ];

                                    let sqlValue=
                                    [
                                        phone.name,phone.mainScreen,phone.CPU,
                                        phone.CPUrate,phone.system,phone.power,
                                        phone.price,phone.link,phone.GPU,
                                        phone.RAM,phone.ROM,phone.markTime,
                                        "now()"
                                    ];

                                    if(id==0)
                                    {
                                        insertSql("phoneprice_phoneinfo",sqlKeys,sqlValue);
                                    }
                                    else
                                    {
                                        updateSql("phoneprice_phoneinfo",id,sqlKeys,sqlValue);
                                    }
                                    
                                },function(err)
                                {
                                    return res.json(
                                    {
                                        code: 403,
                                        data: err,
                                    });
                                },null,{"phone":phone,"id":args.id});
                            },randTime,{"id":id});
                        },
                        function(err)
                        {
                            
                        });
                    }

                    return res.json(
                    {
                        code: 200,
                    });

                },function(err)
                {
                    return res.json(
                    {
                        code: 500,
                        data: err,
                    });
                },cookie);
            },randTime);
        });
    });
});

function getPhoneName(phoneName,func,errFunc)
{
    let sql="select * from phoneprice_phonename where models like '%"+phoneName+"%';";
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

function getPhoneNames(func,errFunc)
{
    let sql="select * from phoneprice_phonename;";
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