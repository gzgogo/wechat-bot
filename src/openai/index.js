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
  console.log('🚀🚀🚀 / prompt', prompt)
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    temperature: 0.9, // 每次返回的答案的相似度0-1（0：每次都一样，1：每次都不一样）
    max_tokens: 4000,
    top_p: 1,
    frequency_penalty: 0.0,
    presence_penalty: 0.6,
    stop: [' Human:', ' AI:'],
  })

  let choices = response.data.choices || [];
  let reply = choices[0].text;
  // const reply = markdownToText(response.data.choices[0].text)
  console.log('🚀🚀🚀 / reply', reply)
  
  return reply
}

export async function getImageReply(prompt) {
  console.log('🚀🚀🚀 / prompt', prompt)
  const response = await openai.createImage({
    model: "image-alpha-001",
    prompt,
  });


  console.log(response.data);

  let reply = response.data.data[0];
  console.log('🚀🚀🚀 / reply', reply)

  return reply
}

function markdownToText(markdown) {
  return remark()
    .use(stripMarkdown)
    .processSync(markdown ?? '')
    .toString()
}
