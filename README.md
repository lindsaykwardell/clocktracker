# ClockTracker

ClockTracker is a web application for recording games of Blood on the Clocktower. It is a platform where players can save details about their games, see their statistics, and share them with friends.

The following content will help with setting up the core application for local development. If you want to run the Discord bot, you will need to refer to the code in the `/discord` folder.

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install
```

### Supabase

ClockTracker uses Supabase for user authentication, and it's convenient to use the Supabase local setup for database development. Set up Supabase:

```bash
npx supabase start
```

Note the database URL, Supabase URL, and the anonymous key. You will need them for setting up environment variables.

### Enviroment Variables

Create a `.env` file in the root folder with the following keys:

```bash
DATABASE_URL= # The URL for the Postgres database
DIRECT_DATABASE_URL= # For local purposes, the same URL as `DATABASE_URL`. 
SUPABASE_URL= # the Supabase URL
SUPABASE_KEY= # the Supabase anon key
# Optional keys:
KOFI_TOKEN= # KoFi authorization token. This can be mocked for testing, you just need to know your own key.
BSKY_PASSWORD= # Bluesky account password. Only required for testing posting to Bluesky.
DISCORD_BOT_TOKEN= # Discord bot token for signing in the Discord bot client. 
BUGSNAG_API_KEY= # API key for Bugsnag (disabled in development by default)
```

### DATABASE

Database management is handled using Prisma. To set up the local database with seed data:

```bash
npx prisma migrate dev # Deploy migrations to the database
npx prisma db seed # Add seed data to the database
```

If you need to reset the database, run:

```bash
npm run db:reset
```

After the database has been seeded, the default user login credentials will be displayed.

```bash
Login details:
    
Email: dev@clocktracker.app
Password: password123
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

You can then log in with the created user credentials and start developling!

NOTE: Currently, it is not possible to configure file uploads for local development. This is just because it hasn't been a problem yet, but if you're wanting to work on that, let me know and we can collaborate on making that section of code more modular.
