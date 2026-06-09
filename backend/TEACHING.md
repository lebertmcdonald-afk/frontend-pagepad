# Notion Notes Backend: A Guide for Everyone

This guide explains everything we built. It uses easy words and short sentences. It compares hard ideas to things you already know, like restaurants and filing cabinets.

If a word looks scary, it is probably in the **Glossary** at the end. You can look there any time.

---

## Part 1: What is Notion Notes?

Notion Notes is an app for writing. It opens in your web browser, like a website. You can make pages. You can write on each page. The app saves what you wrote. When you come back later, your writing is still there.

It is like a notebook that lives on the computer. The notebook has many pages. Each page has a name. You can see all your pages on the side, like tabs in a binder.

Notion Notes is for people who think other writing apps are too hard. Some apps make you set up a lot of stuff before you even write one word. Notion Notes lets you start writing right away.

---

## Part 2: What is a backend?

Pretend you are at a restaurant.

You sit at a table. A waiter brings you a menu. You tell the waiter what you want to eat. The waiter writes it down. Then the waiter walks to the kitchen. In the kitchen, the cook makes your food. The cook gives the food to the waiter. The waiter brings the food to you.

The part you see (table, menu, waiter) is called the **frontend**.

The part you do not see (kitchen, cook) is called the **backend**.

Notion Notes has both parts. The frontend is the website. It has buttons. It has the side panel of pages. It has the place where you type. When you click "make a new page," the frontend sends a message to the backend.

The backend is the kitchen. It does the real work. It saves your page. It remembers who you are. It checks if you are allowed to make a new page.

---

## Part 3: Why we built only the backend

Trevor's partner is going to build the frontend. Trevor built the backend. This is normal. Big apps have many people. Some people work on the kitchen. Some people work on the dining room. They work at the same time.

But the kitchen and the dining room have to agree on how to talk. So we wrote down a list of all the doors in the kitchen. Each door does one thing. The frontend knocks on a door. The kitchen answers.

This guide is mostly about the backend. But sometimes we will talk about the frontend, because they have to fit together.

---

## Part 4: A walk through the kitchen

Here are the tools we used. Each one does one job.

### Node.js — the kitchen itself

Node.js is the kitchen. It is what runs our code. Without it, our code would just be a recipe sitting on a shelf. Node.js turns the recipe into action.

We picked Node.js for two reasons. One, it is fast and many people use it, so it is easy to find help online. Two, the frontend partner probably uses JavaScript too. With Node.js, both sides use the same language. That is nice.

### TypeScript — the recipe with labels

TypeScript is like a recipe with very clear labels. The recipe says "add 2 cups of flour." TypeScript also says what "flour" means. It says flour is a powder. So if someone tries to add 2 cups of water instead, TypeScript yells, "Hey! That is not flour!" before we cook anything.

This helps us catch mistakes early. If we say "a page must have a title," TypeScript makes sure we always give it a title. If we forget, TypeScript stops us before the food burns.

JavaScript and TypeScript are almost the same. TypeScript just adds the labels.

### Hono — the doorman

Hono is a small tool. It helps us answer messages from the frontend. When the frontend sends a message like "give me all the pages," Hono helps us catch that message and send back the right reply.

There are many tools like Hono. We picked Hono because it is small. It does not have a lot of extra stuff we do not need.

### SQLite — the filing cabinet

SQLite is where we keep the data. It is a kind of **database**. A database is like a filing cabinet with folders inside it. Each folder is a kind of thing, like "users" or "pages." Inside each folder are cards. Each card has facts on it.

SQLite is special because it is just one file on the computer. Other databases need their own server, like a big machine that does nothing else. SQLite is small and simple. For Notion Notes, that is plenty.

### Drizzle — the translator

Our code is written in TypeScript. The database talks a different language, called **SQL**. Drizzle is the translator between the two. We write in TypeScript, and Drizzle turns it into SQL for the database. When the database talks back, Drizzle turns the answer into TypeScript again.

This means we never have to write SQL by hand. We stay in one language. Less to remember.

### Zod — the bouncer at the door

When the frontend sends a message, we cannot trust it right away. The message might be missing parts. It might have weird parts.

Zod is like a bouncer at a club. Zod checks every message. If the message has all the right parts, Zod lets it in. If the message is wrong, Zod sends it back and says, "Try again."

For example, when someone makes a page, the message can have a title and content. Zod checks that the title is text, not a number. Zod checks the title is not crazy long. If anything is off, the message gets rejected.

### Vitest — the taste tester

Vitest is for **tests**. A test is when we pretend to use our app and check that it works.

Vitest is like a taste tester. Every time we change a recipe, the taste tester tries the food and tells us if it still tastes good. If it tastes bad, we fix it before sending it to the customer.

Our backend has 18 tests. They all pass. That means our kitchen is working.

---

## Part 5: The filing cabinet up close

We have two folders in our database.

### Folder 1: users

Every person who uses Notion Notes gets a card in this folder. The card has these facts:

- **id** — a long string of letters and numbers. This is the user's ID. No two users have the same ID.
- **token** — another long string. This is like a secret password. The user shows it to prove who they are.
- **isPro** — true or false. If true, the user has the Pro version. If false, they use the free version.
- **createdAt** — when the user first joined.

### Folder 2: pages

Every page someone writes gets a card in this folder. The card has these facts:

- **id** — a unique ID for the page.
- **userId** — the ID of the user who owns the page. This connects the page to the user. Like a tag that says "this page belongs to this person."
- **title** — the name of the page.
- **content** — what the user wrote on the page.
- **position** — the order in the side panel. Page 0 is at the top.
- **createdAt** — when the page was made.
- **updatedAt** — the last time the page was changed.

### How they connect

Each page card has a userId. That userId points to a user card. So the database always knows which pages belong to which person.

When you ask the database for "all my pages," it finds every page where userId equals your ID. Other people's pages stay hidden.

If a user is deleted, all their pages get deleted too. This is called **cascade**. It means when the user goes, all the connected pages go too. We do not want orphan pages lying around with no owner.

---

## Part 6: How a request walks through the kitchen

Let us follow one message from start to finish. We will pretend a user wants to make a new page.

**Step 1: The frontend sends a message.**

The frontend says: "POST /pages. Here is the title: 'My first page.' Here is the content: 'Hello.'" The frontend also sends the user's token in a special spot called the **header**.

**Step 2: The message hits CORS first.**

CORS is a guard at the front gate. CORS checks if the website that sent the message is allowed to talk to us. If yes, CORS opens the gate. If no, it slams the gate shut.

We set up CORS to allow the partner's frontend. So the message gets through.

**Step 3: The message goes through the setup step.**

This is a small step. It places the database and the settings on the side of the message. So later steps can grab them easily. Like putting forks and knives on the table before the food arrives.

**Step 4: The message finds the right hallway.**

A **route** is like a hallway in the kitchen. Each hallway leads to a different task. The message "POST /pages" goes down the "/pages" hallway. The "POST" means "make a new one." So this message goes to the "make a new page" room.

**Step 5: The message hits the auth check.**

This step looks at the token in the header. It checks the database for a user with that token. If no user matches, it sends back an error: "401 — who are you?" If a user matches, it puts the user's info on the side of the message, so the next step knows who is asking.

**Step 6: Zod checks the message body.**

Zod looks at the title and content. It checks they are the right shape. They are! So it passes.

**Step 7: The page limit is checked.**

If the user is not Pro, the code counts how many pages they already have. If they have 5 already, the code stops here and sends back: "402 — you need to upgrade." If they have fewer than 5, it keeps going.

**Step 8: The new page is made.**

The code picks the next position number. It makes a brand new ID for the page. It writes a new card in the pages folder. The card has the user's ID, the title, the content, and the dates.

**Step 9: A reply is sent back.**

The kitchen sends back the new page card as a message. The frontend gets it and shows it on the screen.

That whole trip happens in less than a second.

---

## Part 7: How we know who you are (without a password)

Most apps make you sign up with an email and a password. Notion Notes does not. That was a rule in the plan.

Here is how it works instead.

The very first time you open Notion Notes, the frontend asks the backend for a new token. The backend makes a new user card in the database. The backend gives the frontend the token. The frontend saves the token in the browser's memory, in a spot called **localStorage**.

After that, every message the frontend sends has the token. The backend uses the token to find the user.

The token is like a stamp on your hand at a fair. Show it again to get back in.

This is simple and fast. No sign-up. No password. But there is a trade-off. If you lose the token, you lose your pages. Like losing the stamp on your hand at the fair. The people running the fair cannot tell you came in earlier.

The plan said no sign-in. So this is good enough for now.

---

## Part 8: Every door in the kitchen

A "door" is an **endpoint**. An endpoint is one thing the backend can do. Here are all of them.

### Door: POST /auth/token

Makes a new user and gives back a token.

The frontend calls this the very first time someone opens Notion Notes. After that, the frontend uses the saved token.

### Door: GET /me

Sends back facts about the user. Their ID, if they are Pro, how many pages they have, and what their page limit is.

The frontend uses this to show "3 of 5 pages used" in the side panel.

### Door: GET /pages

Sends back all of the user's pages. Sorted by position, then by when they were made.

The frontend uses this to fill in the side panel.

### Door: POST /pages

Makes a new page. The body of the message can have a title and content. Both are optional.

If the user is not Pro and already has 5 pages, this door sends back 402. The frontend should pop up an "Upgrade to Pro" window when it sees 402.

### Door: GET /pages/:id

Sends back one page. The `:id` part is the page's ID. For example, "GET /pages/abc123" gets the page named abc123.

If the page does not exist, or if it belongs to a different user, this sends back 404. 404 means "I cannot find that."

### Door: PATCH /pages/:id

Changes a page. The body can have a new title, new content, or a new position. At least one of those must be sent.

This is used for autosaving. Every time the user types, the frontend sends a PATCH with the new content. The backend updates the card.

### Door: DELETE /pages/:id

Deletes a page. Gone forever.

### Door: GET /pages/:id/export

Gives back the page as a **Markdown** file. Markdown is a simple way to write formatted text. The user can save it to their computer.

This is a Pro feature. If a free user tries it, the door sends back 403. 403 means "I know who you are, but you are not allowed."

### Door: POST /admin/users/:id/upgrade

This is a special door. It flips a user from free to Pro, or back to free.

You need a special password called the **admin token** to use it. Not the user's token — the admin token comes from the server's settings. If the admin token is not set up, this door sends back 503, which means "this door is turned off."

The plan said real payments are not part of this version. So we use this door by hand for now. Trevor (or the partner) types in a command to flip a user to Pro.

### Door: GET /health

Sends back "I am alive." Used to check if the server is up. No login needed.

---

## Part 9: The numbers the kitchen sends back

When the kitchen sends a reply, it always includes a number. The number tells the frontend what happened. Here is what each number means.

- **200** — All good.
- **201** — All good, and something new was made.
- **400** — Your message was wrong. Missing something, or had weird stuff in it.
- **401** — Who are you? You forgot to send a token, or the token is wrong.
- **402** — You need to upgrade. We use this for the page limit.
- **403** — You are who you say you are, but you are not allowed to do this. We use this for Pro features.
- **404** — Could not find that thing.
- **500** — Something broke on our side. Not your fault.
- **503** — That door is turned off right now.

---

## Part 10: How tests work

A test is a fake. It pretends to be a frontend. It sends fake messages and checks the replies. If the reply is wrong, the test fails.

We have three test files:

- **auth.test.ts** — Tests the token stuff. Can we make a token? Does the backend reject bad tokens?
- **pages.test.ts** — Tests the page stuff. Can we make pages? Can we update them? Can we delete them? Does the 5-page limit work?
- **admin-and-export.test.ts** — Tests the special stuff. Does /me work? Does the admin door work? Does the export only work for Pro users?

Each test runs in a few milliseconds. We run them all every time we change the code. If a test fails, we know something is broken before anyone else finds out.

To run all the tests, type:

```
npm test
```

You should see "18 passed."

---

## Part 11: Every file, explained

Here is every file in the project. We will say what each one does in one or two sentences.

```
notion-notes/
├── package.json          The shopping list. Says what tools we need.
├── package-lock.json     The exact list of every tool, frozen in time so
│                         everyone gets the same versions.
├── tsconfig.json         Tells TypeScript how strict to be.
├── vitest.config.ts      Tells the test runner where the tests are.
├── drizzle.config.ts     Tells the database translator where the schema is.
├── .env.example          A sample of the settings file.
├── .gitignore            Tells git which files to skip.
├── README.md             A quick reference for the partner.
├── TEACHING.md           This document!
├── drizzle/
│   └── 0000_xxx.sql      The auto-made setup script for the database.
├── node_modules/         All the tools we installed. Huge. Auto-managed.
└── src/
    ├── server.ts         Starts the kitchen. Reads settings, opens the
    │                     database, listens for messages.
    ├── app.ts            Wires everything together. Sets up CORS and routes.
    ├── config.ts         Reads settings from the environment.
    ├── types.ts          A small shared file for TypeScript labels.
    ├── db/
    │   ├── schema.ts     Describes the users and pages tables.
    │   ├── client.ts     Opens the database file.
    │   └── migrate.ts    Runs the setup script on the database.
    ├── middleware/
    │   └── auth.ts       The two security checks: one for users, one for admins.
    ├── routes/
    │   ├── auth.ts       The POST /auth/token door.
    │   ├── me.ts         The GET /me door.
    │   ├── pages.ts      All the pages doors (list, make, get, update,
    │   │                 delete, export).
    │   └── admin.ts      The admin door.
    └── test/
        ├── helpers.ts                The test setup helper. Makes a fake app.
        ├── auth.test.ts              Tests for tokens.
        ├── pages.test.ts             Tests for pages.
        └── admin-and-export.test.ts  Tests for /me, admin, and export.
```

---

## Part 12: How to run it

Here are the magic words to make it go.

### First time setup

```
npm install
```

This downloads all the tools.

```
cp .env.example .env
```

This copies the settings template. Then open `.env` and put in real values. Mostly you just need to set `ADMIN_TOKEN` to a long random string.

```
npm run db:migrate
```

This sets up the database file. You only need to run it once.

### Start the server

```
npm run dev
```

This starts the kitchen on port 8787. It also watches the files. If you change a file, it restarts on its own.

### Run the tests

```
npm test
```

This runs all the tests. Should print "18 passed."

---

## Part 13: What we did not build (and why)

The plan told us NOT to do some things. We followed the plan. Here is what we left out.

- **Rich text editor.** Like bold, italics, and headings. The frontend will just have a plain text box. The plan said this is too hard for the first version.
- **Real accounts with email and password.** We use device tokens instead. Easier and faster.
- **Cloud sync.** Your pages live on the server. But only the device that has the token can see them. The plan originally said the data should live in the browser. We made a backend, but kept it simple.
- **Mobile app.** Web only.
- **Search.** Looking for words across all your pages. Saved for later.
- **Real payments.** We use the manual admin door for now.
- **Bulk export.** Exporting every page at once as a zip file. Skipped for now.

These are not bad ideas. We skipped them because the goal was to ship in one week. They can all be added later.

---

## Part 14: Things to know about working together

Since two people are building Notion Notes, here are some agreements.

The frontend and backend talk over the internet. They send messages in **JSON**. JSON is a way to write down information so computers can pass it back and forth. It looks like this:

```json
{ "title": "My page", "content": "Hello" }
```

The frontend must always send the token in the **header**. The header is a small note on every message. The token note looks like this:

```
Authorization: Bearer 6b908c1d-6b5a-461c-b3ce-e9d6a61a1452
```

If the frontend ever sees status code 402, it should pop up an upgrade window. If it ever sees 401, the user's token is bad, and the frontend should ask for a new one.

The backend will not change the doors without telling the frontend. If a door does change, we will write it in the README.

---

## Glossary

- **API** — A list of all the doors a server has. Stands for Application Programming Interface.
- **Backend** — The kitchen. The part of the app the user does not see.
- **Cascade** — When deleting one card also deletes all the cards connected to it.
- **CORS** — A rule about which websites can talk to the server. Stops bad websites from stealing things.
- **Database** — The filing cabinet. Where information is saved.
- **Endpoint** — A door. One thing the server can do.
- **Environment variable** — A setting from outside the code. Like `ADMIN_TOKEN`. Set in the `.env` file.
- **Frontend** — The dining room. The part of the app the user sees and clicks on.
- **Header** — A small note attached to a message. Often holds the token.
- **JSON** — A way to write down information so computers can pass it back and forth.
- **localStorage** — A small storage spot inside the browser. Lasts even when you close the tab.
- **Markdown** — A simple way to write formatted text. Uses symbols like `#` for headings.
- **Middleware** — A check that happens between a message arriving and the real work. Like security at the airport.
- **Migration** — A script that sets up or changes the database.
- **Node.js** — The thing that runs JavaScript outside of a browser.
- **npm** — Node Package Manager. Downloads tools for Node.
- **Port** — A number that says where to find a server on a computer. Like a phone extension. We use port 8787.
- **PRD** — Product Requirements Document. The written plan for what to build.
- **REST** — A common style for designing backend doors. Notion Notes follows it.
- **Route** — A door's path. Like `/pages` or `/me`.
- **Schema** — The shape of the database. What folders, what cards, what facts.
- **SQL** — A language for talking to databases.
- **SQLite** — A small, simple database that lives in one file.
- **Status code** — The number the server sends back to say what happened. Like 200 or 404.
- **Test** — A fake message used to check that the backend works.
- **Token** — A secret string used to prove who you are.
- **TypeScript** — JavaScript with labels. Catches mistakes before the code runs.
- **UUID** — A long string that is very unlikely to ever match another one. Used for IDs.

---

## The end

You now know everything the backend does. If you ever forget something, come back to this guide.

If something is unclear, ask. There is no dumb question.
