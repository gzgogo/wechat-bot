import tencentcloud from 'tencentcloud-sdk-nodejs-tms'
import dotenv from 'dotenv'

const env = dotenv.config().parsed // 环境参数

function _checkTextModeration(txtInput) {
  const TmsClient = tencentcloud.tms.v20201229.Client
  let base64 = Buffer.from(txtInput).toString('base64') // 对编码的字符串转化base64

  // 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey
  // 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取
  const clientConfig = {
    credential: {
      secretId: env.TEXT_MODERATION_SECRETID,
      secretKey: env.TEXT_MODERATION_SECRETKEY,
    },
    region: 'ap-beijing',
    profile: {
      httpProfile: {
        endpoint: 'tms.tencentcloudapi.com',
      },
    },
  }

  // 实例化要请求产品的client对象,clientProfile是可选的
  const client = new TmsClient(clientConfig)
  const params = {
    Content: base64, //策略库
    BizType: '',
  }
  let re = client.TextModeration(params).then(
    (data) => {
      console.log(data)
      return Promise.resolve(data.Suggestion)
    },
    (err) => {
      console.error('error', err)
      return Promise.reject(err)
    },
  )
  return re
}

async function checkTextModeration(input) {
  const result = (await _checkTextModeration(input)) || {}
  return result === 'Pass'
}

export { checkTextModeration }
