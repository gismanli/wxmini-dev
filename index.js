const path = require("path");
const express = require("express");
const request = require("request");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0, 
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

app.get("/send", async function (req, res) {
  const { openid } = req.query; // 通过get参数形式指定openid
  // 在这里直接是触发性发送，也可以自己跟业务做绑定，改成事件性发送
  const info = await sendapi(openid);
  res.send(info);
});

async function sendapi(openid) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: "http://api.weixin.qq.com/cgi-bin/message/subscribe/send",
        method: "POST",
        body: JSON.stringify({
          touser: openid,
          template_id: "YGfYNyOZc0VfALegCjHBqenP9QhupnHReRQNpJlWwnM",
          miniprogram_state: "developer",
          data: {
            // 这里替换成自己的模板ID的详细事项，不要擅自添加或更改
            // 按照key前面的类型，对照参数限制填写，否则都会发送不成功
            //
            phrase4: {
              value: "这是一个提醒",
            },
            time15: {
              value: new Date().toLocaleDateString(),
            },
            character_string1: {
              value: openid
            }
          },
        }),
      },
      function (error, res) {
        if (error) reject(error);
        resolve(res.body);
      }
    );
  });
}

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
