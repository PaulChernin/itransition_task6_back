import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import router from './routes/router'
import morgan from 'morgan'

const port = 4000
const app = express()
app.use(cors({
    origin: true,
    credentials: true
}))

app.use(
    morgan(
        "[:date[iso]] :remote-addr :method :url",
        {
            immediate: true
        }
    )
)

app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({
//     extended: true
// }))

app.use(router)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})