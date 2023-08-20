import pool from './pool'

const tagsTableName = '"T6_Tags"'
const messagesTableName = '"T6_Messages"'
const messageTagsTableName = '"T6_Messages_Tags"'

const selectTags = async (prefix?: string): Promise<Array<string>> => {
    const sql = `SELECT ARRAY_AGG(text) FROM ${tagsTableName}
    WHERE starts_with(text, $1)`
    const result = await pool.query(sql, [prefix || ''])
    return result.rows[0].array_agg || []
}

const selectMessageIds = async (tags: Array<string>, after?: string): Promise<Array<number>> => {
    const startDate = after || '2023-01-01T00:00:00.000Z'
    const sql = `SELECT array_agg(DISTINCT messages.id)
    FROM ${messagesTableName} messages
    LEFT JOIN (
        SELECT mt.message_id AS message_id, tags.text AS tag_text
        FROM ${messageTagsTableName} mt
        LEFT JOIN ${tagsTableName} tags
        ON mt.tag_id = tags.id
    ) tags
    ON tags.message_id = messages.id
    WHERE (tags.tag_text ISNULL
    OR tags.tag_text = ANY($1::varchar[]))
    AND messages.created_at > ($2::timestamptz + '1 ms'::interval)`
    const result = await pool.query(sql, [tags, startDate])
    return result.rows[0].array_agg
}

const selectMessageContents = async (ids: Array<number>): Promise<Array<Message>> => {
    const sql = `SELECT id, messages.text, created_at AS timestamp,
        COALESCE(tags.tag_array, array[]::varchar[]) AS tags,
        TO_CHAR(created_at, 'dd.mm HH24:MI') AS date
    FROM "T6_Messages" messages
    LEFT JOIN (
        SELECT mt.message_id AS id, array_agg(tags.text) AS tag_array
        FROM "T6_Messages_Tags" mt
        JOIN "T6_Tags" tags ON mt.tag_id = tags.id
        GROUP BY mt.message_id
    ) tags USING (id)
    WHERE id = ANY($1::integer[])
    ORDER BY created_at ASC`
    const result = await pool.query(sql, [ids])
    return result.rows
}

const selectMessages = async (tags: Array<string>, after?: string): Promise<Array<Message>> => {
    const messageIds = await selectMessageIds(tags, after)
    const messages = await selectMessageContents(messageIds)
    return messages
}

// INSERT INTO "T6_Messages_Tags" (tag_id, message_id) VALUES (1, 1), (2, 1);

const insertTags = async (tags: Array<string>) => {
    const sql = `INSERT INTO ${tagsTableName} (text)
    SELECT UNNEST($1::varchar[]) as text
    ON CONFLICT DO NOTHING`
    await pool.query(sql, [tags])
}

const getTagIds = async (tags: Array<string>): Promise<Array<number>> => {
    const sql = `SELECT array_agg(id) FROM ${tagsTableName}
    WHERE text = ANY($1::varchar[])`
    const result = await pool.query(sql, [tags])
    return result.rows[0].array_agg
}

const insertMessage = async (text: string): Promise<number> => {
    const sql = `INSERT INTO ${messagesTableName} (text)
    VALUES ($1) RETURNING id`
    const result = await pool.query(sql, [text])
    return result.rows[0].id
}

const insertMessageTags = async (messageId: number, tagIds: Array<number>) => {
    const sql = `INSERT INTO ${messageTagsTableName}
    (message_id, tag_id)
    SELECT $1, UNNEST($2::integer[])`
    await pool.query(sql, [messageId, tagIds])
}

const createMessage = async (text: string, tags: Array<string>) => {
    const messageId = await insertMessage(text)
    if (!tags || !tags.length) return
    await insertTags(tags)
    const tagIds = await getTagIds(tags)
    await insertMessageTags(messageId, tagIds)
}

export default {
    selectTags,
    selectMessages,
    createMessage
}