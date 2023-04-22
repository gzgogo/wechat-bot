import { FileBox } from 'file-box'
import { getChatReply, getImageReply } from '../openai/index.js'
import { botName, roomWhiteList, aliasWhiteList } from '../../config.js'

// const quoteMap = {}
const chatHistory = {}

/**
 * 默认消息发送
 * @param msg
 * @param bot
 * @returns {Promise<void>}
 */
export async function handleMessage(msg, bot) {
  const contact = msg.talker() // 发消息人
  const receiver = msg.to() // 消息接收人
  let content = msg.text() // 消息内容
  const room = msg.room() // 是否是群消息
  const roomName = (await room?.topic()) || null // 群名称
  const alias = (await contact.alias()) || (await contact.name()) // 发消息人昵称
  const remarkName = await contact.alias() // 备注名称
  const name = await contact.name() // 微信名称
  const isText = msg.type() === bot.Message.Type.Text // 消息类型是否为文本
  const isRoom = roomName && (roomWhiteList.includes(roomName) || roomName.startsWith('Arnolds.AI')) // 是否在群聊白名单内
  // const isAlias = (remarkName && aliasWhiteList.includes(remarkName)) || aliasWhiteList.includes(name) // 发消息的人是否在联系人白名单内
  const isAlias = true // 取消私聊白名单的限制
  const isBotSelf = botName === remarkName || botName === name // 是否是机器人自己
  let isImage = false
  let quote = ''

  // TODO 你们可以根据自己的需求修改这里的逻辑
  if (isText && !isBotSelf) {
    try {
      /* 注意处理content的顺序不能修改！！！！！ */

      // 判断是否要求返回图片
      let regex = /^(@(\S*-)?Arnolds\s)?\*\*(.*)$/
      if (regex.test(content)) {
        isImage = true
        content = regex.exec(content)[3]
      }

      // 区分群聊和私聊
      if (isRoom && room) {
        try {
          if (isImage) {
            console.log(`\n--- ${name} in ${roomName} (image)`)

            let reply = await getImageReply(content)
            if (reply) {
              await room.say(`"${content}"生成成功，图片正缓缓向您飞来`, contact)
              await room.say(FileBox.fromUrl(reply))
            } else {
              await room.say(`抱歉，无法为您生成图片: ${content}`)
            }
          } else if (content.includes(`@${botName}`) || content.includes(`@AI-${botName}`)) {
            console.log(`\n--- ${name} in ${roomName} (content)`)

            if (!Array.isArray(chatHistory[roomName])) {
              chatHistory[roomName] = []
            }

            // 去掉@部分
            content = content.replace(`@AI-${botName}`, '')
            content = content.replace(`@${botName}`, '')
            content = content.trim()

            if (content.toLowerCase() === 'clear') {
              chatHistory[roomName] = []
              await room.say('上下文已清空')
              return
            }

            chatHistory[roomName].push({
              role: 'user',
              content: content,
            })

            let reply = await getChatReply(chatHistory[roomName])
            if (reply) {
              chatHistory[roomName].push({
                role: 'assistant',
                content: reply,
              })
            } else {
              reply = `抱歉，无法回答您的问题: ${content}`
            }
            await room.say(`${reply}\n\n👉一对一 无障碍 对话GPT-4.0\n👉注册网页版Https://Arnolds.AI`, contact)
          }

          return
        } catch (error) {
          await room.say('抱歉，程序异常，请稍后再试')
        }
      }
      // 私人聊天，白名单内的直接发送
      if (isAlias && !room) {
        console.log(`\n--- ${name}:`)

        if (isImage) {
          let reply = await getImageReply(content)
          if (reply) {
            await contact.say(`"${content}"生成成功，图片正缓缓向您飞来`)
            await contact.say(FileBox.fromUrl(reply))
          } else {
            await contact.say(`抱歉，无法为您生成图片: ${content}`)
          }
        } else {
          if (content.toLowerCase() === 'clear') {
            chatHistory[name] = []
            await room.say('上下文已清空')
            return
          }

          if (!Array.isArray(chatHistory[name])) {
            chatHistory[name] = []
          }

          chatHistory[name].push({
            role: 'user',
            content: content,
          })

          let reply = await getChatReply(chatHistory[name])
          if (reply) {
            chatHistory[name].push({
              role: 'assistant',
              content: reply,
            })
          } else {
            reply = `抱歉，无法回答您的问题: ${content}`
          }

          await contact.say(reply)
        }
      }
    } catch (e) {
      await contact.say('抱歉，出现异常，请稍后再试')
      console.error(e)
    }
  }
}

/**
 * 分片消息发送
 * @param message
 * @param bot
 * @returns {Promise<void>}
 */
export async function shardingMessage(message, bot) {
  const talker = message.talker()
  const isText = message.type() === bot.Message.Type.Text // 消息类型是否为文本
  if (talker.self() || message.type() > 10 || (talker.name() === '微信团队' && isText)) {
    return
  }
  const text = message.text()
  const room = message.room()
  if (!room) {
    console.log(`Chat GPT Enabled User: ${talker.name()}`)
    const response = await getChatGPTReply(text)
    await trySay(talker, response)
    return
  }
  let realText = splitMessage(text)
  // 如果是群聊但不是指定艾特人那么就不进行发送消息
  if (text.indexOf(`${botName}`) === -1) {
    return
  }
  realText = text.replace(`${botName}`, '')
  const topic = await room.topic()
  const response = await getChatGPTReply(realText)
  const result = `${realText}\n ---------------- \n ${response}`
  await trySay(room, result)
}

// 分片长度
const SINGLE_MESSAGE_MAX_SIZE = 500

/**
 * 发送
 * @param talker 发送哪个  room为群聊类 text为单人
 * @param msg
 * @returns {Promise<void>}
 */
async function trySay(talker, msg) {
  const messages = []
  let message = msg
  while (message.length > SINGLE_MESSAGE_MAX_SIZE) {
    messages.push(message.slice(0, SINGLE_MESSAGE_MAX_SIZE))
    message = message.slice(SINGLE_MESSAGE_MAX_SIZE)
  }
  messages.push(message)
  for (const msg of messages) {
    await talker.say(msg)
  }
}

/**
 * 分组消息
 * @param text
 * @returns {Promise<*>}
 */
async function splitMessage(text) {
  let realText = text
  const item = text.split('- - - - - - - - - - - - - - -')
  if (item.length > 1) {
    realText = item[item.length - 1]
  }
  return realText
}
