const request = require("request");
const fs = require("fs");
const path = require('path')



(async function main() {
  const taskId = await createTask()
  const result = await polling(() => getTaskResult(taskId))
  console.log(`result: ${JSON.stringify(result, null, 2)}`)
})()


