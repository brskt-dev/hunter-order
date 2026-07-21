# syntax=docker/dockerfile:1
# Build context is the repository root (needs global.json + Directory.Build.props).
#   docker build -f server/Dockerfile -t hunter-order-server .

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the files that drive restore first for better layer caching.
COPY global.json Directory.Build.props ./
COPY server/Directory.Packages.props ./server/
COPY server/HunterOrder.slnx ./server/
COPY server/src/ ./server/src/
COPY server/tests/ ./server/tests/

RUN dotnet restore server/HunterOrder.slnx

RUN dotnet publish server/src/HunterOrder.Bootstrap/HunterOrder.Bootstrap.csproj \
    --configuration Release \
    --no-restore \
    --output /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app ./

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Run as the non-root user provided by the .NET base image.
USER $APP_UID

ENTRYPOINT ["dotnet", "HunterOrder.Bootstrap.dll"]
