import createFastify from "fastify"
import fastifyStatic from "@fastify/static"
// import path from "path"
import { lookup } from "./webnative.js"


const fastify = createFastify()


fastify.register(fastifyStatic, {
  root: new URL("./public", import.meta.url).pathname
})


fastify.get("/", async (request, reply) => {
  reply.type("text/html")
  
  const pictures = await lookup()
  const picturesHTML = pictures.map(url => `
    <img src="${url}" width="400" /><br />
  `.trim()).join("")
  
  return `<div>${picturesHTML}</div>`
})


fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`)
  }
)
