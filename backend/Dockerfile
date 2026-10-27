# Imagem do backend para hospedagem (Railway, Render, Fly.io...). Build em duas etapas: compila com o JDK e roda
# só com o JRE, como usuário sem privilégios.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home secretbook
COPY --from=build /app/target/secretbook-api-*.jar app.jar
USER secretbook
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
