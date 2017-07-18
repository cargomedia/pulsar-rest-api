FROM node:6

RUN apt-get update && apt-get install ruby -y && gem install bundle
ADD  . /app

WORKDIR '/app'
RUN bundle install
RUN npm install
CMD ["./docker/test.sh"]
