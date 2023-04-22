import { WechatyBuilder, ScanStatus, log } from 'wechaty'
import PuppetPadlocal from 'wechaty-puppet-padlocal'
import { FileBox } from 'file-box'
import qrTerminal from 'qrcode-terminal'
import dotenv from 'dotenv'
import { handleMessage, shardingMessage } from './handleMessage.js'

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

// 使用企业微信
const bot = WechatyBuilder.build({
  name: 'wxwork-jarvis',
  puppet: 'wechaty-puppet-service', // WorkPro 是一种 puppet-service ，因此这里应该填写 'wechaty-puppet-service' 而不是 'wechaty-puppet-workpro'
  puppetOptions: {
    // tls: { disable: true },
    token: env.WORK_LOCAL_TOKEN,
  },
})

// // 使用pad协议
// const bot = WechatyBuilder.build({
//   name: 'wechat-jarvis',
//   puppet: new PuppetPadlocal({
//     token: env.PAD_LOCAL_TOKEN,
//   })
// });

// // 使用web协议
// export const bot = WechatyBuilder.build({
//   name: 'wechat-jarvis',
//   puppet: 'wechaty-puppet-wechat',
//   puppetOptions: {
//     uos: true,
//   },
// })

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
// 有人加入群时
bot.on('room-join', (room, inviteeList, inviter) => {
  inviteeList.forEach(async (c) => {
    await room.say('欢迎加入体验群，使用方法请看群公告。添加公众号解锁私聊，上下文等更多功能：jarvis-ai-qy', c)
    await room.say(FileBox.fromUrl('https://i.328888.xyz/2023/02/24/7Mrkk.md.jpeg'))
  })
})
// 发生错误
bot.on('error', (error) => {
  console.error(error)
})

// 启动微信机器人
bot
  .start()
  .then(() => console.log('Start to log in wechat...'))
  .catch((e) => console.error(e))
