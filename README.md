# ClassMate

A web app for displaying WebUntis grades in a beautiful and organized way.

## Disclaimer:

This project is not asociated to WebUntis or Untis® in any way.

## Prerequisites
Install NodeJS and yarn (preferably on Linux)

## Deployment:

1. Run `yarn install` to install all needed packages
2. Run `yarn build` to build the project for all locales
3. Copy the code in `./dist` to the deployment server
4. Configure your server [More info in the Angular docs](https://angular.io/guide/i18n-common-deploy#configure-a-server)
5. Configure proxy (this case [apache]()):
```
ProxyRequests Off
ProxyPassReverse "/api/" "https://mese.webuntis.com/"
ProxyPass "/api/" "https://mese.webuntis.com/"
```

### For deploying only one language

1. Run `yarn install` to install all needed packages
2. Run `yarn build --localize=de` to build the project for the german language
3. Edit `./dist/de/index.html` and change `<base href="/de/">` to `<base href="/">`
3. Copy the code in `./dist/de/` to the deployment server

## Change school

To change the school you just need to edit `apps/classmate/src/environments/environment.ts` and change the school variable and edit the proxy to use the appropiate server (mese.webuntis.com -> bob.webuntis.com)

## Further Information
[More info](Facharbeit.pdf)
