import { remark } from 'remark'
import stripMarkdown from 'strip-markdown'
import axios from 'axios'
import HttpsProxyAgent from 'https-proxy-agent'
import { Configuration, OpenAIApi } from 'openai'
import dotenv from 'dotenv'

const env = dotenv.config().parsed // 环境参数

const instance = axios.create({
  // baseURL: 'https://api.openai.com',
  // httpsAgent: new HttpsProxyAgent('http://127.0.0.1:8001'),
  // proxy: false,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
  },
})

// const instance = axios.create({
//   timeout: 50000,
//   httpsAgent,
//   // proxy: false
// });

export async function getChatReply(messages) {
  let reply = ''

  try {
    console.log('🚀🚀🚀 / prompt: ', messages)

    const data = {
      model: 'gpt-3.5-turbo', // 'text-davinci-003',
      messages: [
        { role: 'system', content: "You are ChatGPT, a large language model trained by OpenAI. You are powered by GPT-3.5. Please answer in detail." },
        ...messages
      ],
      temperature: 0.8, // 每次返回的答案的相似度0-1（0：每次都一样，1：每次都不一样)
      top_p: 1,
      max_tokens: 1024, // 回复字数限制，越大越慢
      frequency_penalty: 0.0, // 控制主题的重复度[-2.0, 2.0]
      presence_penalty: 1, // 控制主题的重复度[-2.0, 2.0] 正值会增加新话题的产生机率 default: 0.6
      // stop: [' Human:', ' AI:'],
    }

    const response = await instance.post('https://api.openai.com/v1/chat/completions', data)
    reply = response.data.choices[0].message.content

    // <br/>统一换成\n
    reply.replace('<br/>', '\n')
    reply.replace('<br />', '\n')

    // 去掉开头的非字符内容
    reply = /^[\s,?!*#.。，？！、]*([\s\S]+)/.exec(reply)[1]

    // const reply = markdownToText(response.data.choices[0].text)
    console.log('🚀🚀🚀 / reply: ', reply)
  } catch (error) {
    // reply = error.response ? `Error(${error.response.status}): ${error.response.statusText}` : `Error: ${error || '未知错误'}`
    reply = ''
    console.log(error.response?.data.error.message)
    console.error(error)
  }

  return reply
}

export async function getImageReply(prompt) {
  try {
    console.log('🚀🚀🚀 / prompt: ', prompt)

    const data = {
      prompt,
      n: 1,
      size: '1024x1024',
    }

    const response = await instance.post('https://api.openai.com/v1/images/generations', data)
    let reply = response.data.data[0].url
    console.log('🚀🚀🚀 / reply: ', reply)

    return reply
  } catch (error) {
    console.error(error)
    return ''
  }
}

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export async function getTextReply(prompt) {
  let reply = ''

  try {
    console.log('🚀🚀🚀 / prompt: ', prompt)

    const response = await openai.createCompletion({
      model: 'text-davinci-003', // 'text-davinci-003',
      prompt: prompt,
      temperature: 0.2, // 每次返回的答案的相似度0-1（0：每次都一样，1：每次都不一样）0.9
      top_p: 1,
      max_tokens: 1000, // 回复字数限制，越大越慢
      frequency_penalty: 0.0, // 控制主题的重复度[-2.0, 2.0]
      presence_penalty: 0.0, // 控制主题的重复度[-2.0, 2.0] 正值会增加新话题的产生机率 default: 0.6
      // stop: [' Human:', ' AI:'],
    })

    let choices = response.data.choices || []
    reply = choices[0].text || ''

    // <br/>统一换成\n
    reply.replace('<br/>', '\n')
    reply.replace('<br />', '\n')

    // 去掉开头的非字符内容
    reply = /^[\s,?!*#.。，？！、]*([\s\S]+)/.exec(reply)[1]

    // const reply = markdownToText(response.data.choices[0].text)
    console.log('🚀🚀🚀 / reply: ', reply)
  } catch (error) {
    reply = error.response ? `Error(${error.response.status}): ${error.response.statusText}` : `Error: ${error || '未知错误'}`
    console.log(error.response?.data.error.message)
    console.error(error)
  }

  return reply
}

// function markdownToText(markdown) {
//   return remark()
//     .use(stripMarkdown)
//     .processSync(markdown ?? '')
//     .toString()
// }
