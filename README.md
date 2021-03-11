# SPARCS Biseo Backend (WIP)

## About

SPARCS Biseo project aims to serve as an internal tool to manage various tasks within SPARCS, especially those related to end-of-semester meetings such as creating votes, voting, chatting, and etc.

## Getting Started

To get started, first clone this repository using `git clone`. Then install dependencies using `npm install`.

### Prerequisites

**Redis**

We expect a Redis server to be running. To specify its host and port, please refer to the `.env` file.

**MongoDB**

We also expect MongoDB to be running, at port 27017(default port). To specify its host, please refer to the `.env` file.

### Environment Variables

This project makes use of environment variables for variable API endpoints. Please refer to `.env.example` for the variables that must be filled out, and create an `.env` file _with the same format_ at the project root.

```bash
$ cp .env.example .env  # copy the template to .env
$ vim .env              # open .env with your favorite editor
```

In order to get a new SSO client id and secret pair, please refer to the [SPARCS SSO Dev Center](https://sparcssso.kaist.ac.kr/dev/main/)

**!important: Please be extra careful not to upload any kind of secrets on github.**

#### Running the Development Server

After you have Redis and MongoDB instances to connect to, and have filled in the appropriate environment variables, you can run:

```bash
npm run dev # run dev server with nodemon
```

## Building the Project

For a production build of the project, run:

```bash
npm run build
```

To run the production build, run:

```bash
npm run prod
```
