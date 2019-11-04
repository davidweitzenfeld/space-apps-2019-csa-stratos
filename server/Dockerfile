FROM openjdk:9 AS builder
WORKDIR /app
COPY gradle/ gradle/
COPY src/ src/
COPY resources/ resources/
COPY build.gradle gradle.properties gradlew settings.gradle ./
RUN ./gradlew build
RUN ls
RUN ls build

FROM openjdk:9-jre
COPY --from=builder /app/build/libs/*.jar ./
COPY --from=builder /app/build/resources/main resources/
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
