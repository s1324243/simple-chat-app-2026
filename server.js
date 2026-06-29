require('dotenv').config();

const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

app.post('/api/', async (req, res) => {
  try {
    const { artist, venue, departure, budget } = req.body;

    const prompt = `
以下のJSON形式のみで回答してください。

{
  "artist":"",
  "transport":"",
  "hotel":"",
  "schedule":[
    {
      "time":"",
      "plan":""
    }
  ]
}

推し: ${artist}
ライブ会場: ${venue}
出発地: ${departure}
予算: ${budget}円

ライブ遠征プランを作成してください。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const result = response.choices[0].message.content;
console.log(result);

const clean = result
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

res.json(JSON.parse(clean));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});
io.on('connection', (socket) => {
  socket.on('user connected', (clientId) => {
    socket.clientId = clientId;
    console.log(clientId + ' connected');
    socket.emit('welcome', clientId);
    socket.broadcast.emit('user joined', clientId);
  });
  socket.on('chat message', (msg) => {
    io.emit('chat message', {
      ...msg,
      timestamp: Date.now()
    });
  });

  socket.on('join', (room) => {
    socket.join(room);
  });

  socket.on('sensor', (data) => {
    socket.to('game').emit('sensor', data);
  });

  socket.on('disconnect', () => {
    if (socket.clientId) {
      io.emit('user left', socket.clientId);
    }
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
