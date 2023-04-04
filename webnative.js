import * as wn from "webnative"
import * as BrowserCrypto from "webnative/components/crypto/implementation/browser"
  
import { PublicFile } from "webnative/fs/v1/PublicFile"
import { PublicTree } from "webnative/fs/v1/PublicTree"
import { getSimpleLinks } from "webnative/fs/protocol/basic"

import "./fetch-polyfill.js"


const USERNAME_TO_LOOKUP = "icidasset"


export async function lookup() {
  const config = {
    namespace: "public-data-viewer",
    debug: true
  }
  
  // Components
  const crypto = createCryptoComponent()
  const depot = createDepotComponent()
  const storage = wn.storage.memory()
  
  const fissionComponents = await wn.compositions.fission({
    ...config,
    crypto,
    storage,
  })
  
  const componentsWithCustomDepot = {
    ...fissionComponents,
    depot
  }
  
  // Create program
  const program = await wn.assemble(
    config,
    componentsWithCustomDepot
  )
  
  const { reference } = program.components
  const cid = await reference.dataRoot.lookup(USERNAME_TO_LOOKUP)
  
  const publicCid = (await getSimpleLinks(depot, cid)).public.cid
  const publicTree = await PublicTree.fromCID(depot, reference, publicCid)

  const links = Object.values(await publicTree.ls(
    wn.path.unwrap(wn.path.directory("Unsplash")) // [ "Unsplash" ]
  ))

  // Render pictures
  return await Promise.all(
    links.map(async picture => {
      const file = await PublicFile.fromCID(depot, picture.cid)
      return `https://ipfs.runfission.com/ipfs/${picture.cid.toString()}/userland`
      
      // Alternatively you can get the content from the file and convert it in a data URI
    })
  )
}



// Node.js Components


function boom() {
  throw new Error("Method not implemented")
}


function createCryptoComponent() {
  const {
    aes,
    did,
    hash,
    misc,
    rsa,
  } = BrowserCrypto
  
  return {
    aes,
    did,
    hash,
    misc,
    rsa,
    
    // We're avoiding having to implement all of this,
    // because we're not using it anyway.
    // ---
    // One way to actually implement this would be to
    // set up the keystore-idb library to use an in-memory
    // store instead of indexedDB. There's an example in
    // the Webnative tests.
    keystore: {
      clearStore: boom,
      decrypt: boom,
      exportSymmKey: boom,
      getAlgorithm: boom,
      getUcanAlgorithm: boom,
      importSymmKey: boom,
      keyExists: boom,
      publicExchangeKey: boom,
      publicWriteKey: boom,
      sign: boom,
    }
  }
}


function createDepotComponent() {
  const ipfsGateway = `https://ipfs.runfission.com`
  
  function ipfs(path) {
    return fetch(`${ipfsGateway}${path}`)
      .then(r => r.arrayBuffer())
      .then(r => new Uint8Array(r))
  }
  
  return {
    // Get the data behind a CID
    getBlock: async cid => {
      return ipfs(`/api/v0/block/get?arg=${cid.toString()}`)
    },
    getUnixFile: async cid => {
      return ipfs(`/api/v0/cat?arg=${cid.toString()}`)
    },
    
    // We're avoiding having to implement all of this,
    // because we're not using it anyway.
    getUnixDirectory: boom,
    putBlock: boom,
    putChunked: boom,
    size: boom,
  }
}
