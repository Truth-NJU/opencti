# Platform development

## 1.Introduction
This summary should give you a detailed setup description for initiating the OpenCTI setup environment 
necessary for developing on the OpenCTI platform, a client library or the connectors. 
This page document how to set up an "All-in-One" development **environment** for OpenCTI. 
The devenv will contain data of 3 different repositories:

- Platform: [https://github.com/OpenCTI-Platform/opencti](https://github.com/OpenCTI-Platform/opencti)
- Connectors: [https://github.com/OpenCTI-Platform/connectors](https://github.com/OpenCTI-Platform/connectors)
- Client python: [https://github.com/OpenCTI-Platform/client-python](https://github.com/OpenCTI-Platform/client-python)

### 1.1 Platform
Contains the platform OpenCTI project code base:

- docker-compose (docker or podman) `~/opencti/opencti-platform/opencti-dev`
- Web frontend (nodejs / react) `~/opencti/opencti-platform/opencti-graphql`
- Backend (nodejs) `~/opencti/opencti-platform/opencti-frontend`
- Worker (nodejs / python) `~/opencti/opencti-worker`

### 1.2 Connectors
Contains a lot of developed connectors, as a source of inspiration for your new connector.

### 1.3 Client python
Contains the source code of the python library used in worker or connectors.

## 2. Prerequisites

Development stack require some base software that need to be installed.

### 2.1 Docker or podman

Platform dependencies in development are deployed through container management, so you need to install a container stack.

We currently support docker and postman.

```bash
$ sudo apt-get install docker docker-compose curl
```

As OpenCTI has a dependency to ElasticSearch, you have to set the *vm.max_map_count* before running the containers, as mentioned in the [ElasticSearch documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#docker-cli-run-prod-mode).
在mac中可以将`vm.max_map_count=262144`放入`/etc/sysctl.conf` 文件即可

```bash
$ sudo sysctl -w vm.max_map_count=262144
```

### 2.2 NodeJS and yarn

The platform is developed on nodejs technology, so you need to install node and the yarn package manager.

node的版本需要大于16.0。

以下是在ubuntu上安装node和yarn，mac的可以自行百度。

```bash
$ sudo apt-get install nodejs
$ sudo curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ sudo echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt-get update && sudo apt-get install yarn
```

### 2.3 Python runtime

安装python3.8

## 3.Clone the projects

Fork and clone the git repositories

- [https://github.com/OpenCTI-Platform/opencti/](https://github.com/OpenCTI-Platform/opencti/) - frontend / backend
- [https://github.com/OpenCTI-Platform/connectors](https://github.com/OpenCTI-Platform/connectors) - connectors
- [https://github.com/OpenCTI-Platform/docker](https://github.com/OpenCTI-Platform/docker) - docker stack
- [https://github.com/OpenCTI-Platform/client-python/](https://github.com/OpenCTI-Platform/client-python/) - python client

## 4. Dependencies containers

In development dependencies are deployed trough containers.
A development compose file is available in `~/opencti/opencti-platform/opencti-dev`

```bash
cd ~/opencti/opencti-platform/opencti-dev
#Start the stack in background
docker-compose -f docker-compose.yml up -d
```

You have now all the dependencies of OpenCTI running and waiting for product to run.

上述命令会下载redis、minio、es、rabbitmq等所需的镜像。

## 5. Backend / API

### 5.1 Python virtual env

The GraphQL API is developed in JS and with some python code. 
As it's an "all-in-one" installation, the python environment will be installed in a virtual environment.

```bash
cd ~/opencti/opencti-platform/opencti-graphql
python3 -m venv .venv --prompt "graphql" # 相当于pycharm中的venv
source .venv/bin/activate
pip install --upgrade pip wheel setuptools
yarn install
yarn install:python 
deactivate
```

`yarn install:python` 的时候可能会出现`git+https://github.com/OpenCTI-Platform/client-python@master`无法pip install的相关的问题，参考 https://blog.csdn.net/weixin_44386956/article/details/131379943 将网址改成 `git+https://gitclone.com/github.com/OpenCTI-Platform/client-python@master`

### 5.2 Development configuration

The API can be specifically configured with files depending on the starting profile.
By default, the default.json file is used and will be correctly configured for local usage **except for admin password**

So you need to create a development profile file. You can duplicate the default file and adapt if for you need.
```bash
cd ~/opencti/opencti-platform/opencti-graphql/config
cp default.json development.json
```

At minimum adapt the admin part for the password and token.
```json
    "admin": {
      "email": "admin@opencti.io",
      "password": "MyNewPassord",
      "token": "UUID generated with https://www.uuidgenerator.net"
    }
```

### 5.3 Install / start

在启动后端前需要先启动在第4节中安装的docker容器

Before starting the backend you need to install the nodejs modules

```bash
cd ~/opencti/opencti-platform/opencti-graphql
yarn install
```

Then you can simply start the backend API with the yarn start command

```bash
cd ~/opencti/opencti-platform/opencti-graphql
yarn start
```

在运行`yarn start`时可能会遇到如下报错：

```bash
Could not find platform independent libraries <prefix>
Could not find platform dependent libraries <exec_prefix>
Consider setting $PYTHONHOME to <prefix>[:<exec_prefix>]
```

这是需要确保电脑中只有一个版本的python，这里需要python3.8。并且在`~/.bash_profile`中添加如下配置，执行`source ~/.bash_profile`命令使配置生效。

```bash
alias python="/Library/Frameworks/Python.framework/Versions/3.8/bin/python3.8"
alias pip="/Library/Frameworks/Python.framework/Versions/3.8/bin/pip3.8"
export PYTHONHOME="/Library/Frameworks/Python.framework/Versions/3.8/"
export PYTHONPATH="/Library/Frameworks/Python.framework/Versions/3.8/bin/"
```

The platform will start logging some interesting information

```log
{"category":"APP","level":"info","message":"[OPENCTI] Starting platform","timestamp":"2023-07-02T16:37:10.984Z","version":"5.8.7"}
{"category":"APP","level":"info","message":"[OPENCTI] Checking dependencies statuses","timestamp":"2023-07-02T16:37:10.987Z","version":"5.8.7"}
{"category":"APP","level":"info","message":"[SEARCH] Elasticsearch (8.5.2) client selected / runtime sorting enabled","timestamp":"2023-07-02T16:37:11.014Z","version":"5.8.7"}
{"category":"APP","level":"info","message":"[CHECK] Search engine is alive","timestamp":"2023-07-02T16:37:11.015Z","version":"5.8.7"}
...
{"category":"APP","level":"info","message":"[INIT] Platform initialization done","timestamp":"2023-07-02T16:37:11.622Z","version":"5.8.7"}
{"category":"APP","level":"info","message":"[OPENCTI] API ready on port 4000","timestamp":"2023-07-02T16:37:12.382Z","version":"5.8.7"}
```

If you want to start on another profile you can use the -e parameter.
For example here to use the profile.json configuration file.

```bash
yarn start -e profile
```
### 5.4 Code check

Before pushing your code you need to validate the syntax and ensure the testing will be validated.

#### 5.4.1 For validation

`yarn lint`

`yarn check-ts`

#### 5.4.2 For testing

For starting the test you will need to create a test.json file.
You can use the same dependencies by only adapting all prefix for all dependencies.

`yarn test:dev`

## 6.Frontend

### 6.1 Install / start

Before starting the backend you need to install the nodejs modules

```bash
cd ~/opencti/opencti-platform/opencti-front
yarn install
```

Then you can simply start the frontend with the yarn start command

```bash
cd ~/opencti/opencti-platform/opencti-front
yarn start
```

The frontend will start with some interesting information

```log
[INFO] [default] compiling...
[INFO] [default] compiled documents: 1592 reader, 1072 normalization, 1596 operation text
[INFO] Compilation completed.
[INFO] Done.
[HPM] Proxy created: /stream  -> http://localhost:4000
[HPM] Proxy created: /storage  -> http://localhost:4000
[HPM] Proxy created: /taxii2  -> http://localhost:4000
[HPM] Proxy created: /feeds  -> http://localhost:4000
[HPM] Proxy created: /graphql  -> http://localhost:4000
[HPM] Proxy created: /auth/**  -> http://localhost:4000
[HPM] Proxy created: /static/flags/**  -> http://localhost:4000
```

The web UI should be accessible on [http://127.0.0.1:3000](http://127.0.0.1:3000)

### 6.2 Code check

Before pushing your code you need to validate the syntax and ensure the testing will be validated.

#### 6.2.1 For validation

`yarn lint`

`yarn check-ts`

#### 6.2.2 For testing

`yarn test`

## 7.Worker

Running a worker is required when you want to develop on the ingestion or import/export connectors.

### 7.1 Python virtual env

```bash
cd ~/opencti/opencti-worker/src
python3 -m venv .venv --prompt "worker"
source .venv/bin/activate
pip3 install --upgrade pip wheel setuptools
pip3 install -r requirements.txt
deactivate
```

### 7.2 Install / start

```bash
cd ~/opencti/opencti-worker/src
source .venv/bin/activate
python worker.py
```

## 8.Connectors

For connectors development, please take a look to [Connectors](connectors.md) development dedicated page.

## 9.Production build

Based on development source you can build the package for production.
This package will be minified and optimized with esbuild.

```bash
$ cd opencti-frontend
$ yarn build
$ cd ../opencti-graphql
$ yarn build
```

After the build you can start the production build with yarn serv.
**This build will use the production.json configuration file**

```bash
$ cd ../opencti-graphql
$ yarn serv
```