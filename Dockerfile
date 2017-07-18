FROM node:6

RUN apt-get update && apt-get install ruby -y && gem install bundle

WORKDIR '/app'

COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY bower.json .bowerrc ./
RUN npm install bower && $(npm bin)/bower install --allow-root
COPY package.json ./
RUN npm install

COPY docker ./docker
COPY bin ./bin
COPY public ./public
COPY test ./test
COPY lib ./lib

EXPOSE 8001
ENTRYPOINT ["./docker/run.sh"]
CMD ["start"]
