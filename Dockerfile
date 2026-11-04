# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS frontend
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_URL=/api
ARG VITE_CONTATO_PRIVACIDADE=lucas.silva2014outbook@gmail.com
ENV VITE_CONTATO_PRIVACIDADE=$VITE_CONTATO_PRIVACIDADE
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api
WORKDIR /src
COPY api/TccSolidario.Api/TccSolidario.Api.csproj api/TccSolidario.Api/
RUN dotnet restore api/TccSolidario.Api/TccSolidario.Api.csproj
COPY api/TccSolidario.Api/ api/TccSolidario.Api/
RUN dotnet publish api/TccSolidario.Api/TccSolidario.Api.csproj -c Release -o /out --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=8080
ENV Database__AutoMigrate=false
ENV Database__SeedAdmin=false
ENV DadosTeste__Ativo=false
COPY --from=api --chown=app:app /out ./
COPY --from=frontend --chown=app:app /src/frontend/dist/ ./wwwroot/
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "TccSolidario.Api.dll"]
