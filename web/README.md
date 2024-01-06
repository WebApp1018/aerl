# Web Interface

## Getting Started

First, run the development server:

```bash
yarn dev
```

Log in using the test user with the email `example@aerl.cloud` and password `password`.

Then open [http://localhost:3000](http://localhost:3000) with your browser.

## Run Production-like environment locally

1. Export the environemnt variables in your `.env.local`
2. Run `yarn build` to build the production artefacts
3. Run `node .next/standalone/server.js` to start the server.
