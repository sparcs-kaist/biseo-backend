# biseo_sso_server

### Prerequisites

**Redis**

We expect REDIS server to be running on it's specific port\(3001\).
```bash
redis-server --daemonize yes --port 3001
```

**Environment Secrets**

List of environment variables required are specified in [here](https://github.com/sparcs-kaist/biseo_backend/blob/master/config/.env.example)

You can find proper values for those [here](https://wiki.sparcs.org/w/index.php/%EC%8A%A4%EB%B9%84%EC%84%9C)

In order to get a new SSO client id and secrets, refer [SPARCS SSO Dev Center](https://sparcssso.kaist.ac.kr/dev/main/)

**!important: Please be extra careful not to upload any kind of secrets on github.**

### Getting Started

#### Running Development Server

```text
You need Mongodb and Redis running on your local machine before running our server.
Please check *prerequisites*(#prerequisites) to find out more
```

**npm**

Run server

```bash
npm install // Installing dependencied with node js package manager
npm run start // Run development server with nodemon watching ./src folder
```
