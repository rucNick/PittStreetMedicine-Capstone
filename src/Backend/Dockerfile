# Build stage
FROM maven:3.8.5-openjdk-17-slim AS build
WORKDIR /app
# Copy only the Maven files first for caching
COPY pom.xml .
RUN mvn dependency:go-offline

# Then copy source files and build the application
COPY src ./src
RUN mvn package -DskipTests

# Runtime stage with corrected image tag and keyword casing
FROM eclipse-temurin:21-jdk-alpine
VOLUME /tmp
# Copy the JAR built in the previous stage from the alias "build"
COPY --from=build /app/target/*.jar app.jar

# Define the entrypoint
ENTRYPOINT ["java", "-jar", "/app.jar"]
