import { remark } from 'remark'
import stripMarkdown from 'strip-markdown'
import { Configuration, OpenAIApi } from 'openai'
import dotenv from 'dotenv'
const env = dotenv.config().parsed // 环境参数

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export async function getTextReply(prompt) {
  let reply = '';

  try {
    console.log('🚀🚀🚀 / prompt: ', prompt)

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      temperature: 0.7, // 每次返回的答案的相似度0-1（0：每次都一样，1：每次都不一样）0.9  
      top_p: 1,
      max_tokens: 1000, // 回复字数限制，越大越慢
      frequency_penalty: 0.0, // 控制主题的重复度[-2.0, 2.0]
      presence_penalty: 0.0, // 控制主题的重复度[-2.0, 2.0] 正值会增加新话题的产生机率 default: 0.6
      // stop: [' Human:', ' AI:'],
    })
  
    let choices = response.data.choices || [];
    reply = choices[0].text || '';

    // <br/>统一换成\n
    reply.replace('<br/>', '\n');
    reply.replace('<br />', '\n');

    // 去掉开头的非字符内容
    reply = /^[\s,?!*#.。，？！、]*([\s\S]+)/.exec(reply)[1]

    // const reply = markdownToText(response.data.choices[0].text)
    console.log('🚀🚀🚀 / reply: ', reply)
  } catch (error) {
    reply = `Error(${error.response.status}): ${error.response.statusText}` || '';
    console.log(error.response.data.error.message);
    console.error(error);
  }
  
  return reply
}

export async function getImageReply(prompt) {
  try {
    console.log('🚀🚀🚀 / prompt: ', prompt)
    const response = await openai.createImage({
      model: "image-alpha-001",
      prompt,
    });
  
    // console.log(response.data);
  
    let reply = response.data.data[0].url;
    console.log('🚀🚀🚀 / reply: ', reply)
  
    return reply
  } catch (error) {
    console.error(error);
    return '';
  }

}

// function markdownToText(markdown) {
//   return remark()
//     .use(stripMarkdown)
//     .processSync(markdown ?? '')
//     .toString()
// }
