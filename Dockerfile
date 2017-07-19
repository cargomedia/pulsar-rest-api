ARG FROM_TAG=6
FROM node:${FROM_TAG}

RUN apt-get update && \
    apt-get install ruby -y && \
    gem install bundle && \
    npm install -g bower

WORKDIR '/app'

COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY bower.json .bowerrc ./
RUN bower install --allow-root
COPY package.json ./
RUN npm install

COPY docker ./docker
COPY bin ./bin
COPY public ./public
COPY lib ./lib

EXPOSE 8001
ENTRYPOINT ["./docker/run.sh"]
CMD ["start"]
