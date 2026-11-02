# RidAgain.com

RidAgain is a lightweight book marketplace starter for Bangladesh. It uses only Node.js built-in modules, so there are no native add-ons such as `better-sqlite3`.

## Features
- Responsive Bangla-first marketplace homepage
- Search by title, author and keyword
- Category and condition filters
- Signup/login with salted scrypt password hashing
- Seller book listing and seller's own book list
- Buyer order requests
- JSON file persistence
- Render deployment configuration for a free demo deployment

## Run locally
1. Install Node.js 20 or newer.
2. In this folder run `npm start`.
3. Open http://localhost:3000

No `npm install` is required because the server has no external dependencies.

## Deploy on Render
1. Push this folder to a new GitHub repository.
2. In Render choose **New + → Blueprint** and select the repository.
3. Render reads `render.yaml`; create the web service.
4. Add a strong `SESSION_SECRET` environment variable in Render.
5. Deploy. The free service uses temporary storage; data may reset when the service restarts or redeploys. For a real public marketplace, connect a persistent database before launch.

## Important before public launch
This is a working MVP/starter, not a fully production-hardened commerce platform. It does not process online payments, provide in-app chat, verify sellers, or arrange courier delivery. Buyers submit an order request; buyer and seller must agree on payment and delivery outside the platform. Add rate limiting, email verification, moderation/reporting, image upload storage, backups, database migrations, HTTPS/domain configuration and a proper privacy/terms flow before a large public launch. The included JSON store is suitable for a small demo, not high traffic or concurrent writes.

## Data
Set `DATA_DIR` to a writable directory if needed. The included Render blueprint is intended for a free demo and does not provide persistent storage.
