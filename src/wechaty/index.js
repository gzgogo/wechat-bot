import { WechatyBuilder, ScanStatus, log } from 'wechaty';
import PuppetPadlocal from "wechaty-puppet-padlocal";
import qrTerminal from 'qrcode-terminal';
import dotenv from 'dotenv';
import { handleMessage, shardingMessage } from './handleMessage.js';

const env = dotenv.config().parsed // 环境参数


// 扫码
function onScan(qrcode, status) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    // 在控制台显示二维码
    qrTerminal.generate(qrcode, { small: true })
    const qrcodeImageUrl = ['https://api.qrserver.com/v1/create-qr-code/?data=', encodeURIComponent(qrcode)].join('')
    console.log('onScan:', qrcodeImageUrl, ScanStatus[status], status)
  } else {
    log.info('onScan: %s(%s)', ScanStatus[status], status)
  }
}

// 登录
function onLogin(user) {
  console.log(`${user} has logged in`)
  const date = new Date()
  console.log(`Current time:${date}`)
  console.log(`Automatic robot chat mode has been activated`)
}

// 登出
function onLogout(user) {
  console.log(`${user} has logged out`)
}

// 收到好友请求
async function onFriendShip(friendship) {
  const frienddShipRe = /chatgpt|chat/
  if (friendship.type() === 2) {
    if (frienddShipRe.test(friendship.hello())) {
      await friendship.accept()
    }
  }
}

/**
 * 消息发送
 * @param msg
 * @param isSharding
 * @returns {Promise<void>}
 */
async function onMessage(msg) {
  // 处理消息回复
  await handleMessage(msg, bot)
  // 消息分片
  // await shardingMessage(msg,bot)
}

// 初始化机器人
// PAD_LOCAL_TOKEN='puppet_padlocal_37a9741923944cf78d001d0fc8ae7b5c';
const bot = WechatyBuilder.build({
  name: 'wechat-jarvis',
  puppet: new PuppetPadlocal({
    token: env.PAD_LOCAL_TOKEN,
  })
});

// 扫码
bot.on('scan', onScan)
// 登录
bot.on('login', onLogin)
// 登出
bot.on('logout', onLogout)
// 收到消息
bot.on('message', onMessage)
// 添加好友
bot.on('friendship', onFriendShip)

// 启动微信机器人
bot
  .start()
  .then(() => console.log('Start to log in wechat...'))
  .catch((e) => console.error(e))
