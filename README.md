# Cowch Player
This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Deployment

### Web
1. Install EAS CLI and log in (same credentials as EAS website).
```bash
npm install --global eas-cli
eas login
```
2. Export Web to `dist`
```bash
npx expo export --platform web
```
3. Deploy to EAS
```bash
eas deploy
```
4. Deploy production
```bash
eas deploy --prod
```