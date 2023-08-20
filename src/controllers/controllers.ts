import { RequestHandler } from "express"
import db from '../queries/queries'

const getTags: RequestHandler = async (req, res) => {
    const prefix = req.body.prefix as string | undefined
    const tags: Array<string> = await db.selectTags(prefix)
    res.json(tags)
}

const getMessages: RequestHandler = async (req, res) => {
    const { tags, after } = req.body as { tags: Array<string>, after?: string }
    const messages = await db.selectMessages(tags, after)
    res.status(200).json(messages)
}

const postMessage: RequestHandler = async (req, res) => {
    const { text, tags } = req.body as {text: string, tags: Array<string>}
    if (!text) {
        res.status(400).end()
    }
    await db.createMessage(text, tags)
    res.status(200).end()
}

export default {
    getTags,
    getMessages,
    postMessage
}