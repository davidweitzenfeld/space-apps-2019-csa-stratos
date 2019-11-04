FROM node:12.2.0 AS client-builder
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/ /app/
RUN npm install
RUN npm run heroku-postbuild

FROM openjdk:9 AS server-builder
WORKDIR /app
COPY server/gradle/ gradle/
COPY server/src/ src/
COPY server/resources/ resources/
COPY server/build.gradle server/gradle.properties server/gradlew server/settings.gradle ./
RUN ./gradlew build
RUN ls
RUN ls build

FROM openjdk:9-jre
COPY --from=client-builder /app/dist/client /static
COPY --from=server-builder /app/build/libs/*.jar ./
COPY --from=server-builder /app/build/resources/main resources/
ENV PORT 80
EXPOSE 80
CMD [ \
    "java", \
    "-server", \
    "-XX:+UnlockExperimentalVMOptions", \
    "-XX:+UseCGroupMemoryLimitForHeap", \
    "-XX:InitialRAMFraction=2", \
    "-XX:MinRAMFraction=2", \
    "-XX:MaxRAMFraction=2", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=100", \
    "-XX:+UseStringDeduplication", \
    "-jar", \
    "server-0.0.1-all.jar" \
]
