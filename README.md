![a-hero](https://github.com/getadaptly/adaptly/assets/42170848/7a7bdee0-5077-4c11-b7fa-de39302e8f35)


<p align="center">
<a href="https://adaptly.dev">
    <img alt="Website" src="https://img.shields.io/badge/Website-adaptly.dev-blue?link=https%3A%2F%2Fadaptly.dev">
</a>
<a href="https://docs.adaptly.dev/">
    <img alt="Docs" src="https://img.shields.io/badge/Docs-docs.adaptly.dev-blue?link=https%3A%2F%2Fdocs.adaptly.dev">
</a> 
<a href="https://discord.gg/q9VyVVckgQ">
    <img src="https://dcbadge.vercel.app/api/server/ueFdnVbW?style=flat" />
</a>
<a href="https://twitter.com/adaptly_dev">
    <img src="https://img.shields.io/twitter/url?url=https%3A%2F%2Ftwitter.com%2Fadaptly_dev" />
</a>
</p>

<br />

Next time when you update a dependency, forget about manually checking if changelogs contain breaking changes.

Adaptly will do that for you.

![b-benefits](https://github.com/getadaptly/adaptly/assets/42170848/bdd5cb6e-36d9-45bd-b67d-b09bfdadceb1)



<br />

## Try Adaptly

1. Add Adaptly to your repository by installing [Adaptly github app](https://github.com/getadaptly/adaptly).
2. Once installed, Adaptly will analyse all open Dependabot and Renovate PRs and leave PR comments to inform about breaking changes found or PRs being good to merge.
3. When a new Dependabot or Renovate PRs are open, it will analyse them automatically.

### Languages supported

<img src="https://github.com/getadaptly/adaptly/assets/42170848/8ccf6a7e-29f9-4482-8c70-e67414a3c758" width="128px">

<br />

# Local development

Table of contents:

1. [Local development setup](#local-development-setup)
2. [Running Adaptly locally](#running-adaptly-locally)
3. [Local development database](#local-development-database)
4. [Self-hosting](#self-hosting)

## Local development setup

1. Use Node.js at the version Adaptly requires:
    1. Install nvm (Node Version Manager) from [here](https://github.com/nvm-sh/nvm).
    2. Run “nvm install && nvm use” in the project root.
2. Install dependencies using “pnpm”:
    1. Adaptly uses “pnpm” as the package manager and you can install “pnpm” from [here](https://pnpm.io/installation).
    2. Run “pnpm install” at the project root.
        1. If it fails, [uninstall pnpm](https://pnpm.io/uninstall) and install it again.
3. Setup Docker containers:
    1. Install Docker desktop from [here](https://www.docker.com/products/docker-desktop/) and then start Docker.
    2. Run “docker-compose up -d” to start Docker containers.
4. Setup Doppler for environment variables:
    1. Sign up for Doppler [here](https://www.doppler.com/).
    2. Create Doppler project and config with the same names as in “doppler.yaml” in the project root.
    3. Within the Doppler config setup environment variables required by “source/env.ts”
    4. Install Doppler CLI from [here](https://docs.doppler.com/docs/install-cli).
    5. Authenticate Doppler CLI using “doppler login”
    6. Run “doppler setup” in project root.
5. Setup Local database and Prisma:
    1. Instantiate tables and run migrations using “pnpm migrate:dev”
    2. Seed database using “prisma/seed.ts” file
        1. In production Adaptly is connected to a specific repository. In development we need to simulate it, so replace “owner” and “name” in “prisma/seed.ts” by repository 
        2. Run “npx prisma db seed” to seed database with data
    3. Build prisma client “pnpm build:prisma”
    4. To learn how to view database data and apply migrations check “[Local development database](https://github.com/getadaptly/adaptly/blob/main/README.md#local-development-database)” section.

## Running Adaptly locally

1. Expose local port 3001 to the internet using ngrok by running “ngrok http 3001”
2. In GitHub app settings set “Callback URL” and “Webhook URL” to the one provided by ngrok, but for “Webhook URL” append “/webhook” at the end of it. For example “[https://78xx-82-132-200-100.ngrok-free.app/webhook](https://78dc-82-132-212-187.ngrok-free.app/webhook)”
3. Run “pnpm dev” to start Adaptly on port 3001. It’s now ready to process GitHub app requests.

## Local development database

This document provides step-by-step instructions to set up and manage your local development database using Prisma and Postgres.

1. **Start the Postgres Container**
    
    ```bash
    docker-compose up -d
    
    ```
    
2. **Instantiate Tables**
    
    Apply all pending migrations to instantiate your tables with:
    
    ```bash
    pnpm migrate:dev
    
    ```
    
3. **Seed database using** `prisma/seed.ts` file
    
    ```bash
    npx prisma db seed
    
    ```
    
4. **Build Prisma Client**
    
    Sync the Prisma client with your database using the command:
    
    ```bash
    pnpm build:prisma
    
    ```
    
5. **View Database**
    
    Open TablePlus and connect to your local Postgres database. The default user and password should be 'postgres' and connect to local host. Alternatively, you can view your local development database in your web browser by running Prisma Studio:
    
    ```bash
    pnpm prisma-studio
    
    ```
    
6. **Modify and Migrate Schema**
    
    If you make changes to your Prisma schema, create a new migration and apply it with:
    
    ```bash
    pnpm migrate:dev
    
    ```
    
    Remember to commit and push the migration files to your version control system.
    
7. **Rebuild Prisma Client**
    
    Sync the Prisma client with your updated database using the command:
    
    ```bash
    pnpm build:prisma
    
    ```
    

## Self-hosting

Adaptly uses Doppler to manage secrets. Follow steps below to setup Doppler:

1. Sign up for Doppler [here](https://www.doppler.com/).
2. Create Doppler project and config with the same names as in “doppler.yaml” in the project root.
3. Within the Doppler config setup environment variables required by “source/env.ts”
    1. The GitHub secrets (`GITHUB_ACCESS_TOKEN`, `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY`) are from [creating a GitHub app](https://docs.github.com/en/apps/creating-github-apps/setting-up-a-github-app/creating-a-github-app).

Make sure you have Docker installed before running the following commands.

You are going to need a `DOPPLER_TOKEN` that you can get by following [these](https://docs.doppler.com/docs/service-tokens) steps.

1. Build the image: `docker build -t adaptly-app .`
2. Run it: `docker run -p 3001:3001 -d -e DOPPLER_TOKEN="$DOPPLER_TOKEN" --name adaptly-container adaptly-app`

You should be able to navigate to your browser and check `localhost:3001/ping` is alive.

Once the server is running locally, you can expose it as you want, with `ngrok` or running it on any cloud providers and you can then update your GitHub app settings to point to it.

The entry webhook for the app is located at: `<YOUR_APP_URL>/webhook`.
