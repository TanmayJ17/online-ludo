npm init -y
npm install express mongoose dotenv cors cookie-parser bcryptjs jsonwebtoken

///////////////////////////////////////////////////////////////////////////////

game model schema
Game
│
├── roomCode
├── host
├── status
├── currentTurnIndex
├── players[]
│      │
│      ├── user
│      ├── color
│      ├── rank
│      └── tokens[]
│              │
│              ├── number
│              └── boardPosition
│
├── createdAt
└── updatedAt

///////////////////////////////////////////////////////////////////////////////

generateRoomCode:-

Generate code
      │
      ▼
Exists in DB?
      │
 ┌────┴────┐
 │         │
Yes       No
 │         │
Generate   Create Room
Again

///////////////////////////////////////////////////////////////////////////////