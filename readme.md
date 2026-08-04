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

moveToken
roomCode exists?

↓

Find game

↓

Game exists?

↓

Game is playing?

↓

Is it your turn?

↓

Have you rolled the dice?

↓

Does this token belong to you?

↓

Is this token movable?

↓

Move it

↓

Reached 58?

↓

Captured someone?

↓

Dice == 6?

↓

Next turn or same turn?

↓

currentDiceValue = null

↓

Save

///////////////////////////////////////////////////////////////////////////////

