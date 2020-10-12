# Dockerized playground for Mongo Change Streams test

## Written for an article on Medium

[Article](https://medium.com/@oleksandr.k/how-to-play-with-docker-node-mongodb-change-stream-c42e45cc84a4) 

## Prerequisites

App tested with

- Docker version 19.03.12,
- docker-compose version 1.26.2

App has a debug config for VScode

## Starting app

- ```docker-compose up -d```

## Debugging app

- start VScode debug on a port 4323

## Ports used

- 35000 for mongo
- 6400 for redis
- 4323 for debug
